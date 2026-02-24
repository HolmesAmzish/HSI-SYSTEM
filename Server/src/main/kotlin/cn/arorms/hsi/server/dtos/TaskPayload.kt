package cn.arorms.hsi.server.dtos

import cn.arorms.hsi.server.entities.Dataset

sealed class TaskPayload

data class HsiLoad(
    // HSI MAT file path
    val filePath: String,
) : TaskPayload()

data class HsiInference(
    // HSI MAT file path
    val filePath: String,
    val dataset: Dataset
) : TaskPayload()

data class GtLoad(
    // GT MAT file path
    val filePath: String,
    val dataset: Dataset
) : TaskPayload()