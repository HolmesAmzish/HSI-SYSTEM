package cn.arorms.hsi.server.mq.models.payload;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Result payload for GT_LOAD task type.
 * Contains ground truth mask information.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class GtLoadResult extends ResultPayload {
    private Integer height;
    private Integer width;
    // Number of classes found in gt
    private Integer numClasses;
}