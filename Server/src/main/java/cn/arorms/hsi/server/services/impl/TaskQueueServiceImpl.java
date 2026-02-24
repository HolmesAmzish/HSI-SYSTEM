package cn.arorms.hsi.server.services.impl;

import cn.arorms.hsi.server.dtos.*;
import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.TaskQueueService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskQueueServiceImpl implements TaskQueueService {

    private final RedisTemplate<String, Object> redisTemplate;

    // set keys for different queue
    private static final String QUEUE_HSI_LOAD = "hsi:queue:load";
    private static final String QUEUE_HSI_INFERENCE = "hsi:queue:inference";
    private static final String QUEUE_GT_LOAD = "hsi:queue:gt";

    public TaskQueueServiceImpl(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // global method to send task
    @Override
    public <T extends TaskPayload> String sendTask(TaskType type, T data) {
        TaskEnvelope<T> envelope = new TaskEnvelope<>(
                UUID.randomUUID().toString(),
                LocalDateTime.now(),
                type,
                data
        );

        String targetQueue = route(type);
        redisTemplate.opsForList().leftPush(targetQueue, envelope);

        return envelope.getTaskId();
    }

    private String route(TaskType type) {
        return switch (type) {
            case HSI_LOAD -> QUEUE_HSI_LOAD;
            case HSI_INFERENCE -> QUEUE_HSI_INFERENCE;
            case GT_LOAD -> QUEUE_GT_LOAD;
            default -> throw new IllegalArgumentException("Unknown task type: " + type);
        };
    }

    @Override
    public String sendHsiLoadTask(String filePath) {
        return sendTask(TaskType.HSI_LOAD, new HsiLoad(filePath));
    }

    @Override
    public String sendHsiInferenceTask(String filePath, Dataset dataset) {
        return sendTask(TaskType.HSI_INFERENCE, new HsiInference(filePath, dataset));
    }

    @Override
    public String sendGtLoadTask(String filePath, Dataset dataset) {
        return sendTask(TaskType.GT_LOAD, new GtLoad(filePath, dataset));
    }

    @Override
    public Long getQueueSize() {
        return redisTemplate.opsForList().size(QUEUE_HSI_LOAD) +
                redisTemplate.opsForList().size(QUEUE_HSI_INFERENCE) +
                redisTemplate.opsForList().size(QUEUE_GT_LOAD);
    }

//    @Override
//    public List<String> getHsiInferencePendingTasks(int limit) {
//        List<Object> tasks = redisTemplate.opsForList().range(QUEUE_HSI_INFERENCE, 0, limit - 1);
//        if (tasks == null) return List.of();
//        return tasks.stream().map(Object::toString).collect(Collectors.toList());
//    }
}