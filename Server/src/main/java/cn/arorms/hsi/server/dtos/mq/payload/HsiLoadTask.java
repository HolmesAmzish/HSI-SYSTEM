package cn.arorms.hsi.server.dtos.mq.payload;

/**
 * Task payload for HSI_LOAD task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
public class HsiLoadTask extends TaskPayload {
    private String filePath;

    public HsiLoadTask() {
    }

    public HsiLoadTask(String filePath) {
        this.filePath = filePath;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
}