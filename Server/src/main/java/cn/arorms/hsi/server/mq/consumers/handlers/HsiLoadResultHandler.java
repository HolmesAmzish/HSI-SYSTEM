package cn.arorms.hsi.server.mq.consumers.handlers;

import cn.arorms.hsi.server.mq.models.payload.HsiLoadResult;
import cn.arorms.hsi.server.mq.models.ResultEnvelope;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.DatasetService;
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
    private final DatasetService datasetService;

    public HsiLoadResultHandler(HyperspectralImageService hyperspectralImageService, DatasetService datasetService) {
        this.hyperspectralImageService = hyperspectralImageService;
        this.datasetService = datasetService;
    }
    
    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.HSI_LOAD;
    }
    
    @Override
    public void handle(ResultEnvelope<HsiLoadResult> envelope) {
        String taskId = envelope.getTaskId();
        log.info("Processing HSI_LOAD result for task: {}", taskId);

        var result = envelope.getData();
        hyperspectralImageService.processMqLoadResult(
                result.getHsiId(),
                result.getBinaryPath(),
                result.getDataType(),
                result.getFileSize()
        );

        Long datasetId = result.getDatasetId();

        datasetService.processMqLoadResult(
                datasetId,
                result.getHeight(),
                result.getWidth(),
                result.getBands()
        );


        log.info("HSI_LOAD result processed successfully for task: {}", taskId);
    }
}