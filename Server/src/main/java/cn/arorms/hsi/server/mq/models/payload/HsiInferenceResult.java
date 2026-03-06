package cn.arorms.hsi.server.mq.models.payload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Result payload for HSI_INFERENCE task type.
 * Contains inference results and predictions.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsiInferenceResult extends ResultPayload {
    private Integer height;
    private Integer width;
    private String classificationMap;
    private String confidenceMap;
    private Map<String, Double> metrics;
}