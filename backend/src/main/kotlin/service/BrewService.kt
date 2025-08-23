package service

import model.BrewCommandResult
import model.BrewListResult
import model.BrewPackage
import java.util.concurrent.TimeUnit

/**
 * Service that executes brew commands
 */
class BrewService {
    /**
     * Executes brew list command and returns structured result
     */
    fun listPackages(): BrewListResult {
        val result = executeBrewCommand(listOf("list"))

        return if (result.isSuccess) {
            val packages = parseBrewOutput(result.output)
            BrewListResult(
                packages = packages,
                isSuccess = true,
            )
        } else {
            BrewListResult(
                packages = emptyList(),
                isSuccess = false,
                errorMessage = result.errorMessage,
            )
        }
    }

    /**
     * Executes brew search command
     */
    fun searchPackages(query: String): BrewCommandResult {
        return executeBrewCommand(listOf("search", query))
    }

    /**
     * Executes brew info command for a specific package
     */
    fun getPackageInfo(packageName: String): BrewCommandResult {
        return executeBrewCommand(listOf("info", packageName))
    }

    /**
     * Gets comprehensive package information including dependencies and dependents
     */
    fun getPackageInfoWithDependencies(packageName: String): model.BrewPackageInfo {
        val infoResult = getPackageInfo(packageName)
        val depsResult = getPackageDependencies(packageName)
        val usesResult = getPackageDependents(packageName)

        // Parse dependencies and dependents
        val dependencies =
            if (depsResult.isSuccess) {
                depsResult.output.lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        val dependents =
            if (usesResult.isSuccess) {
                usesResult.output.lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        return model.BrewPackageInfo(
            name = packageName,
            output = infoResult.output,
            isSuccess = infoResult.isSuccess,
            errorMessage = infoResult.errorMessage,
            dependencies = dependencies,
            dependents = dependents,
        )
    }

    /**
     * Gets comprehensive package information including dependencies and dependents,
     * cross-referencing with installed packages to improve dependents accuracy
     */
    fun getPackageInfoWithDependencies(
        packageName: String,
        installedPackages: List<String>,
    ): model.BrewPackageInfo {
        val infoResult = getPackageInfo(packageName)
        val depsResult = getPackageDependencies(packageName)
        val usesResult = getPackageDependents(packageName)

        // Parse dependencies and dependents
        val dependencies =
            if (depsResult.isSuccess) {
                depsResult.output.lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        val dependents =
            if (usesResult.isSuccess) {
                usesResult.output.lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        // Cross-reference with installed packages to find additional dependents
        val enhancedDependents = mutableSetOf<String>()
        enhancedDependents.addAll(dependents)

        // For each installed package, check if it depends on this package
        for (installedPackage in installedPackages) {
            if (installedPackage != packageName) {
                try {
                    val installedDepsResult = getPackageDependencies(installedPackage)
                    if (installedDepsResult.isSuccess) {
                        val installedDeps =
                            installedDepsResult.output.lines()
                                .filter { it.isNotBlank() }
                                .map { it.trim() }

                        // If this installed package depends on the current package, add it to dependents
                        if (installedDeps.contains(packageName)) {
                            enhancedDependents.add(installedPackage)
                        }
                    }
                } catch (e: Exception) {
                    // Skip this package if there's an error checking its dependencies
                    continue
                }
            }
        }

        return model.BrewPackageInfo(
            name = packageName,
            output = infoResult.output,
            isSuccess = infoResult.isSuccess,
            errorMessage = infoResult.errorMessage,
            dependencies = dependencies,
            dependents = enhancedDependents.toList(),
        )
    }

    /**
     * Executes brew install command for a specific package
     */
    fun installPackage(packageName: String): BrewCommandResult {
        return executeBrewCommand(listOf("install", packageName), 300) // 5 minute timeout for installs
    }

    /**
     * Executes brew uninstall command for a specific package
     */
    fun uninstallPackage(packageName: String): BrewCommandResult {
        return executeBrewCommand(listOf("uninstall", packageName), 300) // 5 minute timeout for uninstalls
    }

    /**
     * Gets dependencies for a specific package
     */
    fun getPackageDependencies(packageName: String): BrewCommandResult {
        return executeBrewCommand(listOf("deps", packageName))
    }

    /**
     * Gets packages that depend on a specific package
     */
    fun getPackageDependents(packageName: String): BrewCommandResult {
        return executeBrewCommand(listOf("uses", packageName))
    }

    /**
     * Executes brew outdated command to check for updates
     */
    fun checkOutdated(): BrewCommandResult {
        return executeBrewCommand(listOf("outdated"))
    }

    /**
     * Gets the last update time by checking the Homebrew cache directory
     * @return BrewCommandResult with the last update information
     */
    fun getLastUpdateTime(): BrewCommandResult {
        return try {
            // Check the Homebrew cache directory for last update time
            val homebrewCacheDir =
                System.getenv(
                    "HOMEBREW_CACHE",
                ) ?: "${System.getProperty("user.home")}/Library/Caches/Homebrew"
            val cacheDir = java.io.File(homebrewCacheDir)

            if (!cacheDir.exists()) {
                return BrewCommandResult(
                    isSuccess = false,
                    output = "",
                    errorMessage = "Homebrew cache directory not found",
                )
            }

            // Get the most recent modification time of any file in the cache
            val lastModified =
                cacheDir.walkTopDown()
                    .filter { it.isFile }
                    .map { it.lastModified() }
                    .maxOrNull()

            if (lastModified == null) {
                return BrewCommandResult(
                    isSuccess = false,
                    output = "",
                    errorMessage = "No cache files found",
                )
            }

            val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
            val lastUpdateStr = dateFormat.format(java.util.Date(lastModified))

            BrewCommandResult(
                isSuccess = true,
                output = lastUpdateStr,
                exitCode = 0,
            )
        } catch (e: Exception) {
            BrewCommandResult(
                isSuccess = false,
                output = "",
                errorMessage = "Failed to get last update time: ${e.message}",
            )
        }
    }

    /**
     * Executes brew update command to update Homebrew itself
     */
    fun updateBrew(): BrewCommandResult {
        return executeBrewCommand(listOf("update"))
    }

    /**
     * Executes brew upgrade command to upgrade all packages
     */
    fun upgradePackages(): BrewCommandResult {
        return executeBrewCommand(listOf("upgrade"))
    }

    /**
     * Executes brew update followed by brew upgrade
     * @return Combined result of both operations
     */
    fun updateAndUpgrade(): BrewCommandResult {
        val updateResult = updateBrew()
        if (!updateResult.isSuccess) {
            return BrewCommandResult(
                isSuccess = false,
                output = updateResult.output,
                errorMessage = "Update failed: ${updateResult.errorMessage}",
                exitCode = updateResult.exitCode,
            )
        }

        val upgradeResult = upgradePackages()
        return BrewCommandResult(
            isSuccess = upgradeResult.isSuccess,
            output = "UPDATE:\n${updateResult.output}\n\nUPGRADE:\n${upgradeResult.output}",
            errorMessage = if (!upgradeResult.isSuccess) upgradeResult.errorMessage else null,
            exitCode = upgradeResult.exitCode,
        )
    }

    /**
     * Executes a custom brew command
     * @param args The arguments to pass to brew (e.g., ["--version"], ["doctor"])
     * @param timeoutSeconds Timeout in seconds (default: 30)
     * @return BrewCommandResult containing the command output and status
     */
    fun executeCustomCommand(
        args: List<String>,
        timeoutSeconds: Long = 30,
    ): BrewCommandResult {
        return executeBrewCommand(args, timeoutSeconds)
    }

    /**
     * Executes any brew command with the given arguments
     * @param args The arguments to pass to brew (e.g., ["list"], ["search", "python"])
     * @param timeoutSeconds Timeout in seconds (default: 30)
     * @return BrewCommandResult containing the command output and status
     */
    private fun executeBrewCommand(
        args: List<String>,
        timeoutSeconds: Long = 30,
    ): BrewCommandResult {
        return try {
            val command = listOf("brew") + args
            println("Executing command: ${command.joinToString(" ")}")
            val process =
                ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start()

            val completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS)

            if (!completed) {
                process.destroyForcibly()
                return BrewCommandResult(
                    isSuccess = false,
                    output = "",
                    errorMessage = "Command timed out after $timeoutSeconds seconds",
                )
            }

            val exitCode = process.exitValue()
            val output = process.inputStream.bufferedReader().readText()

            if (exitCode == 0) {
                BrewCommandResult(
                    isSuccess = true,
                    output = output,
                    exitCode = exitCode,
                )
            } else {
                BrewCommandResult(
                    isSuccess = false,
                    output = output,
                    errorMessage = "brew ${args.joinToString(" ")} failed with exit code $exitCode: $output",
                    exitCode = exitCode,
                )
            }
        } catch (e: Exception) {
            if (e is InterruptedException) {
                Thread.currentThread().interrupt()
            }
            BrewCommandResult(
                isSuccess = false,
                output = "",
                errorMessage = "Failed to execute brew command: ${e.message}",
            )
        }
    }

    private fun parseBrewOutput(output: String): List<BrewPackage> {
        return output.lines()
            .filter { it.isNotBlank() }
            .map { line ->
                // Parse package name and potentially version if available
                val trimmed = line.trim()
                if (trimmed.contains("@")) {
                    // Handle versioned packages like "python@3.9"
                    val parts = trimmed.split("@", limit = 2)
                    BrewPackage(name = parts[0], version = parts.getOrNull(1))
                } else {
                    BrewPackage(name = trimmed)
                }
            }
            .sortedBy { it.name }
    }
}
