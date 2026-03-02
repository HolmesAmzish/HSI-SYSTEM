package cn.arorms.hsi.server.dtos.mq.payload;

/**
 * Result payload for HSI_LOAD task type.
 * Contains metadata about the loaded hyperspectral image cube.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public class HsiLoadResult extends ResultPayload {
    private Integer height;
    private Integer width;
    private Integer bands;
    private String binaryPath;
    private String dataType = "float32";
    private Long fileSize;

    public HsiLoadResult() {
    }

    public HsiLoadResult(Integer height, Integer width, Integer bands, String binaryPath, String dataType, Long fileSize) {
        this.height = height;
        this.width = width;
        this.bands = bands;
        this.binaryPath = binaryPath;
        this.dataType = dataType;
        this.fileSize = fileSize;
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

    public Integer getBands() {
        return bands;
    }

    public void setBands(Integer bands) {
        this.bands = bands;
    }

    public String getBinaryPath() {
        return binaryPath;
    }

    public void setBinaryPath(String binaryPath) {
        this.binaryPath = binaryPath;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
}