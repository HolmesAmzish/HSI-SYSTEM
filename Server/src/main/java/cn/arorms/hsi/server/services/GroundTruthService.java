package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.dtos.GroundTruthMatrix;
import cn.arorms.hsi.server.dtos.GroundTruthStats;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.entities.GroundTruth;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.entities.SegmentationLabel;
import cn.arorms.hsi.server.enums.FileType;
import cn.arorms.hsi.server.enums.ProcessStatus;
import cn.arorms.hsi.server.exceptions.InvalidMessageException;
import cn.arorms.hsi.server.mq.producers.TaskQueueSender;
import cn.arorms.hsi.server.repositories.GroundTruthRepository;
import cn.arorms.hsi.server.repositories.HyperspectralImageRepository;
import cn.arorms.hsi.server.repositories.SegmentationLabelRepository;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;

@Service
public class GroundTruthService {
    private final StorageService storageService;
    private final AuditLogService auditLogService;
    private final HyperspectralImageRepository hyperspectralImageRepository;
    private final TaskQueueSender taskQueueSender;
    private final GroundTruthRepository groundTruthRepository;
    private final SegmentationLabelRepository segmentationLabelRepository;

    public GroundTruthService(
            StorageService storageService,
            AuditLogService auditLogService,
            HyperspectralImageRepository hyperspectralImageRepository,
            TaskQueueSender taskQueueSender,
            GroundTruthRepository groundTruthRepository,
            SegmentationLabelRepository segmentationLabelRepository
    ) {
        this.storageService = storageService;
        this.auditLogService = auditLogService;
        this.hyperspectralImageRepository = hyperspectralImageRepository;
        this.taskQueueSender = taskQueueSender;
        this.groundTruthRepository = groundTruthRepository;
        this.segmentationLabelRepository = segmentationLabelRepository;
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

    public GroundTruthMatrix getGtMaskMatrix(Long id) {
        GroundTruth gt = groundTruthRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ground truth not found with ID: " + id));
        
        if (gt.getBinPath() == null || gt.getHeight() == null || gt.getWidth() == null) {
            throw new NoSuchElementException("Ground truth binary data not ready for ID: " + id);
        }
        
        int height = gt.getHeight();
        int width = gt.getWidth();
        
        Resource resource = storageService.loadAsResource(gt.getBinPath(), FileType.GT_BIN);
        
        byte[] matrix;
        try (InputStream is = resource.getInputStream()) {
            matrix = readGtBinaryAsBytes(is, height, width);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read GT binary file", e);
        }

        Long datasetId = gt.getImage().getDataset().getId();
        List<SegmentationLabel> labelMap = segmentationLabelRepository.findByDatasetId(datasetId);
        
        return new GroundTruthMatrix(
                matrix,
                labelMap,
                height,
                width,
                gt.getNumClasses()
        );
    }
    
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
                // Read as Little Endian float and convert to byte (label values are 0-255)
                float value = ByteBuffer.wrap(buffer)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .getFloat();
                matrix[index++] = (byte) Math.round(value);
            }
        }
        
        return matrix;
    }

    /**
     * Get spectral statistics for each category in the ground truth.
     * Calculates pixel count, mean spectrum, and standard deviation spectrum per class.
     *
     * @param gtId Ground truth ID
     * @return GroundTruthStats containing statistics for each category
     */
    public GroundTruthStats getGtStats(Long gtId) {
        GroundTruth gt = groundTruthRepository.findById(gtId)
                .orElseThrow(() -> new NoSuchElementException("Ground truth not found with ID: " + gtId));

        if (gt.getBinPath() == null || gt.getHeight() == null || gt.getWidth() == null) {
            throw new NoSuchElementException("Ground truth binary data not ready for ID: " + gtId);
        }

        HyperspectralImage hsi = gt.getImage();
        if (hsi == null || hsi.getBinPath() == null) {
            throw new NoSuchElementException("Associated HSI binary data not found for GT ID: " + gtId);
        }

        Dataset dataset = hsi.getDataset();
        int gtHeight = gt.getHeight();
        int gtWidth = gt.getWidth();
        int hsiHeight = dataset.getHeight();
        int hsiWidth = dataset.getWidth();
        int bands = dataset.getBands();

        // Validate dimensions match
        if (gtHeight != hsiHeight || gtWidth != hsiWidth) {
            throw new IllegalStateException("GT dimensions (" + gtHeight + "x" + gtWidth + 
                    ") do not match HSI dimensions (" + hsiHeight + "x" + hsiWidth + ")");
        }

        // Read GT labels
        byte[] gtLabels;
        Resource gtResource = storageService.loadAsResource(gt.getBinPath(), FileType.GT_BIN);
        try (InputStream is = gtResource.getInputStream()) {
            gtLabels = readGtBinaryAsBytes(is, gtHeight, gtWidth);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read GT binary file", e);
        }

        // Read HSI spectral data
        float[][][] spectralData;
        Resource hsiResource = storageService.loadAsResource(hsi.getBinPath(), FileType.HSI_BIN);
        try (InputStream is = hsiResource.getInputStream()) {
            spectralData = readHsiBinaryAsFloats(is, hsiHeight, hsiWidth, bands);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read HSI binary file", e);
        }

        // Get label info
        Long datasetId = dataset.getId();
        List<SegmentationLabel> labels = segmentationLabelRepository.findByDatasetId(datasetId);
        Map<Integer, SegmentationLabel> labelMap = new HashMap<>();
        for (SegmentationLabel label : labels) {
            labelMap.put(label.getLabelIndex(), label);
        }

        // Calculate statistics per class
        // Map: labelValue -> list of pixel spectra (each spectrum is float[bands])
        Map<Integer, List<float[]>> classPixels = new HashMap<>();

        for (int y = 0; y < hsiHeight; y++) {
            for (int x = 0; x < hsiWidth; x++) {
                int pixelIndex = y * hsiWidth + x;
                int labelValue = gtLabels[pixelIndex] & 0xFF; // Convert to unsigned

                // Skip background (label 0) if needed, or include all
                float[] spectrum = spectralData[y][x];
                classPixels.computeIfAbsent(labelValue, k -> new ArrayList<>()).add(spectrum);
            }
        }

        // Build stats
        List<GroundTruthStats.CategorySpectralStat> categories = new ArrayList<>();
        for (Map.Entry<Integer, List<float[]>> entry : classPixels.entrySet()) {
            int labelValue = entry.getKey();
            List<float[]> pixelSpectra = entry.getValue();

            SegmentationLabel label = labelMap.get(labelValue);
            if (label == null) {
                // Create a placeholder label for unknown values
                label = new SegmentationLabel();
                label.setLabelIndex(labelValue);
                label.setName("Class " + labelValue);
            }

            long pixelCount = pixelSpectra.size();
            List<Double> meanSpectrum = calculateMeanSpectrum(pixelSpectra, bands);
            List<Double> stdDevSpectrum = calculateStdDevSpectrum(pixelSpectra, meanSpectrum, bands);

            GroundTruthStats.CategorySpectralStat stat = new GroundTruthStats.CategorySpectralStat();
            stat.setLabel(label);
            stat.setPixelCount(pixelCount);
            stat.setMeanSpectrum(meanSpectrum);
            stat.setStdDevSpectrum(stdDevSpectrum);
            categories.add(stat);
        }

        // Sort by label index
        categories.sort(Comparator.comparingInt(c -> c.getLabel().getLabelIndex()));

        // Generate wavelength indices (1-based indices)
        List<Float> wavelengths = new ArrayList<>();
        for (int i = 1; i <= bands; i++) {
            wavelengths.add((float) i);
        }

        return new GroundTruthStats(wavelengths, categories);
    }

    /**
     * Read HSI binary data into a 3D float array [height][width][bands].
     * Binary format: [height, width, bands] - Little Endian float32.
     * Data is stored pixel by pixel, each pixel has all band values.
     */
    private float[][][] readHsiBinaryAsFloats(InputStream is, int height, int width, int bands) throws IOException {
        // Result array: [height][width][bands]
        float[][][] data = new float[height][width][bands];
        byte[] buffer = new byte[4];

        // Read pixel by pixel: [height, width, bands]
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                for (int b = 0; b < bands; b++) {
                    int bytesRead = is.read(buffer, 0, 4);
                    if (bytesRead != 4) {
                        throw new IOException("Unexpected end of HSI binary file at pixel (" + y + ", " + x + "), band " + b);
                    }
                    data[y][x][b] = ByteBuffer.wrap(buffer)
                            .order(ByteOrder.LITTLE_ENDIAN)
                            .getFloat();
                }
            }
        }

        return data;
    }

    /**
     * Calculate mean spectrum for a list of pixel spectra.
     */
    private List<Double> calculateMeanSpectrum(List<float[]> pixelSpectra, int bands) {
        double[] sum = new double[bands];
        int count = pixelSpectra.size();

        for (float[] spectrum : pixelSpectra) {
            for (int b = 0; b < bands; b++) {
                sum[b] += spectrum[b];
            }
        }

        List<Double> mean = new ArrayList<>(bands);
        for (int b = 0; b < bands; b++) {
            mean.add(sum[b] / count);
        }

        return mean;
    }

    /**
     * Calculate standard deviation spectrum for a list of pixel spectra.
     */
    private List<Double> calculateStdDevSpectrum(List<float[]> pixelSpectra, List<Double> meanSpectrum, int bands) {
        int count = pixelSpectra.size();

        double[] variance = new double[bands];
        for (float[] spectrum : pixelSpectra) {
            for (int b = 0; b < bands; b++) {
                double diff = spectrum[b] - meanSpectrum.get(b);
                variance[b] += diff * diff;
            }
        }

        List<Double> stdDev = new ArrayList<>(bands);
        for (int b = 0; b < bands; b++) {
            stdDev.add(Math.sqrt(variance[b] / count));
        }

        return stdDev;
    }
}
