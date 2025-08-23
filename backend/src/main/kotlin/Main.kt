import io.ktor.http.*
import io.ktor.serialization.jackson.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.request.*
import service.BrewService

object ApplicationServer {
    @JvmStatic
    fun main(args: Array<String>) {
        embeddedServer(Netty, port = 8080, host = "localhost") {
            module()
        }.start(wait = true)
    }

    fun Application.module() {
        val brewService = BrewService()

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

            get("/api/packages/{packageName}") {
                val packageName = call.parameters["packageName"]
                if (packageName.isNullOrBlank()) {
                    call.respondText("Package name is required", status = HttpStatusCode.BadRequest)
                    return@get
                }
                log.info("Get package info endpoint hit for package: $packageName")
                val result = brewService.getPackageInfoWithDependencies(packageName)
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
                    log.info("Install package result for $packageName: success=${result.isSuccess}, exitCode=${result.exitCode}")
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error installing package $packageName: ${e.message}", e)
                    val errorResult = model.BrewCommandResult(
                        isSuccess = false,
                        output = "",
                        errorMessage = "Failed to install package: ${e.message}",
                        exitCode = -1
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
                    log.info("Uninstall package result for $packageName: success=${result.isSuccess}, exitCode=${result.exitCode}")
                    call.respond(result)
                } catch (e: Exception) {
                    log.error("Error uninstalling package $packageName: ${e.message}", e)
                    val errorResult = model.BrewCommandResult(
                        isSuccess = false,
                        output = "",
                        errorMessage = "Failed to uninstall package: ${e.message}",
                        exitCode = -1
                    )
                    call.respond(errorResult)
                }
            }

            get("/openapi/documentation.yaml") {
                try {
                    val content =
                        java.io
                            .File("/Users/uzilan/dev/brewanator/backend/src/main/resources/openapi/documentation.yaml")
                            .readText()
                    call.respondText(content)
                } catch (e: Exception) {
                    log.error("Error reading OpenAPI documentation file: ${e.message}", e)
                    call.respondText("Error reading file: ${e.message}", status = HttpStatusCode.InternalServerError)
                }
            }
        }

        log.info("Brewanator backend service initialized")
        log.info("BrewService is ready for use")
        log.info("Health check available at: http://localhost:8080/health")
        log.info("List packages available at: http://localhost:8080/api/packages")
        log.info("Get package info at: http://localhost:8080/api/packages/{packageName}")
        log.info("Search packages at: http://localhost:8080/api/packages/search/{query}")
        log.info("Install packages at: http://localhost:8080/api/packages/{packageName}/install")
        log.info("Uninstall packages at: http://localhost:8080/api/packages/{packageName}/uninstall")
        log.info("Update and upgrade at: http://localhost:8080/api/packages/upgrade")
        log.info("Get last update time at: http://localhost:8080/api/packages/last-update")
        log.info("Swagger UI available at: http://localhost:8080/swagger")
    }
}
