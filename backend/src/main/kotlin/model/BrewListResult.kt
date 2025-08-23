package model

/**
 * Represents the result of running "brew list" command
 */
data class BrewListResult(
    val packages: List<BrewPackage>,
    val isSuccess: Boolean,
    val errorMessage: String? = null,
    val totalCount: Int = packages.size,
)
