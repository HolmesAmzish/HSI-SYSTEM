"""
Main entry point for HSI Inference Worker.
Listens to Redis MQ task queues and processes tasks.

This worker listens to three task queues:
- hsi:queue:hsi-load: For loading HSI MAT files
- hsi:queue:hsi-inference: For HSI inference tasks
- hsi:queue:gt-load: For loading ground truth MAT files

All results are published to a single shared queue:
- hsi:queue:task-result
"""

import logging
import json
import signal
import sys
from datetime import datetime
from pathlib import Path
from redis import Redis
from typing import Optional

from config.settings import settings
from core.dependencies import get_redis_client
from models.task import TaskEnvelope, TaskType, HsiLoadPayload, GtLoadPayload, HsiPcaPayload
from models.result import HsiLoadResult, GtLoadResult, HsiPcaResult
from handlers.hsi_load_handler import HsiLoadHandler
from handlers.gt_load_handler import GtLoadHandler
from handlers.hsi_pca_handler import HsiPcaHandler
from service.result_service import ResultService


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class TaskWorker:
    """
    Main worker class that listens to Redis task queues and processes tasks.
    
    The worker uses blocking list operations (BLPOP) to efficiently wait for
    new tasks while supporting graceful shutdown.
    """

    def __init__(self):
        """Initialize the task worker with Redis connection and handlers."""
        self.redis_client: Redis = get_redis_client()
        self.result_service = ResultService(self.redis_client)
        self.hsi_load_handler = HsiLoadHandler()
        self.gt_load_handler = GtLoadHandler()
        self.hsi_pca_handler = HsiPcaHandler()
        
        # Task queue names
        self.task_queues = [
            settings.REDIS_QUEUE_HSI_LOAD,
            settings.REDIS_QUEUE_HSI_INFERENCE,
            settings.REDIS_QUEUE_GT_LOAD,
            settings.REDIS_QUEUE_HSI_PCA,
        ]
        
        # Output directory for binary files
        self.output_dir = settings.BIN_DIR / "hsi"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Shutdown flag
        self._shutdown_requested = False

    def start(self) -> None:
        """
        Start the task worker loop.
        
        Uses BLPOP to blockingly wait for tasks from any of the task queues.
        Processes tasks until shutdown is requested.
        """
        logger.info("Starting HSI Inference Worker...")
        logger.info(f"Listening to task queues: {self.task_queues}")
        logger.info(f"Publishing results to: {settings.REDIS_QUEUE_RESULT}")
        logger.info(f"Output directory: {self.output_dir}")

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._request_shutdown)
        signal.signal(signal.SIGTERM, self._request_shutdown)

        while not self._shutdown_requested:
            try:
                # Block waiting for task from any queue (timeout for shutdown check)
                result = self.redis_client.blpop(self.task_queues, timeout=1)
                
                if result is None:
                    # Timeout, check shutdown flag and continue
                    continue

                queue_name = result[0]
                message_data = result[1]
                
                # Decode message if bytes
                if isinstance(message_data, bytes):
                    message_data = message_data.decode("utf-8")

                logger.info(f"Received task from queue: {queue_name}")
                
                # Process the task
                self._process_task(message_data, queue_name)

            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)

        logger.info("Worker shutdown complete.")

    def _request_shutdown(self, signum, frame) -> None:
        """Handle shutdown signal."""
        logger.info("Shutdown requested, finishing current task...")
        self._shutdown_requested = True

    def _process_task(self, message_data: str, queue_name: str) -> None:
        """
        Process a task message from the queue.
        
        Args:
            message_data: JSON-encoded task envelope
            queue_name: Name of the queue the message came from
        """
        try:
            # Parse task envelope
            envelope_dict = json.loads(message_data)
            task_envelope = self._parse_envelope(envelope_dict)
            
            task_id = task_envelope.taskId
            task_type = task_envelope.type
            
            logger.info(f"Processing task {task_id} of type {task_type.value}")

            # Route to appropriate handler based on task type
            if task_type == TaskType.HSI_LOAD:
                self._handle_hsi_load(task_id, task_envelope.data)
            elif task_type == TaskType.HSI_INFERENCE:
                logger.warning(f"HSI_INFERENCE task {task_id} received but not yet implemented")
            elif task_type == TaskType.GT_LOAD:
                self._handle_gt_load(task_id, task_envelope.data)
            elif task_type == TaskType.HSI_PCA:
                self._handle_hsi_pca(task_id, task_envelope.data)
            else:
                logger.error(f"Unknown task type: {task_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse task message: {e}")
        except Exception as e:
            logger.error(f"Failed to process task: {e}", exc_info=True)

    def _parse_envelope(self, envelope_dict: dict) -> TaskEnvelope:
        """
        Parse a task envelope from dictionary.
        
        Args:
            envelope_dict: Dictionary containing task envelope data
            
        Returns:
            Parsed TaskEnvelope object
        """
        # Parse timestamp string to datetime
        timestamp_str = envelope_dict.get("timestamp")
        if isinstance(timestamp_str, str):
            # Handle ISO format timestamp
            try:
                envelope_dict["timestamp"] = datetime.fromisoformat(
                    timestamp_str.replace("Z", "+00:00")
                )
            except ValueError:
                envelope_dict["timestamp"] = datetime.now()
        
        return TaskEnvelope(**envelope_dict)

    def _handle_hsi_load(self, task_id: str, payload: HsiLoadPayload) -> None:
        """
        Handle HSI_LOAD task type.
        
        Args:
            task_id: Unique task identifier
            payload: HSI load task payload
        """
        try:
            # Process the MAT file
            result = self.hsi_load_handler.handle(
                task_id=task_id,
                payload=payload,
                output_dir=self.output_dir,
            )
            
            # Publish success result
            self.result_service.publish_success(
                task_id=task_id,
                task_type=TaskType.HSI_LOAD.value,
                result_data=result,
            )
            
        except ValueError as e:
            logger.error(f"Invalid MAT file for task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_LOAD.value,
                error_code="INVALID_MAT_FILE",
                error_message=str(e),
            )
        except IOError as e:
            logger.error(f"IO error for task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_LOAD.value,
                error_code="IO_ERROR",
                error_message=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error for task {task_id}: {e}", exc_info=True)
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_LOAD.value,
                error_code="INTERNAL_ERROR",
                error_message=f"Unexpected error: {str(e)}",
                stack_trace=str(e),
            )

    def _handle_gt_load(self, task_id: str, payload: GtLoadPayload) -> None:
        """
        Handle GT_LOAD task type.
        
        Args:
            task_id: Unique task identifier
            payload: GT load task payload
        """
        try:
            # Process the GT MAT file
            result = self.gt_load_handler.handle(
                task_id=task_id,
                payload=payload,
            )
            
            # Publish success result
            self.result_service.publish_success(
                task_id=task_id,
                task_type=TaskType.GT_LOAD.value,
                result_data=result,
            )
            
        except ValueError as e:
            logger.error(f"Invalid GT MAT file for task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.GT_LOAD.value,
                error_code="INVALID_MAT_FILE",
                error_message=str(e),
            )
        except IOError as e:
            logger.error(f"Database error for task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.GT_LOAD.value,
                error_code="DATABASE_ERROR",
                error_message=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error for task {task_id}: {e}", exc_info=True)
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.GT_LOAD.value,
                error_code="INTERNAL_ERROR",
                error_message=f"Unexpected error: {str(e)}",
                stack_trace=str(e),
            )

    def _handle_hsi_pca(self, task_id: str, payload: HsiPcaPayload) -> None:
        """
        Handle HSI_PCA task type.
        
        Args:
            task_id: Unique task identifier
            payload: HSI PCA task payload
        """
        try:
            # Process the HSI MAT file with PCA
            result = self.hsi_pca_handler.handle(
                task_id=task_id,
                payload=payload,
                output_dir=self.output_dir,
            )
            
            # Publish success result
            self.result_service.publish_success(
                task_id=task_id,
                task_type=TaskType.HSI_PCA.value,
                result_data=result,
            )
            
        except ValueError as e:
            logger.error(f"Invalid HSI MAT file for PCA task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_PCA.value,
                error_code="INVALID_MAT_FILE",
                error_message=str(e),
            )
        except IOError as e:
            logger.error(f"IO error for PCA task {task_id}: {e}")
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_PCA.value,
                error_code="IO_ERROR",
                error_message=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error for PCA task {task_id}: {e}", exc_info=True)
            self.result_service.publish_failure(
                task_id=task_id,
                task_type=TaskType.HSI_PCA.value,
                error_code="INTERNAL_ERROR",
                error_message=f"Unexpected error: {str(e)}",
                stack_trace=str(e),
            )


def main():
    """Main entry point."""
    worker = TaskWorker()
    worker.start()


if __name__ == "__main__":
    main()