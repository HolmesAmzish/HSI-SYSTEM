package cn.arorms.hsi.server.dtos.mq.payload;

/**
 * Error result payload for failed tasks.
 * Contains error information for debugging.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public class ErrorResult extends ResultPayload {
    private String errorCode;
    private String errorMessage;
    private String stackTrace;

    public ErrorResult() {
    }

    public ErrorResult(String errorCode, String errorMessage, String stackTrace) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.stackTrace = stackTrace;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(String stackTrace) {
        this.stackTrace = stackTrace;
    }
}