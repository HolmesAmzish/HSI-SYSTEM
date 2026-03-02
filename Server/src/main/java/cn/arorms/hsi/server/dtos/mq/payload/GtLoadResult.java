package cn.arorms.hsi.server.dtos.mq.payload;

import java.util.Map;

/**
 * Result payload for GT_LOAD task type.
 * Contains ground truth mask information.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public class GtLoadResult extends ResultPayload {
    private Integer height;
    private Integer width;
    private Integer numClasses;
    private String binaryPath;
    private Map<Integer, String> classLabels;

    public GtLoadResult() {
    }

    public GtLoadResult(Integer height, Integer width, Integer numClasses, String binaryPath, Map<Integer, String> classLabels) {
        this.height = height;
        this.width = width;
        this.numClasses = numClasses;
        this.binaryPath = binaryPath;
        this.classLabels = classLabels;
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

    public Integer getNumClasses() {
        return numClasses;
    }

    public void setNumClasses(Integer numClasses) {
        this.numClasses = numClasses;
    }

    public String getBinaryPath() {
        return binaryPath;
    }

    public void setBinaryPath(String binaryPath) {
        this.binaryPath = binaryPath;
    }

    public Map<Integer, String> getClassLabels() {
        return classLabels;
    }

    public void setClassLabels(Map<Integer, String> classLabels) {
        this.classLabels = classLabels;
    }
}