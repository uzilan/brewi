package model

/**
 * Result of getting commands for a package
 */
data class BrewPackageCommands(
    val packageName: String,
    val commands: List<String>,
    val isSuccess: Boolean,
    val errorMessage: String? = null,
    val exitCode: Int = 0,
)
