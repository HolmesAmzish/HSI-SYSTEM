package cn.arorms.hsi.server.dtos

import cn.arorms.hsi.server.enums.TaskType
import java.time.LocalDateTime
import java.util.UUID

data class TaskEnvelope<out T : TaskPayload>(
    val taskId: String = UUID.randomUUID().toString(),
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val type: TaskType,
    val data: T,
)
