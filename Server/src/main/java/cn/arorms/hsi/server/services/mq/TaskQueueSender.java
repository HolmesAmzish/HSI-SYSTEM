package cn.arorms.hsi.server.services.mq;

import cn.arorms.hsi.server.dtos.mq.*;
import cn.arorms.hsi.server.dtos.mq.payload.*;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.enums.TaskType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Component for sending tasks to Redis queues.
 * Handles task envelope creation and queue operations.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class TaskQueueSender {

    private static final Logger log = LoggerFactory.getLogger(TaskQueueSender.class);
    
    private final RedisTemplate<String, Object> redisTemplate;

    public TaskQueueSender(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Send a task to the appropriate queue based on task type.
     * 
     * @param type Task type
     * @param data Task payload
     * @return Generated task ID
     * @param <T> Task payload type
     */
    public <T extends TaskPayload> String sendTask(TaskType type, T data) {
        TaskEnvelope<T> envelope = new TaskEnvelope<>(
                UUID.randomUUID().toString(),
                LocalDateTime.now(),
                type,
                data
        );

        redisTemplate.opsForList().leftPush(type.getQueueKey(), envelope);
        log.debug("Task sent to queue {}: taskId={}", type.getQueueKey(), envelope.getTaskId());

        return envelope.getTaskId();
    }

    /**
     * Send HSI load task to queue.
     * 
     * @param filePath Path to the HSI file
     * @return Task ID
     */
    public String sendHsiLoadTask(String filePath) {
        log.debug("Sending HSI_LOAD task for file: {}", filePath);
        return sendTask(TaskType.HSI_LOAD, new HsiLoadTask(filePath));
    }

    /**
     * Send HSI inference task to queue.
     * 
     * @param filePath Path to the HSI file
     * @param dataset Dataset information
     * @return Task ID
     */
    public String sendHsiInferenceTask(String filePath, Dataset dataset) {
        log.debug("Sending HSI_INFERENCE task for file: {}", filePath);
        return sendTask(TaskType.HSI_INFERENCE, new HsiInferenceTask(filePath, dataset));
    }

    /**
     * Send GT load task to queue.
     * 
     * @param filePath Path to the GT file
     * @param dataset Dataset information
     * @return Task ID
     */
    public String sendGtLoadTask(String filePath, Dataset dataset) {
        log.debug("Sending GT_LOAD task for file: {}", filePath);
        return sendTask(TaskType.GT_LOAD, new GtLoadTask(filePath, dataset));
    }

    // ==================== Queue Status Methods ====================

    /**
     * Get the number of pending tasks in a specific queue.
     * 
     * @param type Task type
     * @return Number of pending tasks
     */
    public long getPendingTaskCount(TaskType type) {
        Long size = redisTemplate.opsForList().size(type.getQueueKey());
        return size != null ? size : 0L;
    }

    /**
     * Get total number of pending tasks across all queues.
     * 
     * @return Total pending task count
     */
    public long getTotalPendingTaskCount() {
        long total = 0;
        for (TaskType type : TaskType.values()) {
            total += getPendingTaskCount(type);
        }
        return total;
    }

    /**
     * Get the number of pending results in the result queue.
     * 
     * @return Number of pending results
     */
    public long getPendingResultCount() {
        Long size = redisTemplate.opsForList().size(TaskType.RESULT_QUEUE_KEY);
        return size != null ? size : 0L;
    }

    /**
     * Receive a result from the shared result queue.
     * Blocks until a result is available or timeout occurs.
     * 
     * @param timeout Timeout duration
     * @return Result envelope or null if timeout
     */
    @SuppressWarnings("unchecked")
    public <T extends ResultPayload> ResultEnvelope<T> receiveResult(Duration timeout) {
        Object result = redisTemplate.opsForList().rightPop(
                TaskType.RESULT_QUEUE_KEY,
                timeout
        );
        
        if (result instanceof ResultEnvelope) {
            return (ResultEnvelope<T>) result;
        }
        return null;
    }
}