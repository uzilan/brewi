package model

/**
 * Result of executing a brew command
 */
data class BrewCommandResult(
    val isSuccess: Boolean,
    val output: String,
    val errorMessage: String? = null,
    val exitCode: Int = 0,
)
