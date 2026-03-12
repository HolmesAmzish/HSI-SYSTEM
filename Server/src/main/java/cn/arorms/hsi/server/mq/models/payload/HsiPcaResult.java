package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Result payload for HSI_PCA task type.
 * Contains the PCA result path after Python processing.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-11
 */
@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsiPcaResult extends ResultPayload {
    private Long hsiId;
    private String pcaPath;
}