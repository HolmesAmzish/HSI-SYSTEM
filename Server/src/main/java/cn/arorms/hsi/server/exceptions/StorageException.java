package cn.arorms.hsi.server.exceptions;

/**
 * Refactored StorageException using Java.
 * @param message The detail message.
 * @param cause The cause of the exception (optional, defaults to null).
 */
public class StorageException extends RuntimeException {
    
    public StorageException(String message) {
        super(message);
    }
    
    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}