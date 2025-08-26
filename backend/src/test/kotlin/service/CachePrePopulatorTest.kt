package service

import kotlinx.coroutines.runBlocking
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class CachePrePopulatorTest {
    @Test
    fun `should create cache pre-populator with default concurrency`() {
        val brewService = BrewService()
        val prePopulator = CachePrePopulator(brewService)

        assertThat(prePopulator).isNotNull()
    }

    @Test
    fun `should create cache pre-populator with custom concurrency`() {
        val brewService = BrewService()
        val prePopulator = CachePrePopulator(brewService, maxConcurrency = 8)

        assertThat(prePopulator).isNotNull()
    }

    @Test
    fun `should pre-populate cache for specific packages`() =
        runBlocking {
            val mockExecutor = MockCommandExecutor()
            val brewService = BrewService(mockExecutor)
            val prePopulator = CachePrePopulator(brewService)

            val packages = listOf("node", "python")

            // Pre-populate cache
            prePopulator.prePopulateSpecificPackages(packages)

            // Verify cache has entries
            val stats = brewService.getCacheStats()
            assertThat(stats.totalEntries).isGreaterThan(0)
        }

    @Test
    fun `should pre-populate limited packages`() =
        runBlocking {
            val mockExecutor = MockCommandExecutor()
            val brewService = BrewService(mockExecutor)
            val prePopulator = CachePrePopulator(brewService)

            // Pre-populate limited cache
            prePopulator.prePopulateLimitedPackages(limit = 5)

            // Verify cache has entries
            val stats = brewService.getCacheStats()
            assertThat(stats.totalEntries).isGreaterThan(0)
        }

    @Test
    fun `should handle errors during pre-population gracefully`() =
        runBlocking {
            val mockExecutor = MockCommandExecutor()
            val brewService = BrewService(mockExecutor)
            val prePopulator = CachePrePopulator(brewService)

            // Try to pre-populate with non-existent packages
            val packages = listOf("non-existent-package-1", "non-existent-package-2")

            // This should not throw an exception
            prePopulator.prePopulateSpecificPackages(packages)

            // Verify the service is still functional
            val stats = brewService.getCacheStats()
            assertThat(stats).isNotNull()
        }

    @Test
    fun `should shutdown gracefully`() {
        val brewService = BrewService()
        val prePopulator = CachePrePopulator(brewService)

        // This should not throw an exception
        prePopulator.shutdown()
    }
}
