package cn.arorms.hsi.server.mq.models;

import cn.arorms.hsi.server.mq.models.payload.ResultPayload;
import cn.arorms.hsi.server.enums.TaskType;

import java.time.LocalDateTime;

/**
 * Envelope for task results returned from Python workers.
 * Contains task identification, status, timestamp, and result payload.
 * 
 * @param <T> Result payload type
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public class ResultEnvelope<T extends ResultPayload> {
    private String taskId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private TaskType type;
    private String status;
    private T data;

    public ResultEnvelope() {
    }

    public ResultEnvelope(String taskId, LocalDateTime timestamp, TaskType type, String status, T data) {
        this.taskId = taskId;
        this.timestamp = timestamp;
        this.type = type;
        this.status = status;
        this.data = data;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public TaskType getType() {
        return type;
    }

    public void setType(TaskType type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}