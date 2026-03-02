"""
Simple test for HSI_LOAD handler.
Loads an HSI MAT file and converts it to binary format.
"""

import logging
from pathlib import Path

from handlers.hsi_load_handler import HsiLoadHandler
from models.task import HsiLoadPayload


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_hsi_load(mat_path: str, output_dir: str = None):
    """
    Test HSI load handler with a MAT file.
    
    Args:
        mat_path: Path to the HSI MAT file
        output_dir: Output directory for binary file (default: ./outputs/hsi)
    """
    handler = HsiLoadHandler()
    
    # Create payload
    payload = HsiLoadPayload(filePath=mat_path)
    
    # Set output directory
    if output_dir is None:
        output_dir = "./outputs/hsi"
    output_path = Path(output_dir)
    
    # Process
    result = handler.handle(task_id="test-hsi-001", payload=payload, output_dir=output_path)
    
    logger.info("=" * 50)
    logger.info("HSI Load Result:")
    logger.info(f"  Height: {result.height}")
    logger.info(f"  Width: {result.width}")
    logger.info(f"  Bands: {result.bands}")
    logger.info(f"  Binary Path: {result.binaryPath}")
    logger.info(f"  File Size: {result.fileSize} bytes")
    logger.info("=" * 50)
    
    return result


if __name__ == "__main__":
    # import argparse
    #
    # parser = argparse.ArgumentParser(description="Test HSI Load Handler")
    # parser.add_argument(
    #     "--mat",
    #     type=str,
    #     required=True,
    #     help="Path to HSI MAT file"
    # )
    # parser.add_argument(
    #     "--output",
    #     type=str,
    #     default="./outputs/hsi",
    #     help="Output directory for binary file"
    # )
    #
    # args = parser.parse_args()
    mat_path: str = r"C:\Development\repositories\HSI-SYSTEM\SharedData\mat\hsi\Dioni.mat"
    output_path: str = r"C:\Development\repositories\HSI-SYSTEM\SharedData\bin\hsi"
    test_hsi_load(mat_path, output_path)