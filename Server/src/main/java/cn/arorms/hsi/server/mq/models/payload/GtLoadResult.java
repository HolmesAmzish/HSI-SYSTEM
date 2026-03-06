package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Result payload for GT_LOAD task type.
 * Contains ground truth mask information.
 * 
 * @author Cacciatore
 * @version 1.1 2026-03-06
 */
@EqualsAndHashCode(callSuper = true)
@Data @AllArgsConstructor
@NoArgsConstructor
public class GtLoadResult extends ResultPayload {
    private Long gtId;
    private Long hsiId;
    private Integer height;
    private Integer width;
    private String binaryPath;
    private Integer numClasses;
    private Long fileSize;
}
