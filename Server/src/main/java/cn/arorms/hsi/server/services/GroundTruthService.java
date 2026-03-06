package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.entities.GroundTruth;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.GroundTruthRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import cn.arorms.hsi.server.utils.HsiImageUtils;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.NoSuchElementException;

@Service
public class GroundTruthService {
    private final StorageService storageService;
    private final AuditLogService auditLogService;
    private final HyperspectralImageRepository hyperspectralImageRepository;
    private final TaskQueueSender taskQueueSender;
    private final GroundTruthRepository groundTruthRepository;

    public GroundTruthService(
            StorageService storageService,
            AuditLogService auditLogService,
            HyperspectralImageRepository hyperspectralImageRepository,
            TaskQueueSender taskQueueSender,
            GroundTruthRepository groundTruthRepository
    ) {
        this.storageService = storageService;
        this.auditLogService = auditLogService;
        this.hyperspectralImageRepository = hyperspectralImageRepository;
        this.taskQueueSender = taskQueueSender;
        this.groundTruthRepository = groundTruthRepository;
    }

    public Page<GroundTruth> getAllGt(Pageable pageable) {
        return groundTruthRepository.findAll(pageable);
    }

    public GroundTruth getGtById(Long gtId) {
        return groundTruthRepository.findById(gtId)
                .orElseThrow(() -> new NoSuchElementException("Ground truth not found with ID: " + gtId));
    }

    public void deleteGt(Long id) {
        groundTruthRepository.deleteById(id);
    }

    // Add gt manually
    public GroundTruth addGroundTruth(Long hsiId, GroundTruth gt) {
        gt.setImage(hyperspectralImageRepository.getReferenceById(hsiId));
        return groundTruthRepository.save(gt);
    }

    public void uploadGtMatFile(Long hsiId, MultipartFile file) {
        String matPath = storageService.store(file, FileType.GT_MAT);
        String filename = file.getOriginalFilename();
        Long fileSize = file.getSize();

        auditLogService.info(getClass(), "File upload request: filename: {}, size: {} bytes, path: {}", filename, fileSize, matPath);

        var gt = new GroundTruth();
        gt.setImage(hyperspectralImageRepository.getReferenceById(hsiId));
        gt.setFilename(filename);
        gt.setMatPath(matPath);

        groundTruthRepository.save(gt);

        taskQueueSender.sendGtLoadTask(gt.getId(), hsiId, matPath);
    }

    public void processMqLoadResult(Long gtId, String binPath, Integer height, Integer width, Integer numClasses, Long fileSize) {
        GroundTruth existingGt = groundTruthRepository.findById(gtId)
                .orElseThrow(() -> new InvalidMessageException("Invalid gt ID sent from mq: " + gtId));
        
        if (!storageService.exists(binPath)) {
            throw new InvalidMessageException("The gt load result binary file path does not exist: " + binPath);
        }
        
        existingGt.setBinPath(binPath);
        existingGt.setHeight(height);
        existingGt.setWidth(width);
        existingGt.setNumClasses(numClasses);
        existingGt.setFileSize(fileSize);
        existingGt.setStatus(ProcessStatus.COMPLETED);
        groundTruthRepository.save(existingGt);
        
        auditLogService.info(getClass(), "GT_LOAD result processed successfully. Ground truth updated: " + binPath);
    }

    public byte[] getGtMaskImage(Long id) {
        GroundTruth gt = groundTruthRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ground truth not found with ID: " + id));
        
        if (gt.getBinPath() == null || gt.getHeight() == null || gt.getWidth() == null) {
            throw new NoSuchElementException("Ground truth binary data not ready for ID: " + id);
        }
        
        Resource resource = storageService.loadAsResource(gt.getBinPath(), FileType.GT_BIN);
        
        try (InputStream is = resource.getInputStream()) {
            // Read GT binary data and create grayscale image
            BufferedImage image = readGtBinaryAndCreateImage(is, gt.getHeight(), gt.getWidth());
            
            // Convert to PNG bytes
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read GT binary file", e);
        }
    }
    
    private BufferedImage readGtBinaryAndCreateImage(InputStream is, int height, int width) throws IOException {
        float[][] data = new float[height][width];
        byte[] buffer = new byte[4];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int bytesRead = is.read(buffer, 0, 4);
                if (bytesRead != 4) {
                    throw new IOException("Unexpected end of GT binary file");
                }
                data[y][x] = java.nio.ByteBuffer.wrap(buffer)
                        .order(java.nio.ByteOrder.LITTLE_ENDIAN)
                        .getFloat();
            }
        }
        
        // Create grayscale image
        return HsiImageUtils.createRgbImage(data, data, data, height, width);
    }
}
