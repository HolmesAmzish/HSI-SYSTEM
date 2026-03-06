package cn.arorms.hsi.server.mq.consumers.handlers;

import cn.arorms.hsi.server.mq.models.payload.GtLoadResult;
import cn.arorms.hsi.server.mq.models.ResultEnvelope;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.AuditLogService;
import cn.arorms.hsi.server.services.GroundTruthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handler for GT_LOAD task results.
 * Processes ground truth mask load results.
 * 
 * @author Cacciatore
 * @version 1.2 2026-03-06
 */
@Component
public class GtLoadResultHandler implements ResultHandler<GtLoadResult> {
    
    private static final Logger log = LoggerFactory.getLogger(GtLoadResultHandler.class);
    private final AuditLogService auditLogService;
    private final GroundTruthService groundTruthService;

    public GtLoadResultHandler(AuditLogService auditLogService, GroundTruthService groundTruthService) {
        this.auditLogService = auditLogService;
        this.groundTruthService = groundTruthService;
    }

    @Override
    public TaskType getSupportedTaskType() {
        return TaskType.GT_LOAD;
    }
    
    @Override
    public void handle(ResultEnvelope<GtLoadResult> envelope) {
        String taskId = envelope.getTaskId();

        auditLogService.info(getClass(), "Processing GT_LOAD result for task: {}", taskId);
        
        var result = envelope.getData();
        groundTruthService.processMqLoadResult(
                result.getGtId(),
                result.getBinaryPath(),
                result.getHeight(),
                result.getWidth(),
                result.getNumClasses(),
                result.getFileSize()
        );

        log.info("GT_LOAD result processed successfully for task: {}", taskId);
    }
}
