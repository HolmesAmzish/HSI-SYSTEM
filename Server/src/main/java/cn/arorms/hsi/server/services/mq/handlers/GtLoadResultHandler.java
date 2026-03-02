package cn.arorms.hsi.server.services.mq.handlers;

import cn.arorms.hsi.server.dtos.mq.payload.GtLoadResult;
import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.enums.TaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handler for GT_LOAD task results.
 * Processes ground truth mask load results.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class GtLoadResultHandler implements ResultHandler<GtLoadResult> {
    
    private static final Logger log = LoggerFactory.getLogger(GtLoadResultHandler.class);
    
    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.GT_LOAD;
    }
    
    @Override
    public void handle(ResultEnvelope<GtLoadResult> envelope) {
        String taskId = envelope.getTaskId();
        log.info("Processing GT_LOAD result for task: {}", taskId);
        
        // TODO: Implement ground truth load result processing logic
        // This may include:
        // - Updating ground truth mask entities in database
        // - Processing class labels
        // - Creating segmentation labels based on class information
        
        log.debug("GT_LOAD result received: {}", taskId);
    }
}