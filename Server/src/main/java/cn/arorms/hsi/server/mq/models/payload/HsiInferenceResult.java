package cn.arorms.hsi.server.mq.models.payload;

import java.util.Map;

/**
 * Result payload for HSI_INFERENCE task type.
 * Contains inference results and predictions.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public class HsiInferenceResult extends ResultPayload {
    private Integer height;
    private Integer width;
    private String classificationMap;
    private String confidenceMap;
    private Map<String, Double> metrics;

    public HsiInferenceResult() {
    }

    public HsiInferenceResult(Integer height, Integer width, String classificationMap, String confidenceMap, Map<String, Double> metrics) {
        this.height = height;
        this.width = width;
        this.classificationMap = classificationMap;
        this.confidenceMap = confidenceMap;
        this.metrics = metrics;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public String getClassificationMap() {
        return classificationMap;
    }

    public void setClassificationMap(String classificationMap) {
        this.classificationMap = classificationMap;
    }

    public String getConfidenceMap() {
        return confidenceMap;
    }

    public void setConfidenceMap(String confidenceMap) {
        this.confidenceMap = confidenceMap;
    }

    public Map<String, Double> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Double> metrics) {
        this.metrics = metrics;
    }
}