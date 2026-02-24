package cn.arorms.hsi.server;

import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.services.TaskQueueService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class TaskQueueServiceTest {

    @Autowired
    private TaskQueueService taskQueueService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String QUEUE_LOAD = "hsi:queue:load";
    private static final String QUEUE_INFERENCE = "hsi:queue:inference";
    private static final String QUEUE_GT = "hsi:queue:gt";

    @Test
    void insertTaskTest() {
        // Clear all exsiting data in queue
        redisTemplate.delete(List.of(QUEUE_LOAD, QUEUE_INFERENCE, QUEUE_GT));

        // HSI_LOAD
        String loadId = taskQueueService.sendHsiLoadTask("/path/to/hsi.mat");
        assertNotNull(loadId);

        // HSI_INFERENCE
        Dataset mockDataset = new Dataset();
        String infId = taskQueueService.sendHsiInferenceTask("/path/to/hsi.mat", mockDataset);
        assertNotNull(infId);

        // GT_LOAD
        String gtId = taskQueueService.sendGtLoadTask("/path/to/gt.mat", mockDataset);
        assertNotNull(gtId);

        // Check Redis queue(list) length
        assertEquals(1, redisTemplate.opsForList().size(QUEUE_LOAD));
        assertEquals(1, redisTemplate.opsForList().size(QUEUE_INFERENCE));
        assertEquals(1, redisTemplate.opsForList().size(QUEUE_GT));

        System.out.println("Tests passed: All tasks routed to their respective queues.");
    }

    @Test
    void countTaskTest() {
        Long taskCount = taskQueueService.getQueueSize();
        assertEquals(3, taskCount);
        System.out.println("Tests passed: The number is ok");
    }
}