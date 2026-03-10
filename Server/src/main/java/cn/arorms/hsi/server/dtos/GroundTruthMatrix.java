package cn.arorms.hsi.server.dtos;

import cn.arorms.hsi.server.entities.SegmentationLabel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Ground Truth Matrix load from binary gt file
 * Returns the raw label matrix data for frontend display
 */
@Data @AllArgsConstructor @NoArgsConstructor
public class GroundTruthMatrix {
    // Raw byte array of label values (row-major order, each pixel is 1 byte)
    // Base64 encoded when serialized to JSON
    private byte[] matrix;
    // Map of label value to label info (may not cover all values in matrix)
    private List<SegmentationLabel> labelMap;
    private int height;
    private int width;
    private int numClasses;
}
