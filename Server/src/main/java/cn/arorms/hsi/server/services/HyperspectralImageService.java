package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.dtos.mq.payload.HsiLoadResult;
import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.services.mq.TaskQueueSender;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
public class HyperspectralImageService {
    private static final Logger logger = LoggerFactory.getLogger(HyperspectralImageService.class);
    private final HyperspectralImageRepository hsiRepository;
    private final StorageService storageService;
    private final TaskQueueSender taskQueueSender;
    
    @Value("${application.share.location}")
    private String sharedDataLocation;

    public HyperspectralImageService(StorageService storageService, 
                                     HyperspectralImageRepository hsiRepository, 
                                     TaskQueueSender taskQueueSender) {
        this.hsiRepository = hsiRepository;
        this.storageService = storageService;
        this.taskQueueSender = taskQueueSender;
    }

    /**
     * Process HSI_LOAD task result from Python worker.
     * Updates the hyperspectral image entity with metadata from the loaded file.
     *
     * @param envelope Result envelope containing task result
     */
    public void processMqLoadResult(ResultEnvelope<HsiLoadResult> envelope) {
        HsiLoadResult result = envelope.getData();
        String taskId = envelope.getTaskId();
        
        logger.info("Processing HSI_LOAD result for task: {}", taskId);

        Long hsiId = result.getHsiId();

        // Normalize path separators (Python on Windows may use backslashes)
        String normalizedBinaryPath = result.getBinaryPath().replace('\\', '/');

        // Resolve relative path to absolute path
        if (!storageService.exists(result.getBinaryPath())) {
            throw new InvalidMessageException("The hsi load result binary file path does not exist.");
        }

        // Find the hyperspectral image by hsi id and update it
        // The MAT path is stored in the entity when the file was uploaded
        // Binary path is like: bin/hsi/Dioni.bin

        hsiRepository.findById(hsiId).ifPresentOrElse(hsi -> {
            hsi.setBinPath(normalizedBinaryPath);
            hsi.setHeight(result.getHeight());
            hsi.setWidth(result.getWidth());
            hsi.setBands(result.getBands());
            hsi.setDataType(result.getDataType());
            hsi.setFileSize(result.getFileSize());
            hsi.setProcessedAt(LocalDateTime.now());
            hsi.setStatus(ProcessStatus.COMPLETED);
            hsiRepository.save(hsi);

            logger.info("HSI_LOAD result processed successfully. Image updated: {}x{}x{}, file: {}",
                    result.getHeight(), result.getWidth(), result.getBands(), normalizedBinaryPath);}, () -> {
            // If no existing entity found
            throw new InvalidMessageException("No existing HSI entity found for HSI id: " + hsiId);
        });

    }

    /**
     * Get list of all hyperspectral images with pagination.
     *
     * @param pageable Pagination information
     * @return Page of hyperspectral images
     */
    public Page<HyperspectralImage> getHsiList(Pageable pageable) {
        return hsiRepository.findAll(pageable);
    }

    /**
     * Upload HSI MAT file and send load task to message queue.
     *
     * @param file Multipart file to upload
     */
    @ValidFile
    public void uploadHsiMatFile(MultipartFile file) {
        String matPath = storageService.store(file, FileType.HSI_MAT);
        String filename = file.getOriginalFilename();
        Long fileSize = file.getSize();

        logger.info("File upload request: filename: {}, size: {} bytes, path: {}",
                filename, fileSize, matPath);

        var hsi = new HyperspectralImage();
        //noinspection ConstantConditions the filename has checked in file validation annotation
        hsi.setFilename(filename);
        hsi.setFileSize(fileSize);
        hsi.setMatPath(matPath);
        var savedHsi = hsiRepository.save(hsi);
        Long hsiId = savedHsi.getId();
        // Send load task to message queue
        taskQueueSender.sendHsiLoadTask(hsiId, matPath);
    }

    public Resource downloadHsiBinFile(Long hsiId) {
        var hsi = hsiRepository.findById(hsiId)
                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));
        String filepath = hsi.getBinPath();
        return storageService.loadAsResource(filepath, FileType.HSI_BIN);
    }
}
