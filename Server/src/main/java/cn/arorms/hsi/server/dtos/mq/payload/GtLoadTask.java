package cn.arorms.hsi.server.dtos.mq.payload;

import cn.arorms.hsi.server.entities.Dataset;

/**
 * Task payload for GT_LOAD task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
public class GtLoadTask extends TaskPayload {
    private String filePath;
    private Dataset dataset;

    public GtLoadTask() {
    }

    public GtLoadTask(String filePath, Dataset dataset) {
        this.filePath = filePath;
        this.dataset = dataset;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Dataset getDataset() {
        return dataset;
    }

    public void setDataset(Dataset dataset) {
        this.dataset = dataset;
    }
}