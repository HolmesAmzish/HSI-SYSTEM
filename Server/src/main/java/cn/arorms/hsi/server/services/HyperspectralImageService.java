package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.DatasetRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import cn.arorms.hsi.server.utils.HsiImageUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.NoSuchElementException;

@Service
public class HyperspectralImageService {
    private final HyperspectralImageRepository hsiRepository;
    private final StorageService storageService;
    private final TaskQueueSender taskQueueSender;
    private final AuditLogService auditLogService;
    private final DatasetRepository datasetRepository;

    @Value("${application.share.location}")
    private String sharedDataLocation;

    public HyperspectralImageService(
            StorageService storageService,
            HyperspectralImageRepository hsiRepository,
            TaskQueueSender taskQueueSender,
            AuditLogService auditLogService, DatasetRepository datasetRepository) {
        this.hsiRepository = hsiRepository;
        this.storageService = storageService;
        this.taskQueueSender = taskQueueSender;
        this.auditLogService = auditLogService;
        this.datasetRepository = datasetRepository;
    }

    /**
     * Upload HSI MAT file and send load task to message queue.
     * @param file Multipart file to upload
     */
    @ValidFile
    public void uploadHsiMatFile(Long datasetId, MultipartFile file) {
        String matPath = storageService.store(file, FileType.HSI_MAT);
        String filename = file.getOriginalFilename();
        Long fileSize = file.getSize();

        auditLogService.info(getClass(), "File upload request: filename: {}, size: {} bytes, path: {}", filename, fileSize, matPath);

        var hsi = new HyperspectralImage();
        hsi.setDataset(datasetRepository.getReferenceById(datasetId));
        //noinspection ConstantConditions the filename has checked in file validation annotation
        hsi.setFilename(filename);
        hsi.setFileSize(fileSize);
        hsi.setMatPath(matPath);
        hsiRepository.save(hsi);
        // Send load task to message queue
        taskQueueSender.sendHsiLoadTask(hsi.getId(), datasetId, matPath);
    }

    public HyperspectralImage updateHsi(Long hsiId, HyperspectralImage hsi) {
        hsiRepository.findById(hsiId)
                        .orElseThrow(() -> new NoSuchElementException("Hyperspectral Image not found with ID: " + hsiId));
        return hsiRepository.save(hsi);
    }

    public void deleteHsi(Long hsiId) {
        hsiRepository.deleteById(hsiId);
    }

    public void processMqLoadResult(Long hsiId, String binPath, String DataType, Long fileSize) {

        // Normalize path separators (Python on Windows may use backslashes)
//        String normalizedBinaryPath = binPath.replace('\\', '/');

        // Resolve relative path to absolute path
        if (!storageService.exists(binPath)) {
            throw new InvalidMessageException("The hsi load result binary file path does not exist.");
        }

        // Find the hyperspectral image by hsi id and update it
        // The MAT path is stored in the entity when the file was uploaded
        // Binary path is like: bin/hsi/Dioni.bin

        hsiRepository.findById(hsiId).ifPresentOrElse(hsi -> {
            hsi.setBinPath(binPath);
            hsi.setDataType(DataType);
            hsi.setFileSize(fileSize);
            hsi.setStatus(ProcessStatus.COMPLETED);
            hsiRepository.save(hsi);
            auditLogService.info(getClass(), "HSI_LOAD result processed successfully. Image updated: " + binPath);
        }, () -> {
            // If no existing entity found
            throw new InvalidMessageException("No existing HSI entity found for HSI id: " + hsiId);
        });
    }

    /**
     * Get list of all hyperspectral images with pagination.
     * @param pageable Pagination information
     * @return Page of hyperspectral images
     */
    public Page<HyperspectralImage> getHsiList(Pageable pageable) {
        return hsiRepository.findAll(pageable);
    }

    public HyperspectralImage getById(Long id) {
        return hsiRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Hyperspectral Image not found with ID: " + id));
    }

    /**
     * Generate a false-color RGB image from the hyperspectral image.
     * Priority order for band selection:
     * 1. Explicitly specified bands (redBand, greenBand, blueBand parameters)
     * 2. Dataset's defaultRGB settings (defaultRed, defaultGreen, defaultBlue)
     * 3. Calculated defaults at 25%, 50%, 75% of total bands
     *
     * @param hsiId     Hyperspectral image ID
     * @param redBand   Red band index (0-based, can be null)
     * @param greenBand Green band index (0-based, can be null)
     * @param blueBand  Blue band index (0-based, can be null)
     * @return BufferedImage RGB image
     */
    public BufferedImage getRgbImage(Long hsiId, Integer redBand, Integer greenBand, Integer blueBand) {
        var hsi = hsiRepository.findById(hsiId)
                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));

        Dataset dataset = hsi.getDataset();
        int totalBands = dataset.getBands();
        int height = dataset.getHeight();
        int width = dataset.getWidth();

        int totalBand = dataset.getBands();

//        if (redBand == null || greenBand == null || blueBand == null) {
//            redBand = (dataset.getDefaultRed() != null) ? dataset.getDefaultRed() : (int) (totalBand * 0.25);
//            greenBand = (dataset.getDefaultGreen() != null) ? dataset.getDefaultGreen() : (int) (totalBand * 0.5);
//            blueBand = (dataset.getDefaultBlue() != null) ? dataset.getDefaultBlue() : (int) (totalBand * 0.75);
//        }

        auditLogService.info(getClass(), "Generating RGB image for HSI ID: {}, bands: R={}, G={}, B={}",
                hsiId, redBand, greenBand, blueBand);

        // Load the binary file
        Resource resource = storageService.loadAsResource(hsi.getBinPath(), FileType.HSI_BIN);

        try (InputStream is = resource.getInputStream()) {
            return HsiImageUtils.readBandsAndCreateRgbImage(is, height, width, totalBands, redBand, greenBand, blueBand);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read HSI binary file", e);
        }
    }
}
