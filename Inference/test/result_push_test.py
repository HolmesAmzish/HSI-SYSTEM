"""
Test script for pushing HSI_LOAD result to Redis result queue.
Directly inserts a pre-defined result for testing purposes.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

# Load environment variables from .env file first
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from core.dependencies import get_redis_client
from models.result import (
    ResultEnvelope,
    TaskStatus,
    HsiLoadResult,
)
from config.settings import settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_push_hsi_load_result():
    """
    Test pushing HSI_LOAD result to Redis result queue.
    Inserts a pre-defined result with taskId=7b34c7c5-7be5-4781-a6bd-6a6afa3f52bc
    """
    # Create HsiLoadResult data
    result_data = HsiLoadResult(
        height=250,
        width=1376,
        bands=176,
        binaryPath="bin/hsi/Dioni.bin",
        dataType="float32",
        fileSize=242176000
    )

    # Create ResultEnvelope
    envelope = ResultEnvelope(
        taskId="7b34c7c5-7be5-4781-a6bd-6a623a3f52bc",
        timestamp=datetime.fromisoformat("2026-03-01T22:57:08.698751"),
        type="HSI_LOAD",
        status=TaskStatus.COMPLETED,
        data=result_data
    )

    # Get Redis client
    redis_client = get_redis_client()
    result_queue = settings.REDIS_QUEUE_RESULT

    # Serialize to JSON and push to result queue
    envelope_dict = envelope.model_dump(mode="json")
    json_data = json.dumps(envelope_dict)

    logger.info("=" * 50)
    logger.info("Pushing HSI_LOAD result to Redis:")
    logger.info(f"  Queue: {result_queue}")
    logger.info(f"  Task ID: {envelope.taskId}")
    logger.info(f"  Timestamp: {envelope.timestamp}")
    logger.info(f"  Type: {envelope.type}")
    logger.info(f"  Status: {envelope.status}")
    logger.info(f"  Data: {envelope_dict['data']}")
    logger.info("=" * 50)

    # Push to Redis
    redis_client.lpush(result_queue, json_data)

    logger.info(f"Successfully pushed result to {result_queue}")

    return envelope


if __name__ == "__main__":
    test_push_hsi_load_result()