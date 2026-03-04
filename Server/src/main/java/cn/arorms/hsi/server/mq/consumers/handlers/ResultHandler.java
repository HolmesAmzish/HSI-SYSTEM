package cn.arorms.hsi.server.mq.consumers.handlers;

import cn.arorms.hsi.server.mq.models.ResultEnvelope;
import cn.arorms.hsi.server.mq.models.payload.ResultPayload;
import cn.arorms.hsi.server.enums.TaskType;

/**
 * Strategy interface for handling different types of task results.
 * Each implementation handles a specific task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 * @param <T> The specific ResultPayload subtype this handler processes
 */
public interface ResultHandler<T extends ResultPayload> {
    
    /**
     * Get the task type this handler supports.
     * 
     * @return The supported TaskType
     */
    TaskType getSupportedTaskType();
    
    /**
     * Handle the task result.
     * 
     * @param envelope The result envelope containing task result data
     */
    void handle(ResultEnvelope<T> envelope);
}