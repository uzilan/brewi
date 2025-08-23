package service

import model.BrewListResult
import model.BrewPackage
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Result of executing a brew command
 */
data class BrewCommandResult(
    val isSuccess: Boolean,
    val output: String,
    val errorMessage: String? = null,
    val exitCode: Int = 0
)

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
                isSuccess = true
            )
        } else {
            BrewListResult(
                packages = emptyList(),
                isSuccess = false,
                errorMessage = result.errorMessage
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
     * Executes brew outdated command to check for updates
     */
    fun checkOutdated(): BrewCommandResult {
        return executeBrewCommand(listOf("outdated"))
    }
    
    /**
     * Executes a custom brew command
     * @param args The arguments to pass to brew (e.g., ["--version"], ["doctor"])
     * @param timeoutSeconds Timeout in seconds (default: 30)
     * @return BrewCommandResult containing the command output and status
     */
    fun executeCustomCommand(args: List<String>, timeoutSeconds: Long = 30): BrewCommandResult {
        return executeBrewCommand(args, timeoutSeconds)
    }
    
    /**
     * Executes any brew command with the given arguments
     * @param args The arguments to pass to brew (e.g., ["list"], ["search", "python"])
     * @param timeoutSeconds Timeout in seconds (default: 30)
     * @return BrewCommandResult containing the command output and status
     */
    private fun executeBrewCommand(args: List<String>, timeoutSeconds: Long = 30): BrewCommandResult {
        return try {
            val command = listOf("brew") + args
            val process = ProcessBuilder(command)
                .redirectErrorStream(true)
                .start()
            
            val completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS)
            
            if (!completed) {
                process.destroyForcibly()
                return BrewCommandResult(
                    isSuccess = false,
                    output = "",
                    errorMessage = "Command timed out after $timeoutSeconds seconds"
                )
            }
            
            val exitCode = process.exitValue()
            val output = process.inputStream.bufferedReader().readText()
            
            if (exitCode == 0) {
                BrewCommandResult(
                    isSuccess = true,
                    output = output,
                    exitCode = exitCode
                )
            } else {
                BrewCommandResult(
                    isSuccess = false,
                    output = output,
                    errorMessage = "brew ${args.joinToString(" ")} failed with exit code $exitCode: $output",
                    exitCode = exitCode
                )
            }
            
        } catch (e: Exception) {
            if (e is InterruptedException) {
                Thread.currentThread().interrupt()
            }
            BrewCommandResult(
                isSuccess = false,
                output = "",
                errorMessage = "Failed to execute brew command: ${e.message}"
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
