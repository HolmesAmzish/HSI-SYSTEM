"""
Service for publishing task results to Redis MQ.
Handles sending results back to Spring Server via the shared result queue.
"""

import json
import logging
from datetime import datetime
from typing import Any
from redis import Redis

from models.result import (
    ResultEnvelope,
    TaskStatus,
    HsiLoadResult,
    HsiInferenceResult,
    GtLoadResult,
    ErrorResult,
)
from config.settings import settings


logger = logging.getLogger(__name__)


class ResultService:
    """
    Service for publishing task results to Redis MQ.
    
    All results are sent to a single shared queue: hsi:queue:task-result
    This simplifies Spring's result listening logic.
    """

    def __init__(self, redis_client: Redis):
        """
        Initialize the result service.
        
        Args:
            redis_client: Redis client instance for queue operations
        """
        self.redis_client = redis_client
        self.result_queue = settings.REDIS_QUEUE_RESULT

    def publish_success(
        self,
        task_id: str,
        task_type: str,
        result_data: HsiLoadResult | HsiInferenceResult | GtLoadResult,
    ) -> bool:
        """
        Publish a successful task result to the shared result queue.
        
        Args:
            task_id: Unique identifier of the completed task
            task_type: Type of task (HSI_LOAD, HSI_INFERENCE, GT_LOAD)
            result_data: Task-specific result payload
            
        Returns:
            True if result was published successfully, False otherwise
        """
        try:
            envelope = ResultEnvelope(
                taskId=task_id,
                timestamp=datetime.now(),
                type=task_type,
                status=TaskStatus.COMPLETED,
                data=result_data,
            )

            # Serialize to JSON and push to result queue
            envelope_dict = envelope.model_dump(mode="json")
            result_json = json.dumps(envelope_dict)
            self.redis_client.lpush(self.result_queue, result_json)

            logger.info(
                f"Published success result for task {task_id} ({task_type}) to {self.result_queue}"
            )
            logger.info(f"Result payload: {result_json}")
            return True

        except Exception as e:
            logger.error(f"Failed to publish success result for task {task_id}: {e}")
            return False

    def publish_failure(
        self,
        task_id: str,
        task_type: str,
        error_code: str,
        error_message: str,
        stack_trace: str | None = None,
    ) -> bool:
        """
        Publish a failed task result to the shared result queue.
        
        Args:
            task_id: Unique identifier of the failed task
            task_type: Type of task (HSI_LOAD, HSI_INFERENCE, GT_LOAD)
            error_code: Application-specific error code
            error_message: Human-readable error message
            stack_trace: Optional stack trace for debugging
            
        Returns:
            True if failure result was published successfully, False otherwise
        """
        try:
            error_result = ErrorResult(
                errorCode=error_code,
                errorMessage=error_message,
                stackTrace=stack_trace,
            )

            envelope = ResultEnvelope(
                taskId=task_id,
                timestamp=datetime.now(),
                type=task_type,
                status=TaskStatus.FAILED,
                data=error_result,
            )

            # Serialize to JSON and push to result queue
            envelope_dict = envelope.model_dump(mode="json")
            result_json = json.dumps(envelope_dict)
            self.redis_client.lpush(self.result_queue, result_json)

            logger.info(
                f"Published failure result for task {task_id} ({task_type}) to {self.result_queue}"
            )
            logger.info(f"Result payload: {result_json}")
            return True

        except Exception as e:
            logger.error(f"Failed to publish failure result for task {task_id}: {e}")
            return False


# Create singleton instance (will be initialized with Redis client in dependencies)
def create_result_service(redis_client: Redis) -> ResultService:
    """
    Factory function to create a ResultService instance.
    
    Args:
        redis_client: Redis client instance
        
    Returns:
        Configured ResultService instance
    """
    return ResultService(redis_client)