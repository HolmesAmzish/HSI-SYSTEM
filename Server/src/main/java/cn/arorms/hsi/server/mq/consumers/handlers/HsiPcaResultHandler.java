package cn.arorms.hsi.server.mq.consumers.handlers;

import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.mq.models.ResultEnvelope;
import cn.arorms.hsi.server.mq.models.payload.HsiPcaResult;
import cn.arorms.hsi.server.services.HyperspectralImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handler for HSI_PCA task results.
 * Processes PCA results and updates the HyperspectralImage entity.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-11
 */
@Component
public class HsiPcaResultHandler implements ResultHandler<HsiPcaResult> {
    
    private static final Logger log = LoggerFactory.getLogger(HsiPcaResultHandler.class);
    
    private final HyperspectralImageService hyperspectralImageService;

    public HsiPcaResultHandler(HyperspectralImageService hyperspectralImageService) {
        this.hyperspectralImageService = hyperspectralImageService;
    }
    
    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.HSI_PCA;
    }
    
    @Override
    public void handle(ResultEnvelope<HsiPcaResult> envelope) {
        String taskId = envelope.getTaskId();
        log.info("Processing HSI_PCA result for task: {}", taskId);

        HsiPcaResult result = envelope.getData();
        hyperspectralImageService.processPcaResult(result.getHsiId(), result.getPcaPath());

        log.info("HSI_PCA result processed successfully for task: {}", taskId);
    }
}