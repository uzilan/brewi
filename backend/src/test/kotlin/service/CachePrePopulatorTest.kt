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

    @Test
    fun `should pre-populate cache with package commands and TLDR information`() =
        runBlocking {
            val mockExecutor = MockCommandExecutor()
            val brewService = BrewService(mockExecutor)
            val prePopulator = CachePrePopulator(brewService)

            // Clear cache before test
            brewService.clearCache()
            val initialStats = brewService.getCacheStats()
            assertThat(initialStats.totalEntries).isEqualTo(0)

            val packages = listOf("node", "python")

            // Pre-populate cache
            prePopulator.prePopulateSpecificPackages(packages)

            // Verify cache has entries for package data
            val stats = brewService.getCacheStats()
            assertThat(stats.totalEntries).isGreaterThan(0)

            // Verify package info is cached
            val nodePackageInfo = brewService.getPackageInfo("node")
            assertThat(nodePackageInfo).isNotNull()
            assertThat(nodePackageInfo.isSuccess).isTrue()

            // Verify package info with dependencies is cached
            val nodePackageInfoWithDeps = brewService.getPackageInfoWithDependencies("node", emptyList())
            assertThat(nodePackageInfoWithDeps).isNotNull()
            assertThat(nodePackageInfoWithDeps.isSuccess).isTrue()

            // Verify package commands are cached
            val nodeCommands = brewService.getPackageCommands("node")
            assertThat(nodeCommands).isNotNull()
            assertThat(nodeCommands.isSuccess).isTrue()
            assertThat(nodeCommands.commands).isNotEmpty()

            // Verify TLDR info is cached for each command
            nodeCommands.commands.forEach { command ->
                val tldrInfo = brewService.getTldrInfo(command)
                assertThat(tldrInfo).isNotNull()
                assertThat(tldrInfo.command).isEqualTo(command)
                // Note: TLDR might not be successful for all commands in mock data, but it should be cached
            }

            // Verify cache hit count increased due to pre-population
            val finalStats = brewService.getCacheStats()
            assertThat(finalStats.hitCount).isGreaterThan(0)
        }

    @Test
    fun `should pre-populate cache with comprehensive package data`() =
        runBlocking {
            val mockExecutor = MockCommandExecutor()
            val brewService = BrewService(mockExecutor)
            val prePopulator = CachePrePopulator(brewService)

            // Clear cache before test
            brewService.clearCache()

            // Pre-populate limited cache
            prePopulator.prePopulateLimitedPackages(limit = 3)

            // Verify cache has multiple types of entries
            val stats = brewService.getCacheStats()
            assertThat(stats.totalEntries).isGreaterThan(0)

            // Verify that we have entries for different cache types
            // This test verifies that the pre-population is working comprehensively
            val testPackage = "node" // This should be in our mock data
            
            // Test that all cache types are populated
            val packageInfo = brewService.getPackageInfo(testPackage)
            val packageInfoWithDeps = brewService.getPackageInfoWithDependencies(testPackage, emptyList())
            val packageCommands = brewService.getPackageCommands(testPackage)
            
            assertThat(packageInfo.isSuccess).isTrue()
            assertThat(packageInfoWithDeps.isSuccess).isTrue()
            assertThat(packageCommands.isSuccess).isTrue()
            
            // Verify that subsequent calls hit the cache
            val statsAfterAccess = brewService.getCacheStats()
            assertThat(statsAfterAccess.hitCount).isGreaterThan(stats.hitCount)
        }
}
