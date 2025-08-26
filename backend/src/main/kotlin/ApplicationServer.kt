import io.ktor.http.HttpStatusCode
import io.ktor.serialization.jackson.jackson
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.swagger.swaggerUI
import io.ktor.server.response.respond
import io.ktor.server.response.respondFile
import io.ktor.server.response.respondText
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import model.BrewCommandResult
import model.TldrResult
import service.BrewService
import service.CachePrePopulator

object ApplicationServer {
    @JvmStatic
    fun main(args: Array<String>) {
        embeddedServer(Netty, port = 8080, host = "localhost") {
            module()
        }.start(wait = true)
    }

    fun Application.module() {
        val brewService = BrewService()
        val cachePrePopulator = CachePrePopulator(brewService)

        // Start cache pre-population in background (limited to first 20 packages)
        val applicationScope = CoroutineScope(Dispatchers.IO)
        applicationScope.launch {
            try {
                log.info("Starting limited cache pre-population...")
                cachePrePopulator.prePopulateLimitedPackages(limit = 20)
                log.info("Limited cache pre-population completed")
            } catch (e: Exception) {
                log.error("Error during cache pre-population: ${e.message}", e)
            }
        }

        install(ContentNegotiation) {
            jackson()
        }

        install(CORS) {
            // Local-only CORS: backend runs on localhost, frontend on localhost:3000
            allowCredentials = true
            allowNonSimpleContentTypes = true

            // Explicitly allow local dev origins
            allowHost("localhost:3000", schemes = listOf("http"))
            allowHost("127.0.0.1:3000", schemes = listOf("http"))
        }

        routing {
            // Serve Swagger UI at /swagger using the OpenAPI spec from resources
            swaggerUI(path = "swagger", swaggerFile = "openapi/documentation.yaml")
            get("/health") {
                log.info("Health endpoint hit")
                call.respondText("OK")
            }

            // Serve the main React app
            get("/") {
                call.respondText(
                    java.io.File("src/main/resources/static/index.html").readText(),
                    io.ktor.http.ContentType.Text.Html,
                )
            }

            // Serve favicon.ico
            get("/favicon.ico") {
                val file = java.io.File("src/main/resources/static/favicon.ico")
                if (file.exists()) {
                    call.respondFile(file)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Serve robots.txt
            get("/robots.txt") {
                val file = java.io.File("src/main/resources/static/robots.txt")
                if (file.exists()) {
                    call.respondFile(file)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Serve CSS files
            get("/static/css/{fileName}") {
                val fileName = call.parameters["fileName"] ?: ""
                log.info("CSS file request for: $fileName")
                val file = java.io.File("src/main/resources/static/static/css/$fileName")
                if (file.exists() && file.isFile) {
                    call.respondText(file.readText(), io.ktor.http.ContentType.Text.CSS)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Serve JS files
            get("/static/js/{fileName}") {
                val fileName = call.parameters["fileName"] ?: ""
                log.info("JS file request for: $fileName")
                val file = java.io.File("src/main/resources/static/static/js/$fileName")
                if (file.exists() && file.isFile) {
                    call.respondText(file.readText(), io.ktor.http.ContentType.Application.JavaScript)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }

            // Handle client-side routing by serving index.html for all non-API routes
            get("/{...}") {
                val path = call.parameters.getAll("...")?.firstOrNull() ?: ""
                // Don't serve index.html for API routes or static files
                if (!path.startsWith("api/") && !path.startsWith("static/") &&
                    !path.startsWith("swagger") && path != "favicon.ico" &&
                    path != "robots.txt" && path != "health"
                ) {
                    call.respondText(
                        java.io.File("src/main/resources/static/index.html").readText(),
                        io.ktor.http.ContentType.Text.Html,
                    )
                }
            }

            get("/api/packages/{packageName}") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@get
                }
                log.info("Get package info endpoint hit for package: $packageName")
                val result = brewService.getPackageInfoWithDependencies(packageName, emptyList())
                call.respond(result)
            }

            get("/api/packages") {
                log.info("List packages endpoint hit")
                val result = brewService.listPackages()
                call.respond(result)
            }

            get("/api/packages/search/{query}") {
                val query = call.parameters["query"]
                if (query.isNullOrBlank()) {
                    call.respondText("Search query is required", status = HttpStatusCode.BadRequest)
                    return@get
                }
                log.info("Search packages endpoint hit for query: $query")
                val result = brewService.searchPackages(query)
                call.respond(result)
            }

            post("/api/packages/upgrade") {
                log.info("Update and upgrade endpoint hit")
                val result = brewService.updateAndUpgrade()
                call.respond(result)
            }

            post("/api/packages/doctor") {
                log.info("Brew doctor endpoint hit")
                val result = brewService.runDoctor()
                call.respond(result)
            }

            get("/api/packages/last-update") {
                log.info("Get last update time endpoint hit")
                val result = brewService.getLastUpdateTime()
                call.respond(result)
            }

            post("/api/packages/{packageName}/install") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@post
                }
                log.info("Install package endpoint hit for package: $packageName")
                try {
                    val result = brewService.installPackage(packageName)
                    log.info(
                        "Install package result for $packageName: success=${result.isSuccess}, " +
                            "exitCode=${result.exitCode}",
                    )
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error installing package $packageName: ${e.message}", e)
                    val errorResult =
                        model.BrewCommandResult(
                            isSuccess = false,
                            output = "",
                            errorMessage = "Failed to install package: ${e.message}",
                            exitCode = -1,
                        )
                    call.respond(errorResult)
                }
            }

            delete("/api/packages/{packageName}/uninstall") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@delete
                }
                log.info("Uninstall package endpoint hit for package: $packageName")
                try {
                    val result = brewService.uninstallPackage(packageName)
                    log.info(
                        "Uninstall package result for $packageName: success=${result.isSuccess}, " +
                            "exitCode=${result.exitCode}",
                    )
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error uninstalling package $packageName: ${e.message}", e)
                    val errorResult =
                        model.BrewCommandResult(
                            isSuccess = false,
                            output = "",
                            errorMessage = "Failed to uninstall package: ${e.message}",
                            exitCode = -1,
                        )
                    call.respond(errorResult)
                }
            }

            get("/api/packages/{packageName}/commands") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@get
                }
                log.info("Get package commands endpoint hit for package: $packageName")
                try {
                    val result = brewService.getPackageCommands(packageName)
                    log.info(
                        "Get package commands result for $packageName: success=${result.isSuccess}, " +
                            "exitCode=${result.exitCode}",
                    )
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error getting package commands for $packageName: ${e.message}", e)
                    val errorResult =
                        model.BrewCommandResult(
                            isSuccess = false,
                            output = "",
                            errorMessage = "Failed to get package commands: ${e.message}",
                            exitCode = -1,
                        )
                    call.respond(errorResult)
                }
            }

            get("/api/tldr/{command}") {
                val command = call.parameters["command"]
                if (command.isNullOrBlank()) {
                    call.respondText("Command name is required", status = HttpStatusCode.BadRequest)
                    return@get
                }
                log.info("Get tldr info endpoint hit for command: $command")
                try {
                    val result = brewService.getTldrInfo(command)
                    log.info(
                        "Get tldr info result for $command: success=${result.isSuccess}, " +
                            "exitCode=${result.exitCode}",
                    )
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error getting tldr info for $command: ${e.message}", e)
                    val errorResult =
                        TldrResult(
                            command = command,
                            output = "",
                            isSuccess = false,
                            errorMessage = "Failed to get tldr info: ${e.message}",
                            exitCode = -1,
                        )
                    call.respond(errorResult)
                }
            }

            get("/openapi/documentation.yaml") {
                try {
                    val content =
                        java.io
                            .File(
                                "/Users/uzilan/dev/brewanator/backend/src/main/resources/openapi/documentation.yaml",
                            )
                            .readText()
                    call.respondText(content)
                } catch (e: Exception) {
                    log.error("Error reading OpenAPI documentation file: ${e.message}", e)
                    call.respondText(
                        "Error reading file: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }

            // Cache management endpoints
            get("/api/cache/stats") {
                log.info("Get cache stats endpoint hit")
                try {
                    val stats = brewService.getCacheStats()
                    call.respond(stats)
                } catch (e: Exception) {
                    log.error("Error getting cache stats: ${e.message}", e)
                    call.respondText(
                        "Error getting cache stats: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }

            delete("/api/cache/clear") {
                log.info("Clear cache endpoint hit")
                try {
                    brewService.clearCache()
                    call.respondText("Cache cleared successfully")
                } catch (e: Exception) {
                    log.error("Error clearing cache: ${e.message}", e)
                    call.respondText(
                        "Error clearing cache: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }

            post("/api/cache/pre-populate") {
                log.info("Pre-populate cache endpoint hit")
                try {
                    // Start cache pre-population in background
                    val applicationScope = CoroutineScope(Dispatchers.IO)
                    applicationScope.launch {
                        try {
                            log.info("Starting manual cache pre-population...")
                            cachePrePopulator.prePopulateCache()
                            log.info("Manual cache pre-population completed")
                        } catch (e: Exception) {
                            log.error("Error during manual cache pre-population: ${e.message}", e)
                        }
                    }
                    call.respondText("Cache pre-population started in background")
                } catch (e: Exception) {
                    log.error("Error starting cache pre-population: ${e.message}", e)
                    call.respondText(
                        "Error starting cache pre-population: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }

            post("/api/cache/pre-populate/limited") {
                log.info("Pre-populate limited cache endpoint hit")
                try {
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
                    // Start limited cache pre-population in background
                    val applicationScope = CoroutineScope(Dispatchers.IO)
                    applicationScope.launch {
                        try {
                            log.info("Starting manual limited cache pre-population with limit: $limit")
                            cachePrePopulator.prePopulateLimitedPackages(limit)
                            log.info("Manual limited cache pre-population completed")
                        } catch (e: Exception) {
                            log.error("Error during manual limited cache pre-population: ${e.message}", e)
                        }
                    }
                    call.respondText("Limited cache pre-population started in background with limit: $limit")
                } catch (e: Exception) {
                    log.error("Error starting limited cache pre-population: ${e.message}", e)
                    call.respondText(
                        "Error starting limited cache pre-population: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }

            post("/api/cache/pre-populate/{packageName}") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@post
                }
                log.info("Pre-populate cache for specific package endpoint hit: $packageName")
                try {
                    // Start cache pre-population in background
                    val applicationScope = CoroutineScope(Dispatchers.IO)
                    applicationScope.launch {
                        try {
                            log.info("Starting cache pre-population for package: $packageName")
                            cachePrePopulator.prePopulateSpecificPackages(listOf(packageName))
                            log.info("Cache pre-population for package $packageName completed")
                        } catch (e: Exception) {
                            log.error("Error during cache pre-population for package $packageName: ${e.message}", e)
                        }
                    }
                    call.respondText("Cache pre-population for $packageName started in background")
                } catch (e: Exception) {
                    log.error("Error starting cache pre-population for package $packageName: ${e.message}", e)
                    call.respondText(
                        "Error starting cache pre-population: ${e.message}",
                        status = HttpStatusCode.InternalServerError,
                    )
                }
            }
        }

        log.info("Brewi backend service initialized")
        log.info("BrewService is ready for use")
        log.info("Health check available at: http://localhost:8080/health")
        log.info("List packages available at: http://localhost:8080/api/packages")
        log.info("Get package info at: http://localhost:8080/api/packages/{packageName}")
        log.info("Get package commands at: http://localhost:8080/api/packages/{packageName}/commands")
        log.info("Get tldr info at: http://localhost:8080/api/tldr/{command}")
        log.info("Search packages at: http://localhost:8080/api/packages/search/{query}")
        log.info("Install packages at: http://localhost:8080/api/packages/{packageName}/install")
        log.info("Uninstall packages at: http://localhost:8080/api/packages/{packageName}/uninstall")
        log.info("Update and upgrade at: http://localhost:8080/api/packages/upgrade")
        log.info("Run brew doctor at: http://localhost:8080/api/packages/doctor")
        log.info("Get last update time at: http://localhost:8080/api/packages/last-update")
        log.info("Cache stats available at: http://localhost:8080/api/cache/stats")
        log.info("Clear cache available at: http://localhost:8080/api/cache/clear")
        log.info("Pre-populate cache available at: http://localhost:8080/api/cache/pre-populate")
        log.info("Pre-populate limited cache at: http://localhost:8080/api/cache/pre-populate/limited?limit=20")
        log.info("Pre-populate specific package at: http://localhost:8080/api/cache/pre-populate/{packageName}")
        log.info("Swagger UI available at: http://localhost:8080/swagger")
    }
}
