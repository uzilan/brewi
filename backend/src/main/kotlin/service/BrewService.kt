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
        val result = executeBrewCommand(listOf("list", "--versions"))

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
        return executeBrewCommand(listOf("info", packageName), 60) // 1 minute timeout for info
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

        // Extract description from brew info output
        println("DEBUG: About to extract description for $packageName")
        println("DEBUG: infoResult.isSuccess: ${infoResult.isSuccess}")
        val description = if (infoResult.isSuccess) {
            extractDescriptionFromInfoOutput(packageName, infoResult.output)
        } else {
            null
        }
        println("DEBUG: Final description result: $description")

        return model.BrewPackageInfo(
            name = packageName,
            output = infoResult.output,
            isSuccess = infoResult.isSuccess,
            errorMessage = infoResult.errorMessage,
            dependencies = dependencies,
            dependents = enhancedDependents.toList(),
            description = description,
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
     * Gets the commands that a package provides once installed
     * This checks the package's bin directory and uses brew list --formula for additional info
     */
    fun getPackageCommands(packageName: String): model.BrewPackageCommands {
        return try {
            // First check if the package is installed
            val listResult = executeBrewCommand(listOf("list", "--formula"))
            if (!listResult.isSuccess) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Failed to check if package is installed: ${listResult.errorMessage}",
                )
            }

            val installedPackages = listResult.output.lines()
                .filter { it.isNotBlank() }
                .map { it.trim() }

            if (!installedPackages.contains(packageName)) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Package '$packageName' is not installed",
                )
            }

            // Get the Homebrew prefix to find the package's bin directory
            val prefixResult = executeBrewCommand(listOf("--prefix"))
            if (!prefixResult.isSuccess) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Failed to get Homebrew prefix: ${prefixResult.errorMessage}",
                )
            }

            val homebrewPrefix = prefixResult.output.trim()
            val packageBinDir = java.io.File("$homebrewPrefix/bin")
            
            if (!packageBinDir.exists()) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Package bin directory not found",
                )
            }

            // Get package info to find the actual package path
            val infoResult = executeBrewCommand(listOf("info", packageName))
            if (!infoResult.isSuccess) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Failed to get package info: ${infoResult.errorMessage}",
                )
            }

            // Extract the package path from brew info output
            val packagePath = extractPackagePathFromInfo(infoResult.output, packageName)
            if (packagePath == null) {
                return model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Could not determine package installation path",
                )
            }

            // Check the package's bin directory for executable files
            val packageBinPath = java.io.File("$packagePath/bin")
            val commands = mutableSetOf<String>()

            if (packageBinPath.exists() && packageBinPath.isDirectory) {
                packageBinPath.listFiles()
                    ?.filter { it.isFile && it.canExecute() }
                    ?.map { it.name }
                    ?.let { commands.addAll(it) }
            }

            // Also check for commands in the main bin directory that might be symlinked to this package
            val allBinFiles = packageBinDir.listFiles()
                ?.filter { it.isFile && it.canExecute() }
                ?.filter { file ->
                    try {
                        val canonicalPath = file.canonicalPath
                        canonicalPath.contains(packagePath)
                    } catch (e: Exception) {
                        false
                    }
                }
                ?.map { it.name }
                ?: emptyList()

            commands.addAll(allBinFiles)
            val sortedCommands = commands.sorted()

            model.BrewPackageCommands(
                packageName = packageName,
                commands = sortedCommands,
                isSuccess = true,
                exitCode = 0,
            )
        } catch (e: Exception) {
            model.BrewPackageCommands(
                packageName = packageName,
                commands = emptyList(),
                isSuccess = false,
                errorMessage = "Failed to get package commands: ${e.message}",
            )
        }
    }

    /**
     * Extracts description from brew info output
     * The description is the line that comes after the package name and version line
     * Example: "==> node: stable 24.6.0 (bottled), HEAD"
     *         "Platform built on V8 to build network applications" <- This is the description
     */
    private fun extractDescriptionFromInfoOutput(
        packageName: String,
        output: String,
    ): String? {
        if (output.isBlank()) {
            return null
        }

        val lines = output.lines()
        if (lines.isEmpty()) {
            return null
        }

        // Find the line that starts with "==> $packageName:"
        val packageInfoLineIndex = lines.indexOfFirst { line ->
            line.trim().startsWith("==> $packageName:")
        }

        if (packageInfoLineIndex == -1 || packageInfoLineIndex + 1 >= lines.size) {
            return null
        }

        // The description is the next line after the package info line
        val descriptionLine = lines[packageInfoLineIndex + 1].trim()
        
        // Skip if the next line is empty or starts with common non-description patterns
        if (descriptionLine.isBlank() || 
            descriptionLine.startsWith("http") ||
            descriptionLine.startsWith("From:") ||
            descriptionLine.startsWith("License:") ||
            descriptionLine.startsWith("==>")) {
            return null
        }

        return descriptionLine
    }

    /**
     * Extracts the package installation path from brew info output
     */
    private fun extractPackagePathFromInfo(infoOutput: String, packageName: String): String? {
        val lines = infoOutput.lines()
        for (line in lines) {
            if (line.trim().startsWith("==> $packageName:")) {
                // Look for the "Installed" line, then get the next line with the path
                val lineIndex = lines.indexOf(line)
                for (i in lineIndex + 1 until lines.size) {
                    val nextLine = lines[i].trim()
                    if (nextLine == "Installed") {
                        // The path is on the next line
                        if (i + 1 < lines.size) {
                            val pathLine = lines[i + 1].trim()
                            if (pathLine.startsWith("/") && pathLine.contains("/Cellar/")) {
                                // Extract the path from "/path/to/package (files, size) *"
                                val pathMatch = Regex("/[^\\s]+/Cellar/[^\\s]+").find(pathLine)
                                return pathMatch?.value
                            }
                        }
                    }
                    if (nextLine.startsWith("==>")) {
                        break
                    }
                }
            }
        }
        return null
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
     * Executes brew doctor command to diagnose Homebrew issues
     * @return BrewCommandResult containing the diagnostic output
     */
    fun runDoctor(): BrewCommandResult {
        return executeBrewCommand(listOf("doctor"), 300) // 5 minute timeout for doctor
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
                // Parse package name and version from "brew list --versions" output
                // Format: "package_name version" (e.g., "python 3.9.0")
                val trimmed = line.trim()
                val parts = trimmed.split(" ", limit = 2)
                if (parts.size > 1) {
                    BrewPackage(name = parts[0], version = parts[1])
                } else {
                    BrewPackage(name = trimmed)
                }
            }
            .sortedBy { it.name }
    }
}
