package routes

import ApplicationServer.module
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.jackson.jackson
import io.ktor.server.testing.testApplication
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class EndpointTest {
    @Test
    fun `GET health returns OK`() =
        testApplication {
            application { module() }
            val client =
                createClient {
                    install(ContentNegotiation) { jackson() }
                }
            val response = client.get("/health")
            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("OK", response.bodyAsText())
            assertTrue(response.headers["Content-Type"]?.startsWith("text/plain") == true)
        }

    @Test
    fun `GET openapi documentation returns yaml`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/openapi/documentation.yaml")
            assertEquals(HttpStatusCode.OK, response.status)
            // Should be YAML/plain text
            assertTrue(response.headers["Content-Type"]?.startsWith("text/plain") == true)
            val text = response.bodyAsText()
            assertTrue(text.contains("openapi: 3.0.3"))
            assertTrue(text.contains("Brewanator API"))
        }
}
