package cn.arorms.hsi.server.dtos;

import cn.arorms.hsi.server.entities.SegmentationLabel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for PCA 3D point cloud data.
 * Contains XYZ coordinates for each pixel (from PCA-reduced 3 channels),
 * along with ground truth labels for visualization.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-11
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PcaPointCloud {

    private int width;
    private int height;

    /**
     * Point data array: [x, y, z, gtIndex] for each pixel.
     * Size: [totalPoints * 4] - each point has x, y, z, gtIndex values.
     * Stored as flat array: [x0, y0, z0, gt0, x1, y1, z1, gt1, ...]
     * gtIndex is the ground truth label index (0 if no GT).
     */
    private float[] points;

    /**
     * List of segmentation labels for the dataset.
     * Each label contains index, name, and color info for front-end rendering.
     */
    private List<SegmentationLabel> labelMap;
}