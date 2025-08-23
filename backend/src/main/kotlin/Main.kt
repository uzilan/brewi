import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.response.respondText
import io.ktor.server.response.respondFile
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.webjars.Webjars
import io.ktor.http.HttpStatusCode
import service.BrewService

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    val brewService = BrewService()
    
    install(Webjars) {
        path = "/webjars"
    }
    
    routing {
        get("/health") {
            println("Health endpoint hit")
            call.respondText("OK")
        }
        
        get("/swagger") {
            call.respondFile(java.io.File("/Users/uzilan/dev/brewanator/backend/src/main/resources/static/swagger-ui/index.html"))
        }
        
        get("/{path...}") {
            val path = call.parameters.getAll("path")?.joinToString("/") ?: ""
            
            // Handle OpenAPI documentation
            if (path == "openapi/documentation.yaml") {
                try {
                    val content = java.io.File("/Users/uzilan/dev/brewanator/backend/src/main/resources/openapi/documentation.yaml").readText()
                    call.respondText(content)
                } catch (e: Exception) {
                    call.respondText("Error reading file: ${e.message}", status = HttpStatusCode.InternalServerError)
                }
                return@get
            }
            
            // Handle static files from swagger-ui directory
            val file = java.io.File("/Users/uzilan/dev/brewanator/backend/src/main/resources/static/swagger-ui/$path")
            if (file.exists() && file.isFile) {
                call.respondFile(file)
            } else {
                call.respondText("File not found: $path", status = HttpStatusCode.NotFound)
            }
        }
    }
    
    println("Brewanator backend service initialized")
    println("BrewService is ready for use")
    println("Health check available at: http://localhost:8080/health")
    println("Dark Cat Swagger UI available at: http://localhost:8080/swagger")
}


