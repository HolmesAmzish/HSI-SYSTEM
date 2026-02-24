import os
from pathlib import Path

SHARED_DIR = Path("C:\Development\repositories\HSI-SYSTEM\SharedData")

UPLOAD_DIR = SHARED_DIR / "uploads"
OUTPUT_DIR = SHARED_DIR / "outputs"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

RABBITMQ_HOST = 'localhost'
TASK_QUEUE = 'hsi_task_queue'
RESULT_QUEUE = 'hsi_result_queue'

DTYPE_OUT = "float32"