package routes

import ApplicationServer.module
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.delete
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

    @Test
    fun `GET api packages returns packages list`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/api/packages")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("packages"))
            assertTrue(body.contains("totalCount"))
        }

    @Test
    fun `GET api packages search returns search results`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/api/packages/search/python")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("python"))
        }

    @Test
    fun `GET api packages packageName returns package info`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/api/packages/node")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("node"))
            assertTrue(body.contains("dependencies"))
            assertTrue(body.contains("dependents"))
        }

    @Test
    fun `GET api packages packageName handles non-existent package`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/api/packages/non-existent-package-12345")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("non-existent-package-12345"))
            assertTrue(body.contains("isSuccess"))
        }

    @Test
    fun `POST api packages upgrade returns update result`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.post("/api/packages/upgrade")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("isSuccess"))
            assertTrue(body.contains("output"))
        }

    @Test
    fun `POST api packages doctor returns doctor result`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.post("/api/packages/doctor")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("isSuccess"))
            assertTrue(body.contains("output"))
        }

    @Test
    fun `GET api packages last-update returns update time`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.get("/api/packages/last-update")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("isSuccess"))
            assertTrue(body.contains("output"))
        }

    @Test
    fun `POST api packages packageName install returns install result`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.post("/api/packages/test-package/install")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("isSuccess"))
            assertTrue(body.contains("output"))
        }

    @Test
    fun `DELETE api packages packageName uninstall returns uninstall result`() =
        testApplication {
            application { module() }
            val client = createClient { install(ContentNegotiation) { jackson() } }

            val response = client.delete("/api/packages/test-package/uninstall")
            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertTrue(body.contains("isSuccess"))
            assertTrue(body.contains("output"))
        }
}
