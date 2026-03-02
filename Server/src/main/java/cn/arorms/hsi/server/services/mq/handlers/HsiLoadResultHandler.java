package cn.arorms.hsi.server.services.mq.handlers;

import cn.arorms.hsi.server.dtos.mq.payload.HsiLoadResult;
import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.HyperspectralImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handler for HSI_LOAD task results.
 * Processes hyperspectral image load results and updates database entities.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class HsiLoadResultHandler implements ResultHandler<HsiLoadResult> {
    
    private static final Logger log = LoggerFactory.getLogger(HsiLoadResultHandler.class);
    
    private final HyperspectralImageService hyperspectralImageService;
    
    public HsiLoadResultHandler(HyperspectralImageService hyperspectralImageService) {
        this.hyperspectralImageService = hyperspectralImageService;
    }
    
    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.HSI_LOAD;
    }
    
    @Override
    public void handle(ResultEnvelope<HsiLoadResult> envelope) {
        String taskId = envelope.getTaskId();
        log.info("Processing HSI_LOAD result for task: {}", taskId);
        
        try {
            hyperspectralImageService.processLoadResult(envelope);
            log.info("HSI_LOAD result processed successfully for task: {}", taskId);
        } catch (Exception e) {
            log.error("Failed to process HSI_LOAD result for task: {}", taskId, e);
            throw e;
        }
    }
}