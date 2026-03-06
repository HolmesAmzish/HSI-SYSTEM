"""
Handler for GT_LOAD task type.
Processes GT MAT files and converts them to binary format for Spring/React consumption.
"""

import logging
import scipy.io as io
import numpy as np
import h5py
from pathlib import Path
from typing import Optional

from config.settings import settings
from models.result import GtLoadResult
from models.task import GtLoadPayload


logger = logging.getLogger(__name__)


class GtLoadHandler:
    """
    Handler for loading GT MAT files and converting to binary format.
    
    This handler processes ground truth MAT files, converts them to
    raw binary format (float32), and returns metadata for database storage.
    
    The binary format is optimized for:
    - Spring Boot backend access via memory-mapped files
    - Frontend React visualization via direct binary streaming
    """

    def handle(self, task_id: str, payload: GtLoadPayload, output_dir: Optional[Path] = None) -> GtLoadResult:
        """
        Process a GT load task.
        
        Args:
            task_id: Unique task identifier
            payload: Task payload containing gtId, hsiId, and filePath
            output_dir: Optional directory for output binary files (uses default if not provided)
            
        Returns:
            GtLoadResult with gtId, hsiId, height, width, binaryPath, numClasses, fileSize
            
        Raises:
            ValueError: If MAT file is invalid or cannot be loaded
            IOError: If binary file cannot be written
        """
        # Use default GT bin directory if not provided
        if output_dir is None:
            output_dir = settings.BIN_DIR / "gt"
        
        # Resolve file path: convert relative path to absolute path
        mat_path = self._resolve_file_path(payload.filePath)
        logger.info(f"Processing GT MAT file: {mat_path}")

        # Load MAT file and get mask data
        mask_data = self._load_mat_file(mat_path)

        # Get dimensions and num_classes
        height, width, num_classes = self._validate_and_analyze_mask(mask_data)

        # Generate binary file path
        bin_path = self._generate_bin_path(mat_path, output_dir)

        # Convert to float32 and save as binary
        self._save_as_binary(mask_data, bin_path)

        # Get file size
        file_size = bin_path.stat().st_size

        # Convert absolute path to relative path for Java to resolve
        binary_relative_path = self._to_relative_path(bin_path)

        logger.info(
            f"GT mask loaded: {height}x{width}, "
            f"num_classes: {num_classes}, "
            f"binary saved to {bin_path} ({file_size} bytes)"
        )

        return GtLoadResult(
            gtId=payload.gtId,
            hsiId=payload.hsiId,
            height=height,
            width=width,
            binaryPath=str(binary_relative_path),
            numClasses=num_classes,
            fileSize=file_size,
        )

    def _resolve_file_path(self, file_path: str) -> Path:
        """
        Resolve file path to absolute path.
        
        If the path is relative, it is resolved against SHARED_DATA_DIR.
        If the path is already absolute, it is used as-is.
        
        Args:
            file_path: File path to resolve
            
        Returns:
            Absolute Path object
        """
        path = Path(file_path)
        
        if path.is_absolute():
            logger.debug(f"File path is already absolute: {path}")
            return path
        
        # Resolve relative path against SHARED_DATA_DIR
        resolved_path = settings.SHARED_DATA_DIR / file_path
        logger.debug(f"Resolved relative path '{file_path}' to '{resolved_path}'")
        return resolved_path

    def _to_relative_path(self, file_path: Path) -> str:
        """
        Convert absolute path to relative path against SHARED_DATA_DIR.
        
        If the path is already relative, it is returned as-is.
        Uses forward slashes for cross-platform compatibility.
        
        Args:
            file_path: File path to convert
            
        Returns:
            Relative path string with forward slashes
        """
        try:
            # Try to compute relative path against SHARED_DATA_DIR
            relative = file_path.relative_to(settings.SHARED_DATA_DIR)
            # Convert to string with forward slashes for cross-platform compatibility
            relative_str = relative.as_posix()
            logger.debug(f"Converted absolute path '{file_path}' to relative '{relative_str}'")
            return relative_str
        except ValueError:
            # Path is not under SHARED_DATA_DIR, return as-is
            logger.warning(f"Path '{file_path}' is not under SHARED_DATA_DIR, returning as-is")
            return file_path.as_posix()

    def _load_mat_file(self, file_path: Path) -> np.ndarray:
        """
        Load MAT file and extract ground truth mask data.
        
        Handles both v5/v7 (standard) and v7.3 (HDF5-based) MAT file formats.
        
        Args:
            file_path: Path to MAT file
            
        Returns:
            Numpy array containing mask data
            
        Raises:
            ValueError: If file cannot be loaded or contains no valid data
        """
        try:
            # Try standard v5/v7 format first
            logger.debug(f"Loading MAT file (v5/v7 format): {file_path}")
            data = io.loadmat(file_path)

            # Filter out MATLAB internal variables
            valid_keys = [k for k in data.keys() if not k.startswith("__")]
            if not valid_keys:
                raise ValueError("MAT file contains no valid data variables")

            # Use first valid variable as mask data
            mask_key = valid_keys[0]
            mask_data = np.asarray(data[mask_key])

            logger.debug(f"Loaded mask from key '{mask_key}' with shape {mask_data.shape}")
            return mask_data

        except NotImplementedError:
            # Handle v7.3 format (HDF5-based)
            logger.debug(f"Loading MAT file (v7.3/HDF5 format): {file_path}")
            with h5py.File(file_path, "r") as f:
                valid_keys = [k for k in f.keys() if not k.startswith("#")]
                if not valid_keys:
                    raise ValueError("HDF5 MAT file contains no valid data variables")

                mask_key = valid_keys[0]
                mask_data = np.array(f[mask_key])
                
                # HDF5 uses (channels, width, height) order, transpose if needed
                if len(mask_data.shape) == 3:
                    mask_data = mask_data.transpose(2, 1, 0)

                logger.debug(f"Loaded HDF5 mask from key '{mask_key}' with shape {mask_data.shape}")
                return mask_data

        except Exception as e:
            raise ValueError(f"Failed to load MAT file: {str(e)}")

    def _validate_and_analyze_mask(self, mask: np.ndarray) -> tuple[int, int, int]:
        """
        Validate mask shape and count number of unique classes.
        
        Args:
            mask: Numpy array containing ground truth mask
            
        Returns:
            Tuple of (height, width, num_classes)
            
        Raises:
            ValueError: If mask shape is unsupported
        """
        if len(mask.shape) == 2:
            height, width = mask.shape
        elif len(mask.shape) == 3:
            # 3D data: assume (height, width, 1) or (1, height, width)
            if mask.shape[2] == 1:
                height, width = mask.shape[0], mask.shape[1]
                mask = mask[:, :, 0]
            elif mask.shape[0] == 1:
                height, width = mask.shape[1], mask.shape[2]
                mask = mask[0]
            else:
                raise ValueError(f"Unsupported 3D mask shape: {mask.shape}")
        else:
            raise ValueError(f"Unsupported mask shape: {mask.shape}")

        # Validate dimensions are positive
        if height <= 0 or width <= 0:
            raise ValueError(f"Invalid dimensions: {height}x{width}")

        # Count unique classes (excluding 0 if it's background)
        unique_classes = np.unique(mask)
        num_classes = len(unique_classes)

        logger.debug(f"Mask dimensions: {height}x{width}, unique classes: {unique_classes}")

        return height, width, num_classes

    def _generate_bin_path(self, mat_path: Path, output_dir: Path) -> Path:
        """
        Generate binary file path based on MAT file name.
        
        Args:
            mat_path: Path to source MAT file
            output_dir: Directory for output files
            
        Returns:
            Path to binary output file
        """
        mat_stem = mat_path.stem
        output_dir.mkdir(parents=True, exist_ok=True)
        return output_dir / f"{mat_stem}.bin"

    def _save_as_binary(self, mask: np.ndarray, bin_path: Path) -> None:
        """
        Save mask data as raw binary file.
        
        Data is converted to float32 and saved in C-order (row-major)
        for compatibility with Spring Boot and React.
        
        Args:
            mask: Numpy array containing ground truth mask
            bin_path: Path to output binary file
            
        Raises:
            IOError: If file cannot be written
        """
        # Ensure float32 for consistent precision
        mask_float32 = mask.astype("float32", order="C")

        try:
            with open(bin_path, "wb") as f:
                f.write(mask_float32.tobytes())
            logger.debug(f"Binary file saved: {bin_path}")
        except IOError as e:
            raise IOError(f"Failed to write binary file {bin_path}: {e}")