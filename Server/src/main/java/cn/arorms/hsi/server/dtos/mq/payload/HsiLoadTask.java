package cn.arorms.hsi.server.dtos.mq.payload;

/**
 * Task payload for HSI_LOAD task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
public class HsiLoadTask extends TaskPayload {
    private Long hsiId;
    private String filePath;

    public HsiLoadTask() {
    }

    public HsiLoadTask(Long hsiId, String filePath) {
        this.hsiId = hsiId;
        this.filePath = filePath;
    }

    public Long getHsiId() {
        return hsiId;
    }

    public void setHsiId(Long hsiId) {
        this.hsiId = hsiId;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}