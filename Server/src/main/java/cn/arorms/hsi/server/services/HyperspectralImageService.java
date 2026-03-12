package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.annotations.ValidFile;
import cn.arorms.hsi.server.dtos.PcaPointCloud;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.entities.GroundTruth;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.entities.SegmentationLabel;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.DatasetRepository;
import cn.arorms.hsi.server.repositories.GroundTruthRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import cn.arorms.hsi.server.repositories.SegmentationLabelRepository;
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
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class HyperspectralImageService {
    private final HyperspectralImageRepository hsiRepository;
    private final StorageService storageService;
    private final TaskQueueSender taskQueueSender;
    private final AuditLogService auditLogService;
    private final DatasetRepository datasetRepository;
    private final GroundTruthRepository groundTruthRepository;
    private final SegmentationLabelRepository segmentationLabelRepository;
    private final SegmentationLabelService segmentationLabelService;

    @Value("${application.share.location}")
    private String sharedDataLocation;

    public HyperspectralImageService(
            StorageService storageService,
            HyperspectralImageRepository hsiRepository,
            TaskQueueSender taskQueueSender,
            AuditLogService auditLogService,
            DatasetRepository datasetRepository,
            GroundTruthRepository groundTruthRepository,
            SegmentationLabelRepository segmentationLabelRepository, SegmentationLabelService segmentationLabelService) {
        this.hsiRepository = hsiRepository;
        this.storageService = storageService;
        this.taskQueueSender = taskQueueSender;
        this.auditLogService = auditLogService;
        this.datasetRepository = datasetRepository;
        this.groundTruthRepository = groundTruthRepository;
        this.segmentationLabelRepository = segmentationLabelRepository;
        this.segmentationLabelService = segmentationLabelService;
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

    public void processPcaResult(Long hsiId, String pcaPath) {
        if (!storageService.exists(pcaPath)) {
            throw new InvalidMessageException("The hsi load result binary file path does not exist.");
        }
        hsiRepository.findById(hsiId).ifPresentOrElse(hsi -> {
            hsi.setPcaPath(pcaPath);
//            hsi.setStatus(ProcessStatus.COMPLETED);
            hsiRepository.save(hsi);
            auditLogService.info(getClass(), "HSI_PCA result processed successfully. PCA result updated: " + pcaPath);
        }, () -> {
            // If no existing entity found
            throw new InvalidMessageException("No existing HSI entity found for HSI id: " + hsiId);
        });
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

    /**
     * Trigger PCA task for a hyperspectral image.
     * Sends a PCA task to the message queue for processing by Python worker.
     *
     * @param hsiId Hyperspectral image ID
     * @return Task ID
     */
    public String triggerPcaTask(Long hsiId) {
        HyperspectralImage hsi = hsiRepository.findById(hsiId)
                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));

        if (hsi.getBinPath() == null) {
            throw new IllegalStateException("HSI binary data not ready for ID: " + hsiId);
        }

        auditLogService.info(getClass(), "Triggering PCA task for HSI ID: {}", hsiId);
        return taskQueueSender.sendHsiPcaTask(hsiId, hsi.getBinPath());
    }

    /**
     * Get PCA point cloud data for visualization.
     * Returns points array [x, y, z, gtIndex] for each pixel.
     *
     * @param hsiId Hyperspectral image ID
     * @param gtId  Ground truth ID (optional, can be null)
     * @return PcaPointCloud DTO containing points and labels
     */
    public PcaPointCloud getPcaPointCloud(Long hsiId, Long gtId) {
        HyperspectralImage hsi = hsiRepository.findById(hsiId)
                .orElseThrow(() -> new NoSuchElementException("HSI not found with ID: " + hsiId));

        if (hsi.getPcaPath() == null) {
            throw new NoSuchElementException("PCA data not ready for HSI ID: " + hsiId + ". Please trigger PCA task first.");
        }

        Dataset dataset = hsi.getDataset();
        int height = dataset.getHeight();
        int width = dataset.getWidth();
//        int totalPoints = height * width;


        // Read GT labels first if gtId is provided (to know if we need to read GT)
        byte[] gtLabels = null;
        List<SegmentationLabel> labelMap = null;

        if (gtId != null) {
            GroundTruth gt = groundTruthRepository.findById(gtId)
                    .orElseThrow(() -> new NoSuchElementException("Ground truth not found with ID: " + gtId));

            if (gt.getBinPath() != null && gt.getHeight() != null && gt.getWidth() != null) {
                Resource gtResource = storageService.loadAsResource(gt.getBinPath(), FileType.GT_BIN);
                try (InputStream is = gtResource.getInputStream()) {
                    gtLabels = readGtBinaryAsBytes(is, gt.getHeight(), gt.getWidth());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to read GT binary file", e);
                }
                labelMap = segmentationLabelRepository.findByDatasetId(dataset.getId());
            }
        }

        // Read PCA binary data and combine with GT labels
        float[] points;
        Resource pcaResource = storageService.loadAsResource(hsi.getPcaPath(), FileType.PCA_BIN);
        try (InputStream is = pcaResource.getInputStream()) {
            points = readPcaBinaryWithGt(is, height, width, gtLabels);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read PCA binary file", e);
        }

        return new PcaPointCloud(width, height, points, labelMap);
    }

    /**
     * Read PCA binary data and combine with GT labels.
     * Output: [x0, y0, z0, gt0, x1, y1, z1, gt1, ...] for each pixel.
     */
    private float[] readPcaBinaryWithGt(InputStream is, int height, int width, byte[] gtLabels) throws IOException {
        int totalPoints = height * width;
        float[] points = new float[totalPoints * 4];
        byte[] buffer = new byte[4];

        for (int i = 0; i < totalPoints; i++) {
            // Read x, y, z
            for (int c = 0; c < 3; c++) {
                int bytesRead = is.read(buffer, 0, 4);
                if (bytesRead != 4) {
                    throw new IOException("Unexpected end of PCA binary file at point " + i);
                }
                points[i * 4 + c] = ByteBuffer.wrap(buffer)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .getFloat();
            }
            // Add gtIndex (0 if no GT)
            points[i * 4 + 3] = (gtLabels != null) ? gtLabels[i] : 0;
        }

        return points;
    }

    /**
     * Read GT binary data into byte array.
     */
    private byte[] readGtBinaryAsBytes(InputStream is, int height, int width) throws IOException {
        byte[] matrix = new byte[height * width];
        byte[] buffer = new byte[4];

        int index = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int bytesRead = is.read(buffer, 0, 4);
                if (bytesRead != 4) {
                    throw new IOException("Unexpected end of GT binary file");
                }
                float value = ByteBuffer.wrap(buffer)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .getFloat();
                matrix[index++] = (byte) Math.round(value);
            }
        }

        return matrix;
    }
}
