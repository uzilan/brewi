package model

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class ModelTest {
    @Test
    fun `BrewPackage should have correct properties`() {
        val package1 =
            BrewPackage(
                name = "node",
                version = "24.6.0",
                description = "Platform built on V8 to build network applications",
            )

        assertThat(package1.name).isEqualTo("node")
        assertThat(package1.version).isEqualTo("24.6.0")
        assertThat(package1.description).isEqualTo("Platform built on V8 to build network applications")
    }

    @Test
    fun `BrewPackage should support equality`() {
        val package1 = BrewPackage("node", "24.6.0", "Platform built on V8")
        val package2 = BrewPackage("node", "24.6.0", "Platform built on V8")
        val package3 = BrewPackage("python", "3.12.0", "Python programming language")

        assertThat(package1).isEqualTo(package2)
        assertThat(package1).isNotEqualTo(package3)
    }

    @Test
    fun `BrewCommandResult should have correct properties`() {
        val result =
            BrewCommandResult(
                isSuccess = true,
                output = "Command executed successfully",
                errorMessage = null,
                exitCode = 0,
            )

        assertThat(result.isSuccess).isTrue()
        assertThat(result.output).isEqualTo("Command executed successfully")
        assertThat(result.errorMessage).isNull()
        assertThat(result.exitCode).isEqualTo(0)
    }

    @Test
    fun `BrewCommandResult should handle error cases`() {
        val result =
            BrewCommandResult(
                isSuccess = false,
                output = "Error output",
                errorMessage = "Command failed",
                exitCode = 1,
            )

        assertThat(result.isSuccess).isFalse()
        assertThat(result.output).isEqualTo("Error output")
        assertThat(result.errorMessage).isEqualTo("Command failed")
        assertThat(result.exitCode).isEqualTo(1)
    }

    @Test
    fun `BrewListResult should have correct properties`() {
        val packages =
            listOf(
                BrewPackage("node", "24.6.0", "Platform built on V8"),
                BrewPackage("python", "3.12.0", "Python programming language"),
            )

        val result =
            BrewListResult(
                packages = packages,
                isSuccess = true,
                errorMessage = null,
                totalCount = 2,
            )

        assertThat(result.packages).hasSize(2)
        assertThat(result.isSuccess).isTrue()
        assertThat(result.errorMessage).isNull()
        assertThat(result.totalCount).isEqualTo(2)
        assertThat(result.packages[0].name).isEqualTo("node")
        assertThat(result.packages[1].name).isEqualTo("python")
    }

    @Test
    fun `BrewListResult should handle error cases`() {
        val result =
            BrewListResult(
                packages = emptyList(),
                isSuccess = false,
                errorMessage = "Failed to list packages",
                totalCount = 0,
            )

        assertThat(result.packages).isEmpty()
        assertThat(result.isSuccess).isFalse()
        assertThat(result.errorMessage).isEqualTo("Failed to list packages")
        assertThat(result.totalCount).isEqualTo(0)
    }

    @Test
    fun `BrewPackageInfo should have correct properties`() {
        val dependencies = listOf("brotli", "c-ares", "icu4c@77")
        val dependents = listOf("npm", "yarn")

        val packageInfo =
            BrewPackageInfo(
                name = "node",
                description = "Platform built on V8 to build network applications",
                version = "24.6.0",
                dependencies = dependencies,
                dependents = dependents,
                output = "==> node: stable 24.6.0 (bottled), HEAD",
                isSuccess = true,
                errorMessage = null,
            )

        assertThat(packageInfo.name).isEqualTo("node")
        assertThat(packageInfo.description).isEqualTo("Platform built on V8 to build network applications")
        assertThat(packageInfo.version).isEqualTo("24.6.0")
        assertThat(packageInfo.dependencies).hasSize(3)
        assertThat(packageInfo.dependents).hasSize(2)
        assertThat(packageInfo.output).isEqualTo("==> node: stable 24.6.0 (bottled), HEAD")
        assertThat(packageInfo.isSuccess).isTrue()
        assertThat(packageInfo.errorMessage).isNull()
    }

    @Test
    fun `BrewPackageInfo should handle error cases`() {
        val packageInfo =
            BrewPackageInfo(
                name = "non-existent-package",
                description = null,
                version = null,
                dependencies = emptyList(),
                dependents = emptyList(),
                output = "Error: No available formula",
                isSuccess = false,
                errorMessage = "Package not found",
            )

        assertThat(packageInfo.name).isEqualTo("non-existent-package")
        assertThat(packageInfo.description).isNull()
        assertThat(packageInfo.version).isNull()
        assertThat(packageInfo.dependencies).isEmpty()
        assertThat(packageInfo.dependents).isEmpty()
        assertThat(packageInfo.output).isEqualTo("Error: No available formula")
        assertThat(packageInfo.isSuccess).isFalse()
        assertThat(packageInfo.errorMessage).isEqualTo("Package not found")
    }

    @Test
    fun `BrewPackageCommands should have correct properties`() {
        val commands = listOf("node", "npm", "npx")

        val packageCommands =
            BrewPackageCommands(
                packageName = "node",
                commands = commands,
                isSuccess = true,
                errorMessage = null,
                exitCode = 0,
            )

        assertThat(packageCommands.packageName).isEqualTo("node")
        assertThat(packageCommands.commands).hasSize(3)
        assertThat(packageCommands.commands).contains("node", "npm", "npx")
        assertThat(packageCommands.isSuccess).isTrue()
        assertThat(packageCommands.errorMessage).isNull()
        assertThat(packageCommands.exitCode).isEqualTo(0)
    }

    @Test
    fun `BrewPackageCommands should handle error cases`() {
        val packageCommands =
            BrewPackageCommands(
                packageName = "non-existent-package",
                commands = emptyList(),
                isSuccess = false,
                errorMessage = "Package not found",
                exitCode = 1,
            )

        assertThat(packageCommands.packageName).isEqualTo("non-existent-package")
        assertThat(packageCommands.commands).isEmpty()
        assertThat(packageCommands.isSuccess).isFalse()
        assertThat(packageCommands.errorMessage).isEqualTo("Package not found")
        assertThat(packageCommands.exitCode).isEqualTo(1)
    }

    @Test
    fun `TldrResult should have correct properties`() {
        val tldrResult =
            TldrResult(
                command = "git",
                output = "Git is a distributed version control system",
                isSuccess = true,
                errorMessage = null,
                exitCode = 0,
            )

        assertThat(tldrResult.command).isEqualTo("git")
        assertThat(tldrResult.output).isEqualTo("Git is a distributed version control system")
        assertThat(tldrResult.isSuccess).isTrue()
        assertThat(tldrResult.errorMessage).isNull()
        assertThat(tldrResult.exitCode).isEqualTo(0)
    }

    @Test
    fun `TldrResult should handle error cases`() {
        val tldrResult =
            TldrResult(
                command = "non-existent-command",
                output = "",
                isSuccess = false,
                errorMessage = "Command not found",
                exitCode = 1,
            )

        assertThat(tldrResult.command).isEqualTo("non-existent-command")
        assertThat(tldrResult.output).isEmpty()
        assertThat(tldrResult.isSuccess).isFalse()
        assertThat(tldrResult.errorMessage).isEqualTo("Command not found")
        assertThat(tldrResult.exitCode).isEqualTo(1)
    }

    @Test
    fun `Model classes should support data class features`() {
        val package1 = BrewPackage("node", "24.6.0", "Platform built on V8")
        val package2 = package1.copy(version = "25.0.0")

        assertThat(package2.name).isEqualTo("node")
        assertThat(package2.version).isEqualTo("25.0.0")
        assertThat(package2.description).isEqualTo("Platform built on V8")
        assertThat(package1).isNotEqualTo(package2)
    }

    @Test
    fun `Model classes should have meaningful toString`() {
        val package1 = BrewPackage("node", "24.6.0", "Platform built on V8")
        val result = BrewCommandResult(true, "Success", null, 0)

        assertThat(package1.toString()).contains("node")
        assertThat(package1.toString()).contains("24.6.0")
        assertThat(result.toString()).contains("Success")
    }
}
