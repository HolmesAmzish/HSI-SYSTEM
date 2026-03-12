package cn.arorms.hsi.server.mq.consumers;

import cn.arorms.hsi.server.mq.models.ResultEnvelope;
import cn.arorms.hsi.server.mq.models.payload.GtLoadResult;
import cn.arorms.hsi.server.mq.models.payload.HsiInferenceResult;
import cn.arorms.hsi.server.mq.models.payload.HsiLoadResult;
import cn.arorms.hsi.server.mq.models.payload.HsiPcaResult;
import cn.arorms.hsi.server.mq.models.payload.ResultPayload;
import cn.arorms.hsi.server.enums.TaskType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Redis result queue listener using BRPOP pattern.
 * 
 * This listener uses blocking pop operation to efficiently wait for results
 * from the Redis queue without polling. It provides low latency response
 * while minimizing CPU and network overhead.
 * 
 * The listener delegates result processing to TaskResultDispatcher which
 * routes results to appropriate handlers based on task type.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-28
 */
@Component
public class ResultListener {

    private static final Logger log = LoggerFactory.getLogger(ResultListener.class);
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final ResultDispatcher taskResultDispatcher;
    
    private final ExecutorService executorService;
    private final AtomicBoolean running;
    
    private static final String RESULT_QUEUE_KEY = "hsi:queue:task-result";
    private static final long BRPOP_TIMEOUT_SECONDS = 0; // 0 means block indefinitely

    public ResultListener(
            RedisTemplate<String, Object> redisTemplate,
            ResultDispatcher ResultDispatcher) {
        this.redisTemplate = redisTemplate;
        this.taskResultDispatcher = ResultDispatcher;
        this.executorService = Executors.newSingleThreadExecutor(r -> {
            Thread thread = new Thread(r);
            thread.setName("redis-result-listener");
            thread.setDaemon(true);
            return thread;
        });
        this.running = new AtomicBoolean(false);
    }

    /**
     * Start the listener when application is ready.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (running.compareAndSet(false, true)) {
            executorService.submit(this::listenLoop);
            log.info("Redis Result Listener started, listening on queue: {}", RESULT_QUEUE_KEY);
        }
    }

    /**
     * Main listening loop using BRPOP pattern.
     * Uses native Redis connection to avoid Spring's timeout configuration.
     */
    private void listenLoop() {
        while (running.get()) {
            try {
                // Use BRPOP with 0 timeout (block indefinitely)
                // This is more efficient than polling and doesn't waste CPU cycles
                Object rawResult = redisTemplate.opsForList()
                        .rightPop(RESULT_QUEUE_KEY);
                
                if (rawResult != null) {
                    handleResult(rawResult);
                }
            } catch (Exception e) {
                if (running.get()) {
                    log.error("Error in Redis result listener loop", e);
                }
                // Prevent tight loop on persistent errors
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        log.info("Redis Result Listener stopped.");
    }

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    /**
     * Handle incoming result message.
     * 
     * @param rawResult Raw result object from Redis
     */
    @SuppressWarnings("unchecked")
    private void handleResult(Object rawResult) {
        try {
            ResultEnvelope<? extends ResultPayload> envelope;
            
            if (rawResult instanceof ResultEnvelope) {
                // Already a ResultEnvelope (from Spring sender)
                envelope = (ResultEnvelope<? extends ResultPayload>) rawResult;
            } else if (rawResult instanceof Map) {
                // JSON deserialized as LinkedHashMap (from Python sender)
                // Need to manually convert based on task type
                Map<String, Object> resultMap = (Map<String, Object>) rawResult;
                envelope = convertToEnvelope(resultMap);
                if (envelope == null) {
                    log.warn("Failed to convert result to envelope: {}", rawResult);
                    return;
                }
            } else {
                log.warn("Received unknown result format: {}", rawResult);
                return;
            }
            
            String taskId = envelope.getTaskId();
            String type = envelope.getType() != null ? envelope.getType().name() : "UNKNOWN";
            String status = envelope.getStatus();
            
            log.info("Received result for task: {}, type: {}, status: {}", 
                    taskId, type, status);
            
            // Dispatch to appropriate handler based on task type
            taskResultDispatcher.dispatch(envelope);
        } catch (Exception e) {
            log.error("Failed to handle result: {}", rawResult, e);
        }
    }
    
    /**
     * Convert a LinkedHashMap (from JSON deserialization) to a typed ResultEnvelope.
     * Handles the nested data field conversion based on task type.
     * 
     * @param resultMap The raw result map from Redis
     * @return A typed ResultEnvelope, or null if conversion fails
     */
    @SuppressWarnings("unchecked")
    private ResultEnvelope<? extends ResultPayload> convertToEnvelope(Map<String, Object> resultMap) {
        // Extract task type to determine the correct payload class
        Object typeObj = resultMap.get("type");
        TaskType taskType = null;
        if (typeObj instanceof String) {
            taskType = TaskType.fromValue((String) typeObj);
        }
        
        if (taskType == null) {
            log.warn("Unknown or missing task type in result: {}", typeObj);
            return null;
        }
        
        // Determine the payload class based on task type
        Class<? extends ResultPayload> payloadClass = getPayloadClass(taskType);
        if (payloadClass == null) {
            log.warn("No payload class mapping for task type: {}", taskType);
            return null;
        }
        
        // Get the data map and convert it to the appropriate payload type
        Object dataObj = resultMap.get("data");
        ResultPayload payload;
        if (dataObj instanceof Map) {
            payload = objectMapper.convertValue(dataObj, payloadClass);
        } else if (dataObj == null) {
            payload = null;
        } else {
            log.warn("Unexpected data type in result: {}", dataObj.getClass());
            return null;
        }
        
        // Build the envelope
        ResultEnvelope<ResultPayload> envelope = new ResultEnvelope<>();
        envelope.setTaskId((String) resultMap.get("taskId"));
        envelope.setType(taskType);
        envelope.setStatus((String) resultMap.get("status"));
        envelope.setData(payload);
        
        // Handle timestamp - it may be a String or already a LocalDateTime
        Object timestamp = resultMap.get("timestamp");
        if (timestamp instanceof String) {
            // Let Jackson handle ISO-8601 parsing
            try {
                envelope.setTimestamp(
                    objectMapper.readValue("\"" + timestamp + "\"", 
                    java.time.LocalDateTime.class)
                );
            } catch (Exception e) {
                log.debug("Failed to parse timestamp: {}", timestamp, e);
            }
        }
        
        return envelope;
    }
    
    /**
     * Get the appropriate payload class for a task type.
     * 
     * @param taskType The task type
     * @return The payload class, or null if not found
     */
    private Class<? extends ResultPayload> getPayloadClass(TaskType taskType) {
        switch (taskType) {
            case HSI_LOAD:
                return HsiLoadResult.class;
            case HSI_INFERENCE:
                return HsiInferenceResult.class;
            case GT_LOAD:
                return GtLoadResult.class;
            case HSI_PCA:
                return HsiPcaResult.class;
            default:
                return null;
        }
    }

    /**
     * Stop the listener (for shutdown).
     */
    public void stop() {
        if (running.compareAndSet(true, false)) {
            executorService.shutdown();
            try {
                if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                    executorService.shutdownNow();
                }
            } catch (InterruptedException e) {
                executorService.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Check if the listener is running.
     * 
     * @return true if running
     */
    public boolean isRunning() {
        return running.get();
    }
}