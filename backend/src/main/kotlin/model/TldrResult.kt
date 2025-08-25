package model

data class TldrResult(
    val command: String,
    val output: String,
    val isSuccess: Boolean,
    val errorMessage: String? = null,
    val exitCode: Int = 0,
)
