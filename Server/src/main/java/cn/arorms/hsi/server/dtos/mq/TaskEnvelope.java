package cn.arorms.hsi.server.dtos.mq;

import cn.arorms.hsi.server.dtos.mq.payload.TaskPayload;
import cn.arorms.hsi.server.enums.TaskType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Envelope for task requests sent to Python workers.
 * 
 * @param <T> Task payload type
 * @author Cacciatore
 * @version 1.0 2026-03-01
 */
public class TaskEnvelope<T extends TaskPayload> {
    private String taskId;
    private LocalDateTime timestamp;
    private TaskType type;
    private T data;

    public TaskEnvelope() {
        this.taskId = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now();
    }

    public TaskEnvelope(String taskId, LocalDateTime timestamp, TaskType type, T data) {
        this.taskId = taskId;
        this.timestamp = timestamp;
        this.type = type;
        this.data = data;
    }

    public TaskEnvelope(TaskType type, T data) {
        this();
        this.type = type;
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

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}