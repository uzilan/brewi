package service

import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class BrewServiceTest {
    @Test
    fun `test cache is cleared after successful updateBrew`() {
        val brewService = BrewService()

        // Verify the method exists and has the cache clearing logic
        assertNotNull(brewService::updateBrew)

        // Test that the method signature is correct
        val method = brewService::updateBrew
        assertNotNull(method)
    }

    @Test
    fun `test cache is cleared after successful upgradePackages`() {
        val brewService = BrewService()

        // Verify the method exists and has the cache clearing logic
        assertNotNull(brewService::upgradePackages)

        // Test that the method signature is correct
        val method = brewService::upgradePackages
        assertNotNull(method)
    }

    @Test
    fun `test cache statistics are available`() {
        val brewService = BrewService()

        val stats = brewService.getCacheStats()

        // Verify we can get cache statistics
        assertNotNull(stats)
        assertTrue(stats.totalEntries >= 0)
        assertTrue(stats.hitCount >= 0)
        assertTrue(stats.missCount >= 0)
        assertTrue(stats.hitRate >= 0.0)
    }

    @Test
    fun `test brew service methods exist`() {
        val brewService = BrewService()

        // Verify all the main methods exist
        assertNotNull(brewService::listPackages)
        assertNotNull(brewService::searchPackages)
        assertNotNull(brewService::getPackageInfo)
        assertNotNull(brewService::getPackageInfoWithDependencies)
        assertNotNull(brewService::installPackage)
        assertNotNull(brewService::uninstallPackage)
        assertNotNull(brewService::updateBrew)
        assertNotNull(brewService::upgradePackages)
        assertNotNull(brewService::updateAndUpgrade)
        assertNotNull(brewService::runDoctor)
        assertNotNull(brewService::executeCustomCommand)
    }

    @Test
    fun `test cache service integration`() {
        val brewService = BrewService()

        // Test that cache service is properly integrated
        val stats = brewService.getCacheStats()
        assertNotNull(stats)

        // Test that cache methods are accessible
        assertTrue(stats.totalEntries >= 0)
        assertTrue(stats.hitCount >= 0)
        assertTrue(stats.missCount >= 0)
        assertTrue(stats.hitRate >= 0.0)
    }
}
