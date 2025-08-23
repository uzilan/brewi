package model

/**
 * Represents a single package installed via Homebrew
 */
data class BrewPackage(
    val name: String,
    val version: String? = null,
    val description: String? = null,
)
