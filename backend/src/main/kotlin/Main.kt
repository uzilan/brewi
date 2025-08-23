import io.ktor.http.HttpStatusCode
import io.ktor.serialization.jackson.jackson
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.application.log
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.swagger.swaggerUI
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import model.BrewListResult
import service.BrewService

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    val brewService = BrewService()

    install(ContentNegotiation) {
        jackson()
    }

    routing {
        // Serve Swagger UI at /swagger using the OpenAPI spec from resources
        swaggerUI(path = "swagger", swaggerFile = "openapi/documentation.yaml")
        get("/health") {
            log.info("Health endpoint hit")
            call.respondText("OK")
        }

        get("/api/packages") {
            log.info("List packages endpoint hit")
            val result = brewService.listPackages()
            call.respond(result)
        }

        get("/openapi/documentation.yaml") {
            try {
                val content = java.io.File("/Users/uzilan/dev/brewanator/backend/src/main/resources/openapi/documentation.yaml").readText()
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
    log.info("Swagger UI available at: http://localhost:8080/swagger")
}
