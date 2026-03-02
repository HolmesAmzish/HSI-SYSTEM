package cn.arorms.hsi.server.services.mq;

import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.dtos.mq.payload.ResultPayload;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.mq.handlers.ResultHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dispatcher for routing task results to appropriate handlers using Strategy Pattern.
 * Manages a registry of handlers and dispatches results based on task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class ResultDispatcher {
    
    private static final Logger log = LoggerFactory.getLogger(ResultDispatcher.class);
    
    private final Map<TaskType, ResultHandler<? extends ResultPayload>> handlers = new ConcurrentHashMap<>();
    
    /**
     * Register all handlers via Spring dependency injection.
     * 
     * @param handlerList List of handlers provided by Spring
     */
    public ResultDispatcher(List<ResultHandler<? extends ResultPayload>> handlerList) {
        for (ResultHandler<? extends ResultPayload> handler : handlerList) {
            handlers.put(handler.getSupportedTaskType(), handler);
            log.debug("Registered handler for task type: {}", handler.getSupportedTaskType());
        }
        log.info("TaskResultDispatcher initialized with {} handlers", handlers.size());
    }
    
    /**
     * Dispatch a task result to the appropriate handler.
     * 
     * @param envelope The result envelope to process
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public void dispatch(ResultEnvelope<?> envelope) {
        TaskType taskType = envelope.getType();
        
        ResultHandler handler = handlers.get(taskType);
        if (handler == null) {
            log.warn("No handler registered for task type: {}", taskType);
            return;
        }
        
        log.debug("Dispatching result for task {} to handler: {}", 
                envelope.getTaskId(), handler.getClass().getSimpleName());
        
        handler.handle(envelope);
    }
    
    /**
     * Get the handler for a specific task type.
     * 
     * @param taskType The task type
     * @return The handler for the task type, or null if not registered
     */
    public ResultHandler<? extends ResultPayload> getHandler(TaskType taskType) {
        return handlers.get(taskType);
    }
    
    /**
     * Check if a handler is registered for a specific task type.
     * 
     * @param taskType The task type to check
     * @return true if a handler is registered
     */
    public boolean hasHandler(TaskType taskType) {
        return handlers.containsKey(taskType);
    }
}