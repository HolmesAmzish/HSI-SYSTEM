package cn.arorms.hsi.server.exceptions;

/**
 * Exception for invalid message in mq
 */
public class InvalidMessageException extends RuntimeException {
    public InvalidMessageException(String message) {
        super(message);
    }

    public InvalidMessageException(String message, Throwable cause) {
        super(message, cause);
    }
}
