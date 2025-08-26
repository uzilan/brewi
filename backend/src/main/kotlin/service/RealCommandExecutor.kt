package service

import model.BrewCommandResult
import org.slf4j.LoggerFactory
import java.util.concurrent.TimeUnit

/**
 * Real implementation of CommandExecutor that executes actual brew commands
 */
class RealCommandExecutor : CommandExecutor {
    private val logger = LoggerFactory.getLogger(RealCommandExecutor::class.java)

    override fun executeBrewCommand(
        args: List<String>,
        timeoutSeconds: Long,
    ): BrewCommandResult {
        return try {
            val command = listOf("brew") + args
            logger.debug("Executing command: ${command.joinToString(" ")}")
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
            logger.error("Error executing brew command: ${e.message}", e)
            BrewCommandResult(
                isSuccess = false,
                output = "",
                errorMessage = "Failed to execute brew command: ${e.message}",
            )
        }
    }

    override fun executeTldrCommand(
        command: String,
        timeoutSeconds: Long,
    ): BrewCommandResult {
        return try {
            val process =
                ProcessBuilder("tldr", command)
                    .redirectErrorStream(true)
                    .start()

            val completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS)

            if (!completed) {
                process.destroyForcibly()
                return BrewCommandResult(
                    isSuccess = false,
                    output = "",
                    errorMessage = "tldr command timed out after $timeoutSeconds seconds",
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
                    errorMessage = "tldr command failed with exit code $exitCode: $output",
                    exitCode = exitCode,
                )
            }
        } catch (e: Exception) {
            if (e is InterruptedException) {
                Thread.currentThread().interrupt()
            }
            logger.error("Error executing tldr command: ${e.message}", e)
            BrewCommandResult(
                isSuccess = false,
                output = "",
                errorMessage = "Failed to execute tldr command: ${e.message}",
            )
        }
    }
}
