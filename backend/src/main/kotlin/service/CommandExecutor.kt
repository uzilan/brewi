package service

import model.BrewCommandResult

/**
 * Interface for executing brew commands
 * This allows for easy mocking in tests
 */
interface CommandExecutor {
    fun executeBrewCommand(
        args: List<String>,
        timeoutSeconds: Long = 30,
    ): BrewCommandResult

    fun executeTldrCommand(
        command: String,
        timeoutSeconds: Long = 10,
    ): BrewCommandResult
}
