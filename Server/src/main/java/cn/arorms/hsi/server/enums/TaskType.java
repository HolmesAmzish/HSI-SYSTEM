package cn.arorms.hsi.server.enums;

/**
 * Enumeration of task types with their associated Redis queue keys.
 * Each task type has a request queue (for sending tasks to Python workers).
 * All task results are sent to a single shared result queue for simplicity.
 * 
 * @author Cacciatore
 * @version 1.0 2026-02-27
 */
public enum TaskType {
    HSI_LOAD("hsi:queue:hsi-load"),
    HSI_INFERENCE("hsi:queue:hsi-inference"),
    GT_LOAD("hsi:queue:gt-load");

    /**
     * Shared result queue key for all task types.
     * Using a single queue simplifies Spring's result listening logic.
     */
    public static final String RESULT_QUEUE_KEY = "hsi:queue:task-result";

    private final String queueKey;

    TaskType(String queueKey) {
        this.queueKey = queueKey;
    }

    public String getQueueKey() {
        return queueKey;
    }

    /**
     * Get the task type from a string value.
     * 
     * @param value String value to match
     * @return Matching TaskType or null if not found
     */
    public static TaskType fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (TaskType type : TaskType.values()) {
            if (type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        return null;
    }
}