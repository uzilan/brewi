package service

import model.BrewCommandResult
import model.BrewListResult
import model.BrewPackage
import model.TldrResult
import org.slf4j.LoggerFactory

/**
 * Service that executes brew commands
 */
class BrewService(
    private val commandExecutor: CommandExecutor = RealCommandExecutor(),
) {
    private val logger = LoggerFactory.getLogger(BrewService::class.java)
    private val cacheService = CacheService()

    companion object {
        private const val PACKAGE_INFO_CACHE_TTL = 300L // 5 minutes
    }

    /**
     * Executes brew list command and returns structured result
     */
    fun listPackages(): BrewListResult {
        val result = commandExecutor.executeBrewCommand(listOf("list", "--versions"))

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
    fun searchPackages(query: String): BrewCommandResult = commandExecutor.executeBrewCommand(listOf("search", query))

    /**
     * Executes brew info command for a specific package with caching
     */
    fun getPackageInfo(packageName: String): BrewCommandResult {
        val cacheKey = "package_info:$packageName"

        // Try to get from cache first
        val cachedResult = cacheService.get<BrewCommandResult>(cacheKey)
        if (cachedResult != null) {
            logger.info("Cache hit for package info: $packageName")
            return cachedResult
        }

        // Cache miss, execute the command
        logger.info("Cache miss for package info: $packageName, executing brew command")
        val result = commandExecutor.executeBrewCommand(listOf("info", packageName), 30) // 30 second timeout for info

        // Cache the result if successful
        if (result.isSuccess) {
            cacheService.set(cacheKey, result, PACKAGE_INFO_CACHE_TTL)
            logger.debug("Cached package info for: $packageName")
        }

        return result
    }

    /**
     * Gets comprehensive package information including dependencies and dependents
     * Optimized version that doesn't cross-reference all installed packages
     * Cached for improved performance
     */
    fun getPackageInfoWithDependencies(
        packageName: String,
        installedPackages: List<String>,
    ): model.BrewPackageInfo {
        val cacheKey = "package_info_with_deps:$packageName"

        // Try to get from cache first
        val cachedResult = cacheService.get<model.BrewPackageInfo>(cacheKey)
        if (cachedResult != null) {
            logger.debug("Cache hit for package info with dependencies: $packageName")
            return cachedResult
        }

        logger.debug("Cache miss for package info with dependencies: $packageName")

        val infoResult = getPackageInfo(packageName)
        val depsResult = getPackageDependencies(packageName)
        val usesResult = getPackageDependents(packageName)

        // Parse dependencies and dependents
        val dependencies =
            if (depsResult.isSuccess) {
                depsResult.output
                    .lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        val dependents =
            if (usesResult.isSuccess) {
                usesResult.output
                    .lines()
                    .filter { it.isNotBlank() }
                    .map { it.trim() }
            } else {
                emptyList()
            }

        // Extract description from brew info output
        val description =
            if (infoResult.isSuccess) {
                extractDescriptionFromInfoOutput(packageName, infoResult.output)
            } else {
                null
            }

        val result =
            model.BrewPackageInfo(
                name = packageName,
                output = infoResult.output,
                isSuccess = infoResult.isSuccess,
                errorMessage = infoResult.errorMessage,
                dependencies = dependencies,
                dependents = dependents,
                description = description,
            )

        // Cache the result with TTL
        cacheService.set(cacheKey, result, 300) // 5 minutes TTL
        logger.debug("Cached package info with dependencies for: $packageName")

        return result
    }

    /**
     * Executes brew install command for a specific package
     */
    fun installPackage(packageName: String): BrewCommandResult {
        val result =
            commandExecutor
                .executeBrewCommand(
                    listOf("install", packageName),
                    300,
                ) // 5 minute timeout for installs

        // Invalidate cache and pre-populate on successful install
        if (result.isSuccess) {
            invalidatePackageCache(packageName)
            logger.info("Invalidated cache for installed package: $packageName")

            // Pre-populate cache for the newly installed package
            prePopulatePackageCache(packageName)
        }

        return result
    }

    /**
     * Executes brew uninstall command for a specific package
     */
    fun uninstallPackage(packageName: String): BrewCommandResult {
        val result =
            commandExecutor
                .executeBrewCommand(
                    listOf("uninstall", packageName),
                    300,
                ) // 5 minute timeout for uninstalls

        // Invalidate cache on successful uninstall
        if (result.isSuccess) {
            invalidatePackageCache(packageName)
            logger.info("Invalidated cache for uninstalled package: $packageName")
        }

        return result
    }

    /**
     * Gets dependencies for a specific package
     */
    fun getPackageDependencies(packageName: String): BrewCommandResult =
        commandExecutor.executeBrewCommand(listOf("deps", packageName))

    /**
     * Gets packages that depend on a specific package
     */
    fun getPackageDependents(packageName: String): BrewCommandResult =
        commandExecutor.executeBrewCommand(listOf("uses", packageName))

    /**
     * Gets the commands that a package provides once installed
     * This checks the package's bin directory and uses brew list --formula for additional info
     * Cached for improved performance
     */
    fun getPackageCommands(packageName: String): model.BrewPackageCommands {
        val cacheKey = "package_commands:$packageName"

        // Try to get from cache first
        val cachedResult = cacheService.get<model.BrewPackageCommands>(cacheKey)
        if (cachedResult != null) {
            logger.debug("Cache hit for package commands: $packageName")
            return cachedResult
        }

        logger.debug("Cache miss for package commands: $packageName")

        val result =
            try {
                // First check if the package is installed
                val listResult = commandExecutor.executeBrewCommand(listOf("list", "--formula"))
                if (!listResult.isSuccess) {
                    model.BrewPackageCommands(
                        packageName = packageName,
                        commands = emptyList(),
                        isSuccess = false,
                        errorMessage = "Failed to check if package is installed: ${listResult.errorMessage}",
                    )
                } else {
                    val installedPackages =
                        listResult.output
                            .lines()
                            .filter { it.isNotBlank() }
                            .map { it.trim() }

                    if (!installedPackages.contains(packageName)) {
                        model.BrewPackageCommands(
                            packageName = packageName,
                            commands = emptyList(),
                            isSuccess = false,
                            errorMessage = "Package '$packageName' is not installed",
                        )
                    } else {
                        // Get the Homebrew prefix to find the package's bin directory
                        val prefixResult = commandExecutor.executeBrewCommand(listOf("--prefix"))
                        if (!prefixResult.isSuccess) {
                            model.BrewPackageCommands(
                                packageName = packageName,
                                commands = emptyList(),
                                isSuccess = false,
                                errorMessage = "Failed to get Homebrew prefix: ${prefixResult.errorMessage}",
                            )
                        } else {
                            val homebrewPrefix = prefixResult.output.trim()
                            val packageBinDir = java.io.File("$homebrewPrefix/bin")

                            if (!packageBinDir.exists()) {
                                model.BrewPackageCommands(
                                    packageName = packageName,
                                    commands = emptyList(),
                                    isSuccess = false,
                                    errorMessage = "Package bin directory not found",
                                )
                            } else {
                                // Get package info to find the actual package path
                                val infoResult = commandExecutor.executeBrewCommand(listOf("info", packageName))
                                if (!infoResult.isSuccess) {
                                    model.BrewPackageCommands(
                                        packageName = packageName,
                                        commands = emptyList(),
                                        isSuccess = false,
                                        errorMessage = "Failed to get package info: ${infoResult.errorMessage}",
                                    )
                                } else {
                                    // Extract the package path from brew info output
                                    val packagePath = extractPackagePathFromInfo(infoResult.output, packageName)
                                    if (packagePath == null) {
                                        model.BrewPackageCommands(
                                            packageName = packageName,
                                            commands = emptyList(),
                                            isSuccess = false,
                                            errorMessage = "Could not determine package installation path",
                                        )
                                    } else {
                                        // Check the package's bin directory for executable files
                                        val packageBinPath = java.io.File("$packagePath/bin")
                                        val commands = mutableSetOf<String>()

                                        if (packageBinPath.exists() && packageBinPath.isDirectory) {
                                            packageBinPath
                                                .listFiles()
                                                ?.filter { it.isFile && it.canExecute() }
                                                ?.map { it.name }
                                                ?.let { commands.addAll(it) }
                                        }

                                        // Also check for commands in the main bin directory that might be symlinked to this package
                                        val allBinFiles =
                                            packageBinDir
                                                .listFiles()
                                                ?.filter { it.isFile && it.canExecute() }
                                                ?.filter { file ->
                                                    try {
                                                        val canonicalPath = file.canonicalPath
                                                        canonicalPath.contains(packagePath)
                                                    } catch (e: Exception) {
                                                        false
                                                    }
                                                }?.map { it.name }
                                                ?: emptyList()

                                        commands.addAll(allBinFiles)
                                        val sortedCommands = commands.sorted()

                                        model.BrewPackageCommands(
                                            packageName = packageName,
                                            commands = sortedCommands,
                                            isSuccess = true,
                                            exitCode = 0,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                model.BrewPackageCommands(
                    packageName = packageName,
                    commands = emptyList(),
                    isSuccess = false,
                    errorMessage = "Failed to get package commands: ${e.message}",
                )
            }

        // Cache the result with TTL
        cacheService.set(cacheKey, result, 600) // 10 minutes TTL for package commands
        logger.debug("Cached package commands for: $packageName")

        return result
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
        val packageInfoLineIndex =
            lines.indexOfFirst { line ->
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
            descriptionLine.startsWith("==>")
        ) {
            return null
        }

        return descriptionLine
    }

    /**
     * Extracts the package installation path from brew info output
     */
    private fun extractPackagePathFromInfo(
        infoOutput: String,
        packageName: String,
    ): String? {
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
    fun checkOutdated(): BrewCommandResult = commandExecutor.executeBrewCommand(listOf("outdated"))

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
                cacheDir
                    .walkTopDown()
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
        val result = commandExecutor.executeBrewCommand(listOf("update"))

        // Clear cache after update to ensure fresh data
        if (result.isSuccess) {
            cacheService.clear()
            logger.info("Cache cleared after successful brew update")
        }

        return result
    }

    /**
     * Executes brew upgrade command to upgrade all packages
     */
    fun upgradePackages(): BrewCommandResult {
        val result = commandExecutor.executeBrewCommand(listOf("upgrade"))

        // Clear cache after upgrade to ensure fresh data
        if (result.isSuccess) {
            cacheService.clear()
            logger.info("Cache cleared after successful brew upgrade")
        }

        return result
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
        return commandExecutor.executeBrewCommand(listOf("doctor"), 300) // 5 minute timeout for doctor
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
    ): BrewCommandResult = commandExecutor.executeBrewCommand(args, timeoutSeconds)

    private fun parseBrewOutput(output: String): List<BrewPackage> =
        output
            .lines()
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
            }.sortedBy { it.name }

    fun getTldrInfo(command: String): TldrResult {
        val cacheKey = "tldr_info:$command"

        // Try to get from cache first
        val cachedResult = cacheService.get<TldrResult>(cacheKey)
        if (cachedResult != null) {
            logger.debug("Cache hit for tldr info: $command")
            return cachedResult
        }

        logger.debug("Cache miss for tldr info: $command")
        logger.info("Getting tldr info for command: $command")

        if (command.isBlank()) {
            val result =
                TldrResult(
                    command = command,
                    output = "",
                    isSuccess = false,
                    errorMessage = "Command name cannot be empty",
                    exitCode = 1,
                )
            // Cache error results too (with shorter TTL)
            cacheService.set(cacheKey, result, 60L) // 1 minute TTL for error results
            return result
        }

        // Sanitize command to prevent command injection
        val sanitizedCommand = command.trim().replace(Regex("[^a-zA-Z0-9._-]"), "")
        if (sanitizedCommand.isEmpty()) {
            val result =
                TldrResult(
                    command = command,
                    output = "",
                    isSuccess = false,
                    errorMessage = "Invalid command name",
                    exitCode = 1,
                )
            // Cache error results too (with shorter TTL)
            cacheService.set(cacheKey, result, 60L) // 1 minute TTL for error results
            return result
        }

        val result = commandExecutor.executeTldrCommand(sanitizedCommand, 10)
        val tldrResult =
            TldrResult(
                command = sanitizedCommand,
                output = result.output,
                isSuccess = result.isSuccess,
                errorMessage = result.errorMessage,
                exitCode = result.exitCode,
            )

        // Cache the result with TTL
        val ttl = if (tldrResult.isSuccess) 1800L else 60L // 30 minutes for success, 1 minute for errors
        cacheService.set(cacheKey, tldrResult, ttl)
        logger.debug("Cached tldr info for: $command (TTL: ${ttl}s)")

        return tldrResult
    }

    /**
     * Invalidate cache entries for a specific package
     */
    private fun invalidatePackageCache(packageName: String) {
        val packageInfoKey = "package_info:$packageName"
        val packageInfoWithDepsKey = "package_info_with_deps:$packageName"
        val packageCommandsKey = "package_commands:$packageName"

        cacheService.remove(packageInfoKey)
        cacheService.remove(packageInfoWithDepsKey)
        cacheService.remove(packageCommandsKey)
        logger.debug(
            "Invalidated cache for package: $packageName (basic, with dependencies, and commands)",
        )
    }

    /**
     * Get cache statistics for debugging
     */
    fun getCacheStats(): CacheStats = cacheService.getStats()

    /**
     * Clear all cache entries
     */
    fun clearCache() {
        cacheService.clear()
        logger.info("Cleared all cache entries")
    }

    /**
     * Pre-populate cache for a specific package
     * This ensures the package info is immediately available after installation
     */
    private fun prePopulatePackageCache(packageName: String) {
        try {
            logger.info("Pre-populating cache for newly installed package: $packageName")

            // Pre-populate basic package info
            val basicResult = getPackageInfo(packageName)
            if (basicResult.isSuccess) {
                logger.debug("Successfully pre-populated basic package info for: $packageName")
            } else {
                logger.warn("Failed to pre-populate basic package info for: $packageName - ${basicResult.errorMessage}")
            }

            // Pre-populate package info with dependencies
            val depsResult = getPackageInfoWithDependencies(packageName, emptyList())
            if (depsResult.isSuccess) {
                logger.debug("Successfully pre-populated package info with dependencies for: $packageName")
            } else {
                logger.warn(
                    "Failed to pre-populate package info with dependencies for: " +
                        "$packageName - ${depsResult.errorMessage}",
                )
            }

            // Pre-populate package commands
            val commandsResult = getPackageCommands(packageName)
            if (commandsResult.isSuccess) {
                logger.debug("Successfully pre-populated package commands for: $packageName")

                // Pre-populate TLDR info for each command provided by the package
                var tldrSuccessCount = 0
                if (commandsResult.commands.isNotEmpty()) {
                    commandsResult.commands.forEach { command ->
                        try {
                            val tldrResult = getTldrInfo(command)
                            if (tldrResult.isSuccess) {
                                tldrSuccessCount++
                            }
                        } catch (e: Exception) {
                            logger.debug("Failed to pre-populate TLDR for command $command: ${e.message}")
                        }
                    }
                }
                logger.debug("Pre-populated TLDR info for $tldrSuccessCount commands from package: $packageName")
            } else {
                logger.warn(
                    "Failed to pre-populate package commands for: $packageName - ${commandsResult.errorMessage}",
                )
            }

            logger.info("Cache pre-population completed for package: $packageName")
        } catch (e: Exception) {
            logger.error("Error pre-populating cache for package $packageName: ${e.message}", e)
        }
    }
}
