package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.DatasetRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
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
     *
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
     *
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

//    public Resource downloadHsiBinFile(Long hsiId) {
//        var hsi = hsiRepository.findById(hsiId)
//                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));
//        String filepath = hsi.getBinPath();
//        return storageService.loadAsResource(filepath, FileType.HSI_BIN);
//    }

    /**
     * Generate a false-color RGB image from the hyperspectral image.
     * If no bands are specified, uses bands at 25%, 50%, 75% of total bands.
     *
     * @param hsiId   Hyperspectral image ID
     * @param redBand    Red band index (0-based)
     * @param greenBand  Green band index (0-based)
     * @param blueBand   Blue band index (0-based)
     * @return BufferedImage RGB image
     */
    public BufferedImage getRgbImage(Long hsiId, Integer redBand, Integer greenBand, Integer blueBand) {
        var hsi = hsiRepository.findById(hsiId)
                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));

        // Validate the HSI has been processed
//        if (hsi.getBinPath() == null || hsi.getDataset().getHeight() == null ||
//            hsi.getWidth() == null || hsi.getBands() == null) {
//            throw new IllegalStateException("HSI data not ready. File may still be processing.");
//        }

        int totalBands = hsi.getDataset().getBands();
        int height = hsi.getDataset().getHeight();
        int width = hsi.getDataset().getWidth();

        // Default bands at 25%, 50%, 75% if not specified
        int rBand = (redBand != null) ? redBand : totalBands / 4;
        int gBand = (greenBand != null) ? greenBand : totalBands / 2;
        int bBand = (blueBand != null) ? blueBand : (totalBands * 3) / 4;

        // Validate band indices
        if (rBand < 0 || rBand >= totalBands || 
            gBand < 0 || gBand >= totalBands || 
            bBand < 0 || bBand >= totalBands) {
            throw new IllegalArgumentException(
                String.format("Band indices out of range. Valid range: 0-%d", totalBands - 1));
        }

        auditLogService.info(getClass(), "Generating RGB image for HSI ID: {}, bands: R={}, G={}, B={}",
                hsiId, rBand, gBand, bBand);

        // Load the binary file
        Resource resource = storageService.loadAsResource(hsi.getBinPath(), FileType.HSI_BIN);

        try (InputStream is = resource.getInputStream()) {
            // Data format: [height, width, bands] - Little Endian float32
            // Each pixel has all bands stored sequentially
            float[][] bandR = new float[height][width];
            float[][] bandG = new float[height][width];
            float[][] bandB = new float[height][width];

            byte[] buffer = new byte[4];
            
            // Read pixel by pixel (each pixel has bands values)
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    for (int b = 0; b < totalBands; b++) {
                        int bytesRead = is.read(buffer, 0, 4);
                        if (bytesRead != 4) {
                            throw new IOException("Unexpected end of file");
                        }
                        // Little Endian float32
                        float value = ByteBuffer.wrap(buffer)
                                .order(ByteOrder.LITTLE_ENDIAN)
                                .getFloat();
                        
                        if (b == rBand) {
                            bandR[y][x] = value;
                        } else if (b == gBand) {
                            bandG[y][x] = value;
                        } else if (b == bBand) {
                            bandB[y][x] = value;
                        }
                    }
                }
            }

            // Normalize and create RGB image
            return createRgbImage(bandR, bandG, bandB, height, width);

        } catch (IOException e) {
            throw new RuntimeException("Failed to read HSI binary file", e);
        }
    }

    /**
     * Create RGB BufferedImage from three band matrices with normalization.
     */
    private BufferedImage createRgbImage(float[][] bandR, float[][] bandG, float[][] bandB, 
                                          int height, int width) {
        // Find min/max for each band for normalization
        float minR = Float.MAX_VALUE, maxR = Float.MIN_VALUE;
        float minG = Float.MAX_VALUE, maxG = Float.MIN_VALUE;
        float minB = Float.MAX_VALUE, maxB = Float.MIN_VALUE;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                float r = bandR[y][x];
                float g = bandG[y][x];
                float b = bandB[y][x];

                if (!Float.isNaN(r) && !Float.isInfinite(r)) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                }
                if (!Float.isNaN(g) && !Float.isInfinite(g)) {
                    minG = Math.min(minG, g);
                    maxG = Math.max(maxG, g);
                }
                if (!Float.isNaN(b) && !Float.isInfinite(b)) {
                    minB = Math.min(minB, b);
                    maxB = Math.max(maxB, b);
                }
            }
        }

        // Create RGB image
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int r = normalizeToByte(bandR[y][x], minR, maxR);
                int g = normalizeToByte(bandG[y][x], minG, maxG);
                int b = normalizeToByte(bandB[y][x], minB, maxB);

                int rgb = (r << 16) | (g << 8) | b;
                image.setRGB(x, y, rgb);
            }
        }

        return image;
    }

    /**
     * Normalize float value to 0-255 byte range.
     */
    private int normalizeToByte(float value, float min, float max) {
        if (Float.isNaN(value) || Float.isInfinite(value)) {
            return 0;
        }
        if (max == min) {
            return 128;
        }
        float normalized = (value - min) / (max - min);
        return Math.max(0, Math.min(255, (int) (normalized * 255)));
    }
}
