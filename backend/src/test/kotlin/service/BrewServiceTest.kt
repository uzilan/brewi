package service

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class BrewServiceTest {
    @Test
    fun `listPackages should return result object`() {
        val brewService = BrewService()
        val result = brewService.listPackages()

        assertThat(result).isNotNull()
        assertThat(result.totalCount).isGreaterThanOrEqualTo(0)

        if (result.isSuccess) {
            assertThat(result.packages).hasSize(result.totalCount)
            // If successful, packages should be sorted by name
            val packageNames = result.packages.map { it.name }
            assertThat(packageNames).isEqualTo(packageNames.sorted())
        } else {
            assertThat(result.errorMessage).isNotNull()
            assertThat(result.packages).isEmpty()
            assertThat(result.totalCount).isEqualTo(0)
        }
    }

    @Test
    fun `getPackageInfoWithDependencies should return comprehensive package info`() {
        val brewService = BrewService()

        // Test with a common package that should be available
        val packageName = "node"
        val result = brewService.getPackageInfoWithDependencies(packageName, emptyList())

        // Basic assertions
        assertThat(result).isNotNull()
        assertThat(result.name).isEqualTo(packageName)
        assertThat(result.isSuccess).isTrue()

        // Check that we have package info output
        assertThat(result.output).isNotNull()
        assertThat(result.output).isNotEmpty()

        // Check dependencies (node should have some dependencies)
        assertThat(result.dependencies).isNotNull()
        assertThat(result.dependencies).isNotEmpty()

        // Check dependents (might be empty if no other packages depend on node)
        assertThat(result.dependents).isNotNull()

        // Check description extraction
        if (result.description != null) {
            assertThat(result.description).isNotEmpty()
            assertThat(result.description.length).isGreaterThan(10)
        }

        // Verify that dependencies are valid package names
        result.dependencies.forEach { dep ->
            assertThat(dep).isNotEmpty()
            assertThat(dep).matches("[a-zA-Z0-9@._-]+")
        }

        // Verify that dependents are valid package names
        result.dependents.forEach { dep ->
            assertThat(dep).isNotEmpty()
            assertThat(dep).matches("[a-zA-Z0-9@._-]+")
        }
    }

    @Test
    fun `getPackageInfoWithDependencies should handle non-existent package gracefully`() {
        val brewService = BrewService()

        // Test with a non-existent package
        val packageName = "non-existent-package-12345"
        val result = brewService.getPackageInfoWithDependencies(packageName, emptyList())

        // Should still return a result object
        assertThat(result).isNotNull()
        assertThat(result.name).isEqualTo(packageName)

        // Should indicate failure
        assertThat(result.isSuccess).isFalse()

        // Should have error message
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).isNotEmpty()

        // Dependencies and dependents should be empty
        assertThat(result.dependencies).isEmpty()
        assertThat(result.dependents).isEmpty()

        // Description should be null
        assertThat(result.description).isNull()
    }

    @Test
    fun `getPackageInfoWithDependencies should extract description correctly`() {
        val brewService = BrewService()

        // Test with a package that should have a description
        val packageName = "python"
        val result = brewService.getPackageInfoWithDependencies(packageName, emptyList())

        assertThat(result).isNotNull()
        assertThat(result.name).isEqualTo(packageName)

        if (result.isSuccess) {
            // If successful, check that description is extracted
            if (result.description != null) {
                assertThat(result.description).isNotEmpty()
                // Description should not contain newlines or special formatting
                assertThat(result.description).doesNotContain("\n")
                assertThat(result.description).doesNotContain("==>")
                assertThat(result.description).doesNotStartWith("http")
            }
        }
    }

    @Test
    fun `searchPackages should return search results`() {
        val brewService = BrewService()
        val query = "python"
        val result = brewService.searchPackages(query)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains(query)
    }

    @Test
    fun `searchPackages should handle empty query gracefully`() {
        val brewService = BrewService()
        val query = ""
        val result = brewService.searchPackages(query)

        assertThat(result).isNotNull()
        // Empty query might succeed or fail, but should return a result
        assertThat(result.output).isNotNull()
    }

    @Test
    fun `getPackageInfo should return package information`() {
        val brewService = BrewService()
        val packageName = "node"
        val result = brewService.getPackageInfo(packageName)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains(packageName)
    }

    @Test
    fun `getPackageInfo should handle non-existent package`() {
        val brewService = BrewService()
        val packageName = "non-existent-package-12345"
        val result = brewService.getPackageInfo(packageName)

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).isNotEmpty()
    }

    @Test
    fun `getPackageDependencies should return dependencies`() {
        val brewService = BrewService()
        val packageName = "node"
        val result = brewService.getPackageDependencies(packageName)

        assertThat(result).isNotNull()
        if (result.isSuccess) {
            assertThat(result.output).isNotEmpty()
            // Dependencies should be package names, one per line
            val dependencies = result.output.lines().filter { it.isNotBlank() }
            dependencies.forEach { dep ->
                assertThat(dep).matches("[a-zA-Z0-9@._-]+")
            }
        }
    }

    @Test
    fun `getPackageDependents should return dependents`() {
        val brewService = BrewService()
        val packageName = "openssl@3"
        val result = brewService.getPackageDependents(packageName)

        assertThat(result).isNotNull()
        if (result.isSuccess) {
            assertThat(result.output).isNotNull()
            // Dependents should be package names, one per line
            val dependents = result.output.lines().filter { it.isNotBlank() }
            dependents.forEach { dep ->
                assertThat(dep).matches("[a-zA-Z0-9@._-]+")
            }
        }
    }

    @Test
    fun `getLastUpdateTime should return update time`() {
        val brewService = BrewService()
        val result = brewService.getLastUpdateTime()

        assertThat(result).isNotNull()
        if (result.isSuccess) {
            assertThat(result.output).isNotEmpty()
            // Should contain some form of date/time information
            assertThat(result.output).matches(".*\\d{4}.*")
        }
    }

    @Test
    fun `runDoctor should return diagnostic information`() {
        val brewService = BrewService()
        val result = brewService.runDoctor()

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        // Should contain diagnostic information
        assertThat(result.output).satisfiesAnyOf(
            { assertThat(it).contains("ready to brew") },
            { assertThat(it).contains("warning") },
            { assertThat(it).contains("error") },
            { assertThat(it).contains("issue") },
        )
    }

    @Test
    fun `checkOutdated should return outdated packages`() {
        val brewService = BrewService()
        val result = brewService.checkOutdated()

        assertThat(result).isNotNull()
        // This might succeed or fail depending on system state
        assertThat(result.output).isNotNull()
    }

    @Test
    fun `executeCustomCommand should handle valid commands`() {
        val brewService = BrewService()
        val result = brewService.executeCustomCommand(listOf("--version"))

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isNotEmpty()
        assertThat(result.output).contains("Homebrew")
    }

    @Test
    fun `executeCustomCommand should handle invalid commands`() {
        val brewService = BrewService()
        val result = brewService.executeCustomCommand(listOf("invalid-command-12345"))

        assertThat(result).isNotNull()
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isNotNull()
        assertThat(result.errorMessage!!).isNotEmpty()
    }

    @Test
    fun `executeCustomCommand should respect timeout`() {
        val brewService = BrewService()
        val result = brewService.executeCustomCommand(listOf("--version"), 1)

        assertThat(result).isNotNull()
        // Should succeed quickly with version command
        assertThat(result.isSuccess).isTrue()
    }
}
