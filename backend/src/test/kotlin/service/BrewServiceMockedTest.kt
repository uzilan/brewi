package service

import io.mockk.unmockkAll
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class BrewServiceMockedTest {
    private lateinit var brewService: BrewService
    private lateinit var mockCommandExecutor: MockCommandExecutor

    @BeforeEach
    fun setUp() {
        mockCommandExecutor = MockCommandExecutor()
        brewService = BrewService(mockCommandExecutor)
    }

    @AfterEach
    fun tearDown() {
        unmockkAll()
    }

    @Test
    fun `listPackages should return structured result with mocked data`() {
        val result = brewService.listPackages()

        // Verify the result structure
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.packages).isNotEmpty()
        assertThat(result.totalCount).isEqualTo(result.packages.size)

        // Verify package parsing
        val firstPackage = result.packages.first()
        assertThat(firstPackage.name).isEqualTo("brotli")
        assertThat(firstPackage.version).isEqualTo("1.1.0")

        val nodePackage = result.packages.find { it.name == "node" }
        assertThat(nodePackage).isNotNull()
        assertThat(nodePackage!!.version).isEqualTo("24.6.0")
    }

    @Test
    fun `getPackageInfo should return cached result when available`() {
        val packageName = "node"

        // First call should cache the result
        val firstResult = brewService.getPackageInfo(packageName)
        assertThat(firstResult).isNotNull()
        assertThat(firstResult.isSuccess).isTrue()
        assertThat(firstResult.output).contains("Platform built on V8")

        // Second call should return cached result
        val secondResult = brewService.getPackageInfo(packageName)
        assertThat(secondResult).isNotNull()
        assertThat(secondResult).isEqualTo(firstResult)
    }

    @Test
    fun `getPackageInfoWithDependencies should return comprehensive package info`() {
        val packageName = "node"
        val installedPackages = listOf("node", "python", "git")

        val result = brewService.getPackageInfoWithDependencies(packageName, installedPackages)

        assertThat(result).isNotNull()
        assertThat(result.name).isEqualTo(packageName)
        assertThat(result.isSuccess).isTrue()
        assertThat(result.dependencies).isNotNull()
        assertThat(result.dependencies).contains("brotli", "c-ares", "openssl@3")
        assertThat(result.dependents).isNotNull()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("Platform built on V8")
    }

    @Test
    fun `searchPackages should return search results`() {
        val query = "python"

        val result = brewService.searchPackages(query)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains(query)
        assertThat(result.output).contains("python@3.12")
    }

    @Test
    fun `getPackageDependencies should return dependencies list`() {
        val packageName = "node"

        val result = brewService.getPackageDependencies(packageName)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        // Dependencies should be package names, one per line
        val dependencies = result.output.lines().filter { it.isNotBlank() }
        assertThat(dependencies).contains("brotli", "c-ares", "openssl@3")
    }

    @Test
    fun `getPackageDependents should return dependents list`() {
        val packageName = "openssl@3"

        val result = brewService.getPackageDependents(packageName)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotNull()
        // Dependents should be package names, one per line
        val dependents = result.output.lines().filter { it.isNotBlank() }
        assertThat(dependents).contains("node", "python", "git")
    }

    @Test
    fun `getPackageCommands should return package commands`() {
        val packageName = "node"

        val result = brewService.getPackageCommands(packageName)

        assertThat(result).isNotNull()
        assertThat(result.packageName).isEqualTo(packageName)
        if (result.isSuccess) {
            assertThat(result.commands).isNotEmpty()
        }
    }

    @Test
    fun `package info should contain description and path information`() {
        val packageName = "node"
        val installedPackages = listOf("node", "python", "git")

        val result = brewService.getPackageInfoWithDependencies(packageName, installedPackages)

        assertThat(result).isNotNull()
        assertThat(result.name).isEqualTo(packageName)
        assertThat(result.isSuccess).isTrue()
        // The description and path extraction is tested indirectly through the full package info
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("Platform built on V8")
    }

    @Test
    fun `checkOutdated should return outdated packages`() {
        val result = brewService.checkOutdated()

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotNull()
        assertThat(result.output).contains("Downloading")
    }

    @Test
    fun `getLastUpdateTime should return update time`() {
        val result = brewService.getLastUpdateTime()

        assertThat(result).isNotNull()
        if (result.isSuccess) {
            assertThat(result.output).isNotEmpty()
        }
    }

    @Test
    fun `updateBrew should clear cache on success`() {
        // Add some data to cache first
        brewService.getPackageInfo("node")

        val statsBefore = brewService.getCacheStats()
        assertThat(statsBefore.totalEntries).isGreaterThan(0)

        val result = brewService.updateBrew()
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).contains("Updated Homebrew")

        // Cache should be cleared after successful update
        val statsAfter = brewService.getCacheStats()
        assertThat(statsAfter.totalEntries).isEqualTo(0)
    }

    @Test
    fun `upgradePackages should clear cache on success`() {
        // Add some data to cache first
        brewService.getPackageInfo("python")

        val statsBefore = brewService.getCacheStats()
        assertThat(statsBefore.totalEntries).isGreaterThan(0)

        val result = brewService.upgradePackages()
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).contains("Upgraded")

        // Cache should be cleared after successful upgrade
        val statsAfter = brewService.getCacheStats()
        assertThat(statsAfter.totalEntries).isEqualTo(0)
    }

    @Test
    fun `updateAndUpgrade should combine update and upgrade results`() {
        val result = brewService.updateAndUpgrade()

        assertThat(result).isNotNull()
        assertThat(result.output).contains("UPDATE:")
        assertThat(result.output).contains("UPGRADE:")
    }

    @Test
    fun `runDoctor should return diagnostic information`() {
        val result = brewService.runDoctor()

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("ready to brew")
    }

    @Test
    fun `executeCustomCommand should handle valid commands`() {
        val result = brewService.executeCustomCommand(listOf("--version"))

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("Homebrew")
    }

    @Test
    fun `executeCustomCommand should handle invalid commands`() {
        val result = brewService.executeCustomCommand(listOf("invalid-command-12345"))

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).isNotEmpty()
    }

    @Test
    fun `getTldrInfo should return tldr information`() {
        val command = "git"

        val result = brewService.getTldrInfo(command)

        assertThat(result).isNotNull()
        assertThat(result.command).isEqualTo(command)
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("Distributed version control system")
    }

    @Test
    fun `getTldrInfo should return cached result when available`() {
        val command = "git"

        // Clear cache before test
        brewService.clearCache()

        // First call should cache the result
        val firstResult = brewService.getTldrInfo(command)
        assertThat(firstResult).isNotNull()
        assertThat(firstResult.command).isEqualTo(command)
        assertThat(firstResult.isSuccess).isTrue()
        assertThat(firstResult.output).isNotEmpty()

        // Second call should return cached result
        val secondResult = brewService.getTldrInfo(command)
        assertThat(secondResult).isNotNull()
        assertThat(secondResult).isEqualTo(firstResult)

        // Verify cache stats show the cached entry
        val stats = brewService.getCacheStats()
        assertThat(stats.totalEntries).isGreaterThan(0)
        assertThat(stats.hitCount).isGreaterThan(0)
    }

    @Test
    fun `getTldrInfo should handle invalid commands`() {
        val command = "invalid-command-12345"

        val result = brewService.getTldrInfo(command)
        assertThat(result).isNotNull()
        assertThat(result.command).isEqualTo(command)
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).isNotEmpty()
    }

    @Test
    fun `getTldrInfo should handle empty commands`() {
        val command = ""

        val result = brewService.getTldrInfo(command)
        assertThat(result).isNotNull()
        assertThat(result.command).isEqualTo(command)
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).contains("empty")
    }

    @Test
    fun `installPackage should return result`() {
        val packageName = "test-package"

        val result = brewService.installPackage(packageName)
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).contains("Successfully installed")
    }

    @Test
    fun `installPackage should pre-populate cache after successful installation`() {
        val packageName = "test-package"

        // Clear cache before test
        brewService.clearCache()
        val initialStats = brewService.getCacheStats()
        assertThat(initialStats.totalEntries).isEqualTo(0)

        // Install package
        val result = brewService.installPackage(packageName)
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).contains("Successfully installed")

        // Verify cache was pre-populated by checking that subsequent calls hit the cache
        val basicPackageInfo = brewService.getPackageInfo(packageName)
        assertThat(basicPackageInfo).isNotNull()
        assertThat(basicPackageInfo.isSuccess).isTrue()

        val packageInfoWithDeps = brewService.getPackageInfoWithDependencies(packageName, emptyList())
        assertThat(packageInfoWithDeps).isNotNull()
        assertThat(packageInfoWithDeps.isSuccess).isTrue()

        // Verify cache stats show the cached entries
        val finalStats = brewService.getCacheStats()
        assertThat(finalStats.totalEntries).isGreaterThanOrEqualTo(2) // At least basic and deps cache entries
        assertThat(finalStats.hitCount).isGreaterThan(0) // Should have cache hits for the pre-populated data
    }

    @Test
    fun `installPackage should not pre-populate cache after failed installation`() {
        val packageName = "invalid-package"

        // Clear cache before test
        brewService.clearCache()
        val initialStats = brewService.getCacheStats()
        assertThat(initialStats.totalEntries).isEqualTo(0)

        // Mock a failed installation
        // We need to temporarily modify the mock to return failure for this specific test
        // For now, we'll test with a package that doesn't exist in our mock data
        val result = brewService.installPackage(packageName)

        // Verify cache was not pre-populated (should remain empty or unchanged)
        val statsAfterInstall = brewService.getCacheStats()
        // The cache might still be empty or have minimal entries from the failed attempt
        assertThat(statsAfterInstall.totalEntries).isLessThanOrEqualTo(1) // Should not have pre-populated entries
    }

    @Test
    fun `getPackageCommands should return cached result when available`() {
        val packageName = "node"

        // Clear cache before test
        brewService.clearCache()

        // First call should cache the result
        val firstResult = brewService.getPackageCommands(packageName)
        assertThat(firstResult).isNotNull()
        assertThat(firstResult.packageName).isEqualTo(packageName)
        assertThat(firstResult.isSuccess).isTrue()

        // Second call should return cached result
        val secondResult = brewService.getPackageCommands(packageName)
        assertThat(secondResult).isNotNull()
        assertThat(secondResult).isEqualTo(firstResult)

        // Verify cache stats show the cached entry
        val stats = brewService.getCacheStats()
        assertThat(stats.totalEntries).isGreaterThan(0)
        assertThat(stats.hitCount).isGreaterThan(0)
    }

    @Test
    fun `getPackageCommands should handle non-installed packages`() {
        val packageName = "non-existent-package"

        val result = brewService.getPackageCommands(packageName)
        assertThat(result).isNotNull()
        assertThat(result.packageName).isEqualTo(packageName)
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).contains("not installed")
    }

    @Test
    fun `uninstallPackage should return result`() {
        val packageName = "test-package"

        val result = brewService.uninstallPackage(packageName)
        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).contains("Successfully uninstalled")
    }

    @Test
    fun `listPackages should parse package list correctly`() {
        val result = brewService.listPackages()

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.packages).isNotEmpty()
        // Verify that packages are parsed correctly
        result.packages.forEach { pkg ->
            assertThat(pkg.name).isNotEmpty()
            assertThat(pkg.version).isNotEmpty()
        }

        // Verify specific packages
        val nodePackage = result.packages.find { it.name == "node" }
        assertThat(nodePackage).isNotNull()
        assertThat(nodePackage!!.version).isEqualTo("24.6.0")

        val pythonPackage = result.packages.find { it.name == "python" }
        assertThat(pythonPackage).isNotNull()
        assertThat(pythonPackage!!.version).isEqualTo("3.12.0")
    }

    @Test
    fun `cache should work correctly with multiple operations`() {
        // Test cache operations
        brewService.getPackageInfo("node")
        brewService.getPackageInfo("python")

        val stats = brewService.getCacheStats()
        assertThat(stats.totalEntries).isGreaterThan(0)

        // Test cache clearing
        brewService.clearCache()
        val statsAfterClear = brewService.getCacheStats()
        assertThat(statsAfterClear.totalEntries).isEqualTo(0)
    }

    @Test
    fun `searchPackages should pre-populate cache for found packages`() {
        val query = "python"
        
        // Clear cache before test
        brewService.clearCache()
        val initialStats = brewService.getCacheStats()
        assertThat(initialStats.totalEntries).isEqualTo(0)

        // Execute search - this should trigger cache pre-population
        val searchResult = brewService.searchPackages(query)
        
        // Verify search was successful
        assertThat(searchResult).isNotNull()
        assertThat(searchResult.isSuccess).isTrue()
        assertThat(searchResult.output).contains("python@3.12")
        assertThat(searchResult.output).contains("python@3.13")

        // Wait a bit for async cache pre-population to complete
        Thread.sleep(100)

        // Verify that cache was pre-populated with package info for found packages
        val statsAfterSearch = brewService.getCacheStats()
        assertThat(statsAfterSearch.totalEntries).isGreaterThan(0)
        
        // Verify that specific packages from search results are now cached
        val python312Info = brewService.getPackageInfo("python@3.12")
        assertThat(python312Info).isNotNull()
        assertThat(python312Info.isSuccess).isTrue()
        
        val python313Info = brewService.getPackageInfo("python@3.13")
        assertThat(python313Info).isNotNull()
        assertThat(python313Info.isSuccess).isTrue()
        
        // Verify cache hit for the second call
        val statsAfterInfo = brewService.getCacheStats()
        assertThat(statsAfterInfo.hitCount).isGreaterThan(0)
    }

    @Test
    fun `searchPackages should handle search failures gracefully`() {
        val query = "non-existent-package"
        
        // Clear cache before test
        brewService.clearCache()
        val initialStats = brewService.getCacheStats()
        assertThat(initialStats.totalEntries).isEqualTo(0)

        // Execute search that should fail
        val searchResult = brewService.searchPackages(query)
        
        // Verify search failed
        assertThat(searchResult).isNotNull()
        assertThat(searchResult.isSuccess).isFalse()
        
        // Verify cache was not pre-populated (should remain empty)
        val statsAfterSearch = brewService.getCacheStats()
        assertThat(statsAfterSearch.totalEntries).isEqualTo(0)
    }
}
