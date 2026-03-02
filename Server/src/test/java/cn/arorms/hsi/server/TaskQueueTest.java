package cn.arorms.hsi.server;

import cn.arorms.hsi.server.entities.Dataset;
import cn.arorms.hsi.server.enums.TaskType;
import cn.arorms.hsi.server.services.mq.TaskQueueSender;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class TaskQueueTest {

    @Autowired
    private TaskQueueSender taskQueueSender;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    void insertTaskTest() {
        // Clear all exsiting data in queue
//        redisTemplate.delete(List.of(
//                TaskType.HSI_LOAD.getQueueKey(),
//                TaskType.HSI_INFERENCE.getQueueKey(),
//                TaskType.GT_LOAD.getQueueKey()
//        ));

        // HSI_LOAD
        String loadId = taskQueueSender.sendHsiLoadTask(123L, "/path/to/hsi.mat");
        assertNotNull(loadId);

        // HSI_INFERENCE
        Dataset mockDataset = new Dataset();
        String infId = taskQueueSender.sendHsiInferenceTask(123L, "/path/to/hsi.mat", mockDataset);
        assertNotNull(infId);

        // GT_LOAD
        String gtId = taskQueueSender.sendGtLoadTask(123L, "/path/to/gt.mat", mockDataset);
        assertNotNull(gtId);

        // Check Redis queue(list) length
        assertEquals(1, redisTemplate.opsForList().size(TaskType.HSI_LOAD.getQueueKey()));
        assertEquals(1, redisTemplate.opsForList().size(TaskType.HSI_INFERENCE.getQueueKey()));
        assertEquals(1, redisTemplate.opsForList().size(TaskType.GT_LOAD.getQueueKey()));

        System.out.println("Tests passed: All tasks routed to their respective queues.");
    }

    @Test
    void countTaskTest() {
        Long taskCount = taskQueueSender.getTotalPendingTaskCount();
        assertEquals(3, taskCount);
        System.out.println("Tests passed: The number is ok");
    }
}
