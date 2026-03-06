package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Error result payload for failed tasks.
 * Contains error information for debugging.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResult extends ResultPayload {
    private String errorCode;
    private String errorMessage;
    private String stackTrace;
}