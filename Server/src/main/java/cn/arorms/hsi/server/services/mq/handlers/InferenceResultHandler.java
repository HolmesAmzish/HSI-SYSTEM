package cn.arorms.hsi.server.services.mq.handlers;

import cn.arorms.hsi.server.dtos.mq.payload.HsiInferenceResult;
import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.enums.TaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handler for HSI_INFERENCE task results.
 * Processes hyperspectral image inference results.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class InferenceResultHandler implements ResultHandler<HsiInferenceResult> {
    
    private static final Logger log = LoggerFactory.getLogger(InferenceResultHandler.class);
    
    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.HSI_INFERENCE;
    }
    
    @Override
    public void handle(ResultEnvelope<HsiInferenceResult> envelope) {
        String taskId = envelope.getTaskId();
        log.info("Processing HSI_INFERENCE result for task: {}", taskId);
        
        // TODO: Implement inference result processing logic
        // This may include:
        // - Updating classification results in database
        // - Processing confidence maps
        // - Storing performance metrics
        
        log.debug("HSI_INFERENCE result received: {}", taskId);
    }
}