"""
Handler for HSI_LOAD task type.
Processes MAT files and converts them to binary format for Spring/React consumption.
"""

import logging
import scipy.io as io
import numpy as np
import h5py
from pathlib import Path
from typing import Any

from config.settings import settings
from models.result import HsiLoadResult
from models.task import HsiLoadPayload


logger = logging.getLogger(__name__)


class HsiLoadHandler:
    """
    Handler for loading HSI MAT files and converting to binary format.
    
    This handler processes hyperspectral image MAT files, converts them to
    raw binary format (float32), and returns metadata for database storage.
    
    The binary format is optimized for:
    - Spring Boot backend access via memory-mapped files
    - Frontend React visualization via direct binary streaming
    """

    def handle(self, task_id: str, payload: HsiLoadPayload, output_dir: Path) -> HsiLoadResult:
        """
        Process an HSI load task.
        
        Args:
            task_id: Unique task identifier
            payload: Task payload containing file path
            output_dir: Directory for output binary files
            
        Returns:
            HsiLoadResult with metadata and binary file path
            
        Raises:
            ValueError: If MAT file is invalid or cannot be loaded
            IOError: If binary file cannot be written
        """
        # Resolve file path: convert relative path to absolute path
        mat_path = self._resolve_file_path(payload.filePath)
        logger.info(f"Processing HSI MAT file: {mat_path}")

        # Load MAT file and get cube data
        cube = self._load_mat_file(mat_path)

        # Get dimensions and validate shape
        height, width, bands = self._validate_cube_shape(cube)

        # Generate binary file path
        bin_path = self._generate_bin_path(mat_path, output_dir)

        # Convert to float32 and save as binary
        self._save_as_binary(cube, bin_path)

        # Get file size
        file_size = bin_path.stat().st_size

        # Convert absolute path to relative path for Java to resolve
        binary_relative_path = self._to_relative_path(bin_path)

        logger.info(
            f"HSI cube loaded: {height}x{width}x{bands}, "
            f"binary saved to {bin_path} ({file_size} bytes)"
        )

        return HsiLoadResult(
            hsiId=payload.hsiId,
            datasetId=payload.datasetId,
            height=height,
            width=width,
            bands=bands,
            binaryPath=str(binary_relative_path),
            dataType="float32",
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
        Load MAT file and extract cube data.
        
        Handles both v5/v7 (standard) and v7.3 (HDF5-based) MAT file formats.
        
        Args:
            file_path: Path to MAT file
            
        Returns:
            Numpy array containing hyperspectral cube data
            
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

            # Use first valid variable as cube data
            cube_key = valid_keys[0]
            cube_data = np.asarray(data[cube_key])

            logger.debug(f"Loaded cube from key '{cube_key}' with shape {cube_data.shape}")
            return cube_data

        except NotImplementedError:
            # Handle v7.3 format (HDF5-based)
            logger.debug(f"Loading MAT file (v7.3/HDF5 format): {file_path}")
            with h5py.File(file_path, "r") as f:
                valid_keys = [k for k in f.keys() if not k.startswith("#")]
                if not valid_keys:
                    raise ValueError("HDF5 MAT file contains no valid data variables")

                cube_key = valid_keys[0]
                # Transpose from (channels, width, height) to (height, width, channels)
                cube_data = np.array(f[cube_key]).transpose(2, 1, 0)

                logger.debug(f"Loaded HDF5 cube from key '{cube_key}' with shape {cube_data.shape}")
                return cube_data

        except Exception as e:
            raise ValueError(f"Failed to load MAT file: {str(e)}")

    def _validate_cube_shape(self, cube: np.ndarray) -> tuple[int, int, int]:
        """
        Validate and normalize cube shape.
        
        Args:
            cube: Numpy array containing hyperspectral data
            
        Returns:
            Tuple of (height, width, bands)
            
        Raises:
            ValueError: If cube shape is unsupported
        """
        if len(cube.shape) == 3:
            height, width, bands = cube.shape
        elif len(cube.shape) == 2:
            # 2D data treated as single-band
            height, width = cube.shape
            bands = 1
            logger.warning(f"2D data detected, treating as single-band: {height}x{width}")
        else:
            raise ValueError(f"Unsupported data shape: {cube.shape}. Expected 2D or 3D array.")

        # Validate dimensions are positive
        if height <= 0 or width <= 0 or bands <= 0:
            raise ValueError(f"Invalid dimensions: {height}x{width}x{bands}")

        return height, width, bands

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

    def _save_as_binary(self, cube: np.ndarray, bin_path: Path) -> None:
        """
        Save cube data as raw binary file.
        
        Data is converted to float32 and saved in C-order (row-major)
        for compatibility with Spring Boot and React.
        
        Args:
            cube: Numpy array containing hyperspectral data
            bin_path: Path to output binary file
            
        Raises:
            IOError: If file cannot be written
        """
        # Ensure float32 for consistent precision
        cube_float32 = cube.astype("float32", order="C")

        try:
            with open(bin_path, "wb") as f:
                f.write(cube_float32.tobytes())
            logger.debug(f"Binary file saved: {bin_path}")
        except IOError as e:
            raise IOError(f"Failed to write binary file {bin_path}: {e}")