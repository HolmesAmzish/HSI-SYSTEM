"""
Result models for Redis MQ communication.
These Pydantic models mirror the Kotlin DTOs in the Server project.
All task results are sent to a single shared queue.
"""

from enum import Enum
from typing import Optional, Union, Dict
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class TaskStatus(str, Enum):
    """
    Task execution status.
    Matches Server's ProcessStatus with simplified naming.
    """
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TaskResult(BaseModel):
    """
    Base class for all task result payloads.
    Mirrors Kotlin's sealed class TaskResult.
    """
    model_config = ConfigDict(extra="forbid")


class HsiLoadResult(TaskResult):
    """
    Result payload for HSI_LOAD task type.
    Contains metadata about the loaded hyperspectral image cube.
    
    Attributes:
        hsiId: Unique identifier for the HSI dataset (echoed from request)
        datasetId: Unique identifier for the dataset (echoed from request)
        height: Height of the hyperspectral cube (pixels)
        width: Width of the hyperspectral cube (pixels)
        bands: Number of spectral bands
        binaryPath: Path to the generated binary file
        dataType: Data type of the binary file (default: "float32")
        fileSize: Size of the binary file in bytes
    """
    hsiId: int = Field(..., description="Unique identifier for the HSI dataset")
    datasetId: int = Field(..., description="Unique identifier for the dataset")
    height: int = Field(..., description="Height of the hyperspectral cube")
    width: int = Field(..., description="Width of the hyperspectral cube")
    bands: int = Field(..., description="Number of spectral bands")
    binaryPath: str = Field(..., description="Path to the generated binary file")
    dataType: str = Field(default="float32", description="Data type of the binary file")
    fileSize: int = Field(..., description="Size of the binary file in bytes")


class HsiInferenceResult(TaskResult):
    """
    Result payload for HSI_INFERENCE task type.
    Contains inference results and predictions.
    
    Attributes:
        height: Height of the processed area
        width: Width of the processed area
        classificationMap: Path to classification map file
        confidenceMap: Path to confidence map file (optional)
        metrics: Optional performance metrics
    """
    height: int = Field(..., description="Height of the processed area")
    width: int = Field(..., description="Width of the processed area")
    classificationMap: str = Field(..., description="Path to classification map file")
    confidenceMap: Optional[str] = Field(default=None, description="Path to confidence map file")
    metrics: Optional[Dict[str, float]] = Field(default=None, description="Performance metrics")


class GtLoadResult(TaskResult):
    """
    Result payload for GT_LOAD task type.
    Contains ground truth mask information.
    
    Attributes:
        height: Height of the ground truth mask
        width: Width of the ground truth mask
        numClasses: Number of distinct classes in ground truth
        maskPath: Path to the generated binary mask file
        classLabels: Map of class IDs to label names (optional)
    """
    height: int = Field(..., description="Height of the ground truth mask")
    width: int = Field(..., description="Width of the ground truth mask")
    numClasses: int = Field(..., description="Number of distinct classes")
    maskPath: str = Field(..., description="Path to the generated binary mask file")
    classLabels: Optional[Dict[int, str]] = Field(default=None, description="Class ID to label mapping")


class ErrorResult(TaskResult):
    """
    Result payload for failed tasks.
    Contains error information for debugging.
    
    Attributes:
        errorCode: Application-specific error code
        errorMessage: Human-readable error message
        stackTrace: Optional stack trace for debugging
    """
    errorCode: str = Field(..., description="Application-specific error code")
    errorMessage: str = Field(..., description="Human-readable error message")
    stackTrace: Optional[str] = Field(default=None, description="Stack trace for debugging")


# Union type for all result payloads
AnyTaskResult = Union[HsiLoadResult, HsiInferenceResult, GtLoadResult, ErrorResult]


class ResultEnvelope(BaseModel):
    """
    Envelope for task results sent to Redis MQ.
    Mirrors Kotlin's ResultEnvelope class.
    
    All task results are sent to a single shared queue:
    hsi:queue:task-result
    
    Attributes:
        taskId: Unique identifier of the completed task
        timestamp: When the result was generated
        type: Type of task that was processed
        status: Execution status (COMPLETED or FAILED)
        data: Task-specific result payload
    """
    taskId: str = Field(..., description="Unique task identifier")
    timestamp: datetime = Field(..., description="Result generation timestamp")
    type: str = Field(..., description="Type of task (HSI_LOAD, HSI_INFERENCE, GT_LOAD)")
    status: TaskStatus = Field(..., description="Execution status")
    data: AnyTaskResult = Field(..., description="Task result payload")

    model_config = ConfigDict(extra="forbid")
