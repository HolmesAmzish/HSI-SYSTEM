"""
Task models for Redis MQ communication.
These Pydantic models mirror the Kotlin DTOs in the Server project.
"""

from enum import Enum
from typing import Optional, Union, Literal
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class TaskType(str, Enum):
    """
    Enumeration of task types matching Server's TaskType.kt.
    Each type has its own request queue.
    """
    HSI_LOAD = "HSI_LOAD"
    HSI_INFERENCE = "HSI_INFERENCE"
    GT_LOAD = "GT_LOAD"
    HSI_PCA = "HSI_PCA"


class TaskPayload(BaseModel):
    """
    Base class for all task payloads.
    Mirrors Kotlin's sealed class TaskPayload.
    """
    model_config = ConfigDict(extra="forbid")


class HsiLoadPayload(TaskPayload):
    """
    Payload for HSI_LOAD task type.
    Contains the file path to the HSI MAT file, HSI ID, and dataset ID.
    
    Attributes:
        hsiId: Unique identifier for the HSI dataset
        datasetId: Unique identifier for the dataset
        filePath: Path to the HSI MAT file to be processed
    """
    hsiId: int = Field(..., description="Unique identifier for the HSI dataset")
    datasetId: int = Field(..., description="Unique identifier for the dataset")
    filePath: str = Field(..., description="Path to the HSI MAT file")


class Dataset(BaseModel):
    """
    Dataset entity matching Server's Dataset.kt.
    Used in HSI_INFERENCE and GT_LOAD tasks.
    """
    id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None


class HsiInferencePayload(TaskPayload):
    """
    Payload for HSI_INFERENCE task type.
    Contains the file path, HSI ID, and model path for inference.
    
    Attributes:
        hsiId: Unique identifier for the HSI dataset
        filePath: Path to the HSI MAT file
        modelPath: Path to the trained model file (.pt)
    """
    hsiId: int = Field(..., description="Unique identifier for the HSI dataset")
    filePath: str = Field(..., description="Path to the HSI MAT file")
    modelPath: str = Field(..., description="Path to the trained model file")


class GtLoadPayload(TaskPayload):
    """
    Payload for GT_LOAD task type.
    Contains the file path, GT ID, and HSI ID.
    
    Attributes:
        gtId: Unique identifier for the ground truth
        hsiId: Unique identifier for the associated hyperspectral image
        filePath: Path to the GT MAT file
    """
    gtId: int = Field(..., description="Unique identifier for the ground truth")
    hsiId: int = Field(..., description="Unique identifier for the associated HSI")
    filePath: str = Field(..., description="Path to the GT MAT file")


class HsiPcaPayload(TaskPayload):
    """
    Payload for HSI_PCA task type.
    Contains the file path to the HSI MAT file and HSI ID.
    
    Attributes:
        hsiId: Unique identifier for the HSI dataset (used to find HSI after finishing)
        filePath: Path to the HSI MAT file
    """
    hsiId: int = Field(..., description="Unique identifier for the HSI dataset")
    filePath: str = Field(..., description="Path to the HSI MAT file")


# Union type for all task payloads
AnyTaskPayload = Union[HsiLoadPayload, HsiInferencePayload, GtLoadPayload, HsiPcaPayload]


class TaskEnvelope(BaseModel):
    """
    Envelope for task messages from Redis MQ.
    Mirrors Kotlin's TaskEnvelope class.
    
    Attributes:
        taskId: Unique identifier for the task
        timestamp: When the task was created
        type: Type of task
        data: Task-specific payload
    """
    taskId: str = Field(..., description="Unique task identifier")
    timestamp: datetime = Field(..., description="Task creation timestamp")
    type: TaskType = Field(..., description="Type of task")
    data: AnyTaskPayload = Field(..., description="Task payload")

    model_config = ConfigDict(extra="forbid")