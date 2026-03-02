"""
Simple test for GT_LOAD handler.
Loads a GT MAT file and converts it to binary format.
"""

import logging
from pathlib import Path

from handlers.gt_load_handler import GtLoadHandler
from models.task import GtLoadPayload, Dataset


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_gt_load(mat_path: str, output_dir: str = None):
    """
    Test GT load handler with a MAT file.
    
    Args:
        mat_path: Path to the GT MAT file
        output_dir: Output directory for binary file (default: ./outputs/gt)
    """
    handler = GtLoadHandler()
    
    # Create payload
    payload = GtLoadPayload(
        filePath=mat_path,
        dataset=Dataset(id=1, name="test_dataset")
    )
    
    # Set output directory
    if output_dir is None:
        output_dir = "./outputs/gt"
    output_path = Path(output_dir)
    
    # Process
    result = handler.handle(task_id="test-gt-001", payload=payload, output_dir=output_path)
    
    logger.info("=" * 50)
    logger.info("GT Load Result:")
    logger.info(f"  Height: {result.height}")
    logger.info(f"  Width: {result.width}")
    logger.info(f"  Num Classes: {result.numClasses}")
    logger.info(f"  Mask Path: {result.maskPath}")
    logger.info("=" * 50)
    
    return result


if __name__ == "__main__":
    # import argparse
    
    # parser = argparse.ArgumentParser(description="Test GT Load Handler")
    # parser.add_argument(
    #     "--mat",
    #     type=str,
    #     required=True,
    #     help="Path to GT MAT file"
    # )
    # parser.add_argument(
    #     "--output",
    #     type=str,
    #     default="./outputs/gt",
    #     help="Output directory for binary file"
    # )
    
    # args = parser.parse_args()

    mat_path: str = r"C:\Development\repositories\HSI-SYSTEM\SharedData\mat\gt\Dioni_gt_out68.mat"
    output_path: str = r"C:\Development\repositories\HSI-SYSTEM\SharedData\bin\gt"

    test_gt_load(mat_path, output_path)