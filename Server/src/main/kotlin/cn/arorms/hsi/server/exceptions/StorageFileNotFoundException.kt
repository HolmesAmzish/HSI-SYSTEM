package cn.arorms.hsi.server.exceptions;

class StorageFileNotFoundException @JvmOverloads constructor(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)