package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Result payload for HSI_LOAD task type.
 * Contains metadata about the loaded hyperspectral image cube.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
@EqualsAndHashCode(callSuper = true)
@Data @AllArgsConstructor @NoArgsConstructor
public class HsiLoadResult extends ResultPayload {
    private Long hsiId;
    private Long datasetId;
    private Integer height;
    private Integer width;
    private Integer bands;
    private String binaryPath;
    private String dataType = "float32";
    private Long fileSize;
}