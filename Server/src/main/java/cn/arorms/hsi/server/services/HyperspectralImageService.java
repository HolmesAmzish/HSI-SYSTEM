package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.dtos.mq.payload.HsiLoadResult;
import cn.arorms.hsi.server.dtos.mq.ResultEnvelope;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.services.mq.TaskQueueSender;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

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
    public void processLoadResult(ResultEnvelope<HsiLoadResult> envelope) {
        HsiLoadResult result = envelope.getData();
        String taskId = envelope.getTaskId();
        
        logger.info("Processing HSI_LOAD result for task: {}", taskId);
        
        try {
            // Normalize path separators (Python on Windows may use backslashes)
            String normalizedBinaryPath = result.getBinaryPath().replace('\\', '/');
            
            // Resolve relative path to absolute path
            String absoluteBinPath = resolveRelativePath(normalizedBinaryPath);
            
            // Validate the binary file exists
            File binaryFile = new File(absoluteBinPath);
            if (!binaryFile.exists()) {
                logger.error("Binary file not found: {}", absoluteBinPath);
                throw new IllegalStateException("Binary file not found: " + absoluteBinPath);
            }
            
            // Find the hyperspectral image by MAT path and update it
            // The MAT path is stored in the entity when the file was uploaded
            // Binary path is like: bin/hsi/Dioni.bin
            // MAT path is like: mat/hsi/Dioni.mat
            String filename = Path.of(normalizedBinaryPath).getFileName().toString();
            String matPath = "mat/hsi/" + filename.replace(".bin", ".mat");
            
            hsiRepository.findByMatPath(matPath).ifPresentOrElse(hsi -> {
                hsi.setBinPath(absoluteBinPath);
                hsi.setHeight(result.getHeight());
                hsi.setWidth(result.getWidth());
                hsi.setBands(result.getBands());
                hsi.setDataType(result.getDataType());
                hsi.setFileSize(result.getFileSize());
                hsi.setProcessedAt(LocalDateTime.now());
                hsi.setStatus(ProcessStatus.COMPLETED);
                hsiRepository.save(hsi);
                
                logger.info("HSI_LOAD result processed successfully. Image updated: {}x{}x{}, file: {}", 
                        result.getHeight(), result.getWidth(), result.getBands(), absoluteBinPath);
            }, () -> {
                // If no existing entity found, create a new one
                logger.warn("No existing HSI entity found for MAT path: {}, creating new one", matPath);
                HyperspectralImage newHsi = new HyperspectralImage();
                newHsi.setFilename(Path.of(absoluteBinPath).getFileName().toString());
                newHsi.setMatPath(matPath);
                newHsi.setBinPath(absoluteBinPath);
                newHsi.setHeight(result.getHeight());
                newHsi.setWidth(result.getWidth());
                newHsi.setBands(result.getBands());
                newHsi.setDataType(result.getDataType());
                newHsi.setFileSize(result.getFileSize());
                newHsi.setProcessedAt(LocalDateTime.now());
                newHsi.setStatus(ProcessStatus.COMPLETED);
                hsiRepository.save(newHsi);
                
                logger.info("New HSI entity created: {}x{}x{}, file: {}", 
                        result.getHeight(), result.getWidth(), result.getBands(), absoluteBinPath);
            });
            
        } catch (Exception e) {
            logger.error("Failed to process HSI_LOAD result for task: {}", taskId, e);
            throw e;
        }
    }
    
    /**
     * Resolve relative path to absolute path based on shared data location.
     *
     * @param relativePath Relative path from Python worker
     * @return Absolute path
     */
    private String resolveRelativePath(String relativePath) {
        Path path = Paths.get(relativePath);
        if (path.isAbsolute()) {
            return path.toString();
        }
        return Paths.get(sharedDataLocation, relativePath).toString();
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

        logger.debug("File upload request: filename: {}, size: {} bytes, path: {}",
                filename, fileSize, matPath);

        var hsi = new HyperspectralImage();
        //noinspection ConstantConditions the filename has checked in file validation annotation
        hsi.setFilename(filename);
        hsi.setFileSize(fileSize);
        hsi.setMatPath(matPath);
        hsiRepository.save(hsi);

        // Send load task to message queue
        taskQueueSender.sendHsiLoadTask(matPath);
    }
}
