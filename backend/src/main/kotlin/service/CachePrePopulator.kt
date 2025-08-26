package service

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import org.slf4j.LoggerFactory
import java.util.concurrent.Executors

/**
 * Service to pre-populate the cache with common package information
 * Uses coroutines with a custom thread pool for parallel execution
 */
class CachePrePopulator(
    private val brewService: BrewService,
    private val maxConcurrency: Int = 4,
) {
    private val logger = LoggerFactory.getLogger(CachePrePopulator::class.java)

    // Custom thread pool for brew commands to avoid blocking the main application
    private val brewCommandExecutor = Executors.newFixedThreadPool(maxConcurrency)
    private val brewCommandScope = CoroutineScope(Dispatchers.IO)

    // We'll fetch the real installed packages dynamically

    /**
     * Pre-populate cache with all installed package information
     * This runs in parallel using coroutines
     */
    suspend fun prePopulateCache() {
        val startTime = System.currentTimeMillis()

        try {
            // Get the list of installed packages
            val installedPackages = getInstalledPackages()
            logger.info("Starting cache pre-population for ${installedPackages.size} installed packages")

            if (installedPackages.isEmpty()) {
                logger.warn("No installed packages found to pre-populate cache")
                return
            }

            // Use coroutines to fetch package info in parallel
            val jobs =
                installedPackages.map { packageName ->
                    brewCommandScope.async {
                        try {
                            // Cache basic package info, package info with dependencies, and package commands
                            val basicResult = brewService.getPackageInfo(packageName)
                            val depsResult = brewService.getPackageInfoWithDependencies(packageName, emptyList())
                            val commandsResult = brewService.getPackageCommands(packageName)

                            // Cache TLDR info for each command provided by the package
                            var tldrSuccessCount = 0
                            if (commandsResult.isSuccess && commandsResult.commands.isNotEmpty()) {
                                commandsResult.commands.forEach { command ->
                                    try {
                                        val tldrResult = brewService.getTldrInfo(command)
                                        if (tldrResult.isSuccess) {
                                            tldrSuccessCount++
                                        }
                                    } catch (e: Exception) {
                                        logger.debug("Failed to cache TLDR for command $command: ${e.message}")
                                    }
                                }
                            }

                            val packageDataSuccessful = basicResult.isSuccess && 
                                depsResult.isSuccess && commandsResult.isSuccess

                            if (packageDataSuccessful) {
                                logger.debug(
                                    "Successfully cached package data (basic, deps, commands) for: " +
                                        "$packageName, cached TLDR for $tldrSuccessCount commands",
                                )
                            } else {
                                logger.warn(
                                    "Failed to cache some package data for: $packageName - " +
                                        "basic: ${basicResult.errorMessage}, " +
                                        "deps: ${depsResult.errorMessage}, " +
                                        "commands: ${commandsResult.errorMessage}",
                                )
                            }
                            packageDataSuccessful
                        } catch (e: Exception) {
                            logger.error("Error caching package data for $packageName: ${e.message}", e)
                            false
                        }
                    }
                }

            val results = jobs.awaitAll()
            val successCount = results.count { it }
            val failureCount = results.size - successCount

            val duration = System.currentTimeMillis() - startTime
            logger.info(
                "Cache pre-population completed in ${duration}ms. Success: $successCount, Failed: $failureCount",
            )
        } catch (e: Exception) {
            logger.error("Error during cache pre-population: ${e.message}", e)
        }
    }

    /**
     * Get list of installed packages
     */
    private suspend fun getInstalledPackages(): List<String> =
        withContext(Dispatchers.IO) {
            try {
                val result = brewService.listPackages()
                if (result.isSuccess) {
                    result.packages.map { it.name }
                } else {
                    logger.warn("Failed to get installed packages: ${result.errorMessage}")
                    emptyList()
                }
            } catch (e: Exception) {
                logger.error("Error getting installed packages: ${e.message}", e)
                emptyList()
            }
        }

    /**
     * Pre-populate cache for specific packages
     */
    suspend fun prePopulateSpecificPackages(packages: List<String>) {
        logger.info("Pre-populating cache for specific packages: ${packages.joinToString(", ")}")

        val jobs =
            packages.map { packageName ->
                brewCommandScope.async {
                    try {
                        // Cache basic package info, package info with dependencies, and package commands
                        val basicResult = brewService.getPackageInfo(packageName)
                        val depsResult = brewService.getPackageInfoWithDependencies(packageName, emptyList())
                        val commandsResult = brewService.getPackageCommands(packageName)

                        // Cache TLDR info for each command provided by the package
                        var tldrSuccessCount = 0
                        if (commandsResult.isSuccess && commandsResult.commands.isNotEmpty()) {
                            commandsResult.commands.forEach { command ->
                                try {
                                    val tldrResult = brewService.getTldrInfo(command)
                                    if (tldrResult.isSuccess) {
                                        tldrSuccessCount++
                                    }
                                } catch (e: Exception) {
                                    logger.debug("Failed to cache TLDR for command $command: ${e.message}")
                                }
                            }
                        }

                        val packageDataSuccessful = basicResult.isSuccess && 
                            depsResult.isSuccess && commandsResult.isSuccess

                        if (packageDataSuccessful) {
                            logger.debug(
                                "Successfully cached package data (basic, deps, commands) for: " +
                                    "$packageName, cached TLDR for $tldrSuccessCount commands",
                            )
                        } else {
                            logger.warn(
                                "Failed to cache some package data for: $packageName - " +
                                    "basic: ${basicResult.errorMessage}, " +
                                    "deps: ${depsResult.errorMessage}, " +
                                    "commands: ${commandsResult.errorMessage}",
                            )
                        }
                        packageName to packageDataSuccessful
                    } catch (e: Exception) {
                        logger.error("Error caching package data for $packageName: ${e.message}", e)
                        packageName to false
                    }
                }
            }

        val results = jobs.awaitAll()
        val successCount = results.count { it.second }
        val failureCount = results.size - successCount

        logger.info("Specific package cache pre-population completed. Success: $successCount, Failed: $failureCount")

        // Log failed packages for debugging
        val failedPackages = results.filter { !it.second }.map { it.first }
        if (failedPackages.isNotEmpty()) {
            logger.warn("Failed to cache packages: ${failedPackages.joinToString(", ")}")
        }
    }

    /**
     * Pre-populate cache for a limited number of installed packages
     * Useful when you have many packages but want to limit the initial load
     */
    suspend fun prePopulateLimitedPackages(limit: Int = 20) {
        val startTime = System.currentTimeMillis()

        try {
            val installedPackages = getInstalledPackages()
            logger.info("Found ${installedPackages.size} installed packages, limiting to $limit for pre-population")

            if (installedPackages.isEmpty()) {
                logger.warn("No installed packages found to pre-populate cache")
                return
            }

            val packagesToCache = installedPackages.take(limit)
            logger.info(
                "Pre-populating cache for ${packagesToCache.size} packages (limited from ${installedPackages.size})",
            )

            prePopulateSpecificPackages(packagesToCache)

            val duration = System.currentTimeMillis() - startTime
            logger.info("Limited cache pre-population completed in ${duration}ms")
        } catch (e: Exception) {
            logger.error("Error during limited cache pre-population: ${e.message}", e)
        }
    }

    /**
     * Shutdown the thread pool
     */
    fun shutdown() {
        logger.info("Shutting down cache pre-populator thread pool")
        brewCommandExecutor.shutdown()
    }
}
