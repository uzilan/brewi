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
}
