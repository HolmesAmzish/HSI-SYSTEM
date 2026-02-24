package cn.arorms.hsi.server.exceptions

/**
 * Refactored StorageException using Kotlin.
 * * @param message The detail message.
 * @param cause The cause of the exception (optional, defaults to null).
 */
class StorageException @JvmOverloads constructor(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)