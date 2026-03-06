package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Task payload for GT_LOAD task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@EqualsAndHashCode(callSuper = true)
@Data @AllArgsConstructor @NoArgsConstructor
public class GtLoadTask extends TaskPayload {
    private Long gtId;
    private Long hsiId;
    private String filePath;
}