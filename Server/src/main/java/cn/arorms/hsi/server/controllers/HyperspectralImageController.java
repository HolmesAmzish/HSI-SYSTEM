package cn.arorms.hsi.server.controllers;

import cn.arorms.hsi.server.dtos.PcaPointCloud;
import cn.arorms.hsi.server.entities.HyperspectralImage;
import cn.arorms.hsi.server.services.HyperspectralImageService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/hsi")
public class HyperspectralImageController {

    private final HyperspectralImageService hsiService;

    HyperspectralImageController(HyperspectralImageService hsiService) {
        this.hsiService = hsiService;
    }

    @GetMapping
    public Page<HyperspectralImage> getHsiList(
            // TODO: Adjust more filter conditions
            @PageableDefault(direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return hsiService.getHsiList(pageable);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HyperspectralImage> updateHsi(@PathVariable Long id, @RequestBody HyperspectralImage hsi) {
        return ResponseEntity.ok(hsiService.updateHsi(id, hsi));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHsi(@PathVariable Long id) {
        hsiService.deleteHsi(id);
        return ResponseEntity.ok("Successfully deleted hsi: " + id);
    }

    @PostMapping("/upload/{dataset_id}")
    public ResponseEntity<String> handleHsiMatUpload(
            @PathVariable("dataset_id") Long datasetId,
            @RequestParam("file") MultipartFile file
    ) {
        hsiService.uploadHsiMatFile(datasetId, file);
        return ResponseEntity.ok("Hyperspectral image mat file upload success");
    }

    /**
     * Get a false-color RGB image from the hyperspectral image.
     * @param id         HSI ID
     * @param redBand    Red band index (optional, default 25% of bands)
     * @param greenBand  Green band index (optional, default 50% of bands)
     * @param blueBand   Blue band index (optional, default 75% of bands)
     * @return PNG image bytes
     */
    @GetMapping("/get-image/{id}")
    public ResponseEntity<byte[]> getHsiRgbImage(
            @PathVariable Long id,
            @RequestParam(value = "red") Integer redBand,
            @RequestParam(value = "green") Integer greenBand,
            @RequestParam(value = "blue") Integer blueBand) {

        BufferedImage image = hsiService.getRgbImage(id, redBand, greenBand, blueBand);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "PNG", baos);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(baos.toByteArray());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Trigger PCA task for a hyperspectral image.
     * Sends a PCA task to Redis MQ for Python worker to process.
     *
     * @param id HSI ID
     * @return Task ID
     */
    @PostMapping("/pca/{id}")
    public ResponseEntity<Map<String, String>> triggerPcaTask(@PathVariable Long id) {
        String taskId = hsiService.triggerPcaTask(id);
        return ResponseEntity.ok(Map.of(
                "message", "PCA task triggered successfully",
                "taskId", taskId
        ));
    }

    /**
     * Get PCA point cloud data for 3D visualization.
     * Returns XYZ coordinates from PCA-reduced 3 channels with optional GT labels.
     *
     * @param id   HSI ID
     * @param gtId Ground truth ID (optional)
     * @return PcaPointCloud DTO
     */
    @GetMapping("/pca/{id}")
    public ResponseEntity<PcaPointCloud> getPcaPointCloud(
            @PathVariable Long id,
            @RequestParam(value = "gtId", required = false) Long gtId) {
        PcaPointCloud pointCloud = hsiService.getPcaPointCloud(id, gtId);
        return ResponseEntity.ok(pointCloud);
    }
}
