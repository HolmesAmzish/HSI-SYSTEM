package cn.arorms.hsi.server.mq.models.payload;

import cn.arorms.hsi.server.entities.Dataset;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Task payload for HSI_INFERENCE task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsiInferenceTask extends TaskPayload {
    // TODO: Add hsiID
//    private Long hsiId;
    private String filePath;
    private Dataset dataset;
}