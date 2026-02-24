package cn.arorms.hsi.server.services;

import cn.arorms.hsi.server.dtos.TaskPayload;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.enums.TaskType;

import java.util.List;

/**
 * Service for managing task queue operations.
 * Handles sending tasks to Redis queue for asynchronous processing.
 */
public interface TaskQueueService {
    
    /**
     * Send a task to the Redis queue for processing
     * 
     * @param type The type of task
     * @param data The task payload data
     * @param <T> The type of task payload
     * @return The unique task ID
     */
    <T extends TaskPayload> String sendTask(TaskType type, T data);
    
    /**
     * Send HSI load task
     * 
     * @param filePath The path to the HSI file
     * @return The unique task ID
     */
    String sendHsiLoadTask(String filePath);
    
    /**
     * Send HSI inference task
     * 
     * @param filePath The path to the HSI file
     * @param dataset The dataset for inference
     * @return The unique task ID
     */
    String sendHsiInferenceTask(String filePath, Dataset dataset);
    
    /**
     * Send ground truth load task
     * 
     * @param filePath The path to the ground truth file
     * @param dataset The dataset for ground truth
     * @return The unique task ID
     */
    String sendGtLoadTask(String filePath, Dataset dataset);
    
    /**
     * Get the current queue size
     * 
     * @return The number of pending tasks in the queue
     */
    Long getQueueSize();
    
//    /**
//     * Get pending tasks for monitoring
//     *
//     * @param limit Maximum number of tasks to return
//     * @return List of task JSON strings
//     */
//    List<String> getHsiInferencePendingTasks(int limit);
}