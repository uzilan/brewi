package model

/**
 * Represents detailed information about a package including dependencies
 */
data class BrewPackageInfo(
    val name: String,
    val description: String? = null,
    val version: String? = null,
    val dependencies: List<String> = emptyList(),
    val dependents: List<String> = emptyList(),
    val output: String,
    val isSuccess: Boolean,
    val errorMessage: String? = null
)
