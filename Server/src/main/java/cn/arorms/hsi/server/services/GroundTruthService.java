package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.entities.GroundTruthRaster;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.GroundTruthRasterRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GroundTruthService {
    private final StorageService storageService;
    private final AuditLogService auditLogService;
    private final HyperspectralImageRepository hyperspectralImageRepository;
    private final TaskQueueSender taskQueueSender;
    private final GroundTruthRasterRepository groundTruthRasterRepository;

    public GroundTruthService(StorageService storageService, AuditLogService auditLogService, HyperspectralImageRepository hyperspectralImageRepository, TaskQueueSender taskQueueSender, GroundTruthRasterRepository groundTruthRasterRepository) {
        this.storageService = storageService;
        this.auditLogService = auditLogService;
        this.hyperspectralImageRepository = hyperspectralImageRepository;
        this.taskQueueSender = taskQueueSender;
        this.groundTruthRasterRepository = groundTruthRasterRepository;
    }

    public void uploadGtMatFile(Long hsiId, MultipartFile file) {
        String matPath = storageService.store(file, FileType.GT_MAT);
        String filename = file.getOriginalFilename();
        Long fileSize = file.getSize();

        auditLogService.info(getClass(), "File upload request: filename: {}, size: {} bytes, path: {}", filename, fileSize, matPath);

        var gt = new GroundTruthRaster();
        gt.setImage(hyperspectralImageRepository.getReferenceById(hsiId));
        gt.setFilename(filename);
        gt.setMatPath(matPath);

        groundTruthRasterRepository.save(gt);

        taskQueueSender.sendGtLoadTask(gt.getId(), hsiId, matPath);
    }
}
