"""
Handler for HSI_PCA task type.
Processes HSI MAT files and converts them to 3-channel RGB cubes using PCA.
"""

import logging
import scipy.io as io
import numpy as np
import h5py
from pathlib import Path
from sklearn.decomposition import PCA
from typing import Any

from config.settings import settings
from models.result import HsiPcaResult
from models.task import HsiPcaPayload


logger = logging.getLogger(__name__)


class HsiPcaHandler:
    """
    Handler for loading HSI MAT files and converting to 3-channel RGB using PCA.
    
    This handler processes hyperspectral image MAT files, applies PCA to reduce
    the spectral dimensionality to 3 components (RGB), and saves the result as
    a raw binary file (float32).
    
    The PCA transformation:
    1. Reshapes the HSI cube to (height*width, bands)
    2. Applies PCA to reduce to 3 components
    3. Reshapes back to (height, width, 3)
    4. Normalizes to [0, 1] range for visualization
    """

    def handle(self, task_id: str, payload: HsiPcaPayload, output_dir: Path) -> HsiPcaResult:
        """
        Process an HSI PCA task.
        
        Args:
            task_id: Unique task identifier
            payload: Task payload containing file path and HSI ID
            output_dir: Directory for output binary files
            
        Returns:
            HsiPcaResult with metadata and binary file path
            
        Raises:
            ValueError: If MAT file is invalid or cannot be loaded
            IOError: If binary file cannot be written
        """
        # Resolve file path: convert relative path to absolute path
        data_path = self._resolve_file_path(payload.filePath)
        logger.info(f"Processing HSI PCA task: {data_path}")

        # Load data file (MAT or BIN) and get cube data
        cube = self._load_data_file(data_path)

        # Get dimensions and validate shape
        height, width, bands = self._validate_cube_shape(cube)

        # Apply PCA to reduce to 3 channels
        rgb_cube = self._apply_pca(cube)

        # Generate binary file path
        bin_path = self._generate_bin_path(data_path, output_dir)

        # Convert to float32 and save as binary
        self._save_as_binary(rgb_cube, bin_path)

        # Convert absolute path to relative path for Java to resolve
        pca_relative_path = self._to_relative_path(bin_path)

        logger.info(
            f"HSI PCA completed: {height}x{width}x{bands} -> {height}x{width}x3, "
            f"binary saved to {bin_path}"
        )

        return HsiPcaResult(
            hsiId=payload.hsiId,
            pcaPath=str(pca_relative_path),
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

    def _load_data_file(self, file_path: Path) -> np.ndarray:
        """
        Load data file (MAT or BIN) and extract cube data.
        
        Supports:
        - MAT files (v5/v7 and v7.3 HDF5 format)
        - BIN files (raw binary data, shape inferred from corresponding MAT file)
        
        Args:
            file_path: Path to data file
            
        Returns:
            Numpy array containing hyperspectral cube data
            
        Raises:
            ValueError: If file cannot be loaded or contains no valid data
        """
        # Check if it's a bin file
        if file_path.suffix.lower() == '.bin':
            return self._load_bin_file(file_path)
        else:
            return self._load_mat_file(file_path)
    
    def _load_bin_file(self, file_path: Path) -> np.ndarray:
        """
        Load BIN file (raw binary data).
        
        The shape is inferred from the corresponding MAT file.
        
        Args:
            file_path: Path to BIN file
            
        Returns:
            Numpy array containing hyperspectral cube data
            
        Raises:
            ValueError: If file cannot be loaded or shape cannot be determined
        """
        logger.debug(f"Loading BIN file: {file_path}")
        
        # Find corresponding MAT file to get shape
        mat_path = self._find_mat_for_bin(file_path)
        
        if not mat_path or not mat_path.exists():
            raise ValueError(f"Cannot find corresponding MAT file for BIN file: {file_path}")
        
        logger.debug(f"Found corresponding MAT file: {mat_path}")
        
        # Get shape from MAT file
        shape = self._get_shape_from_mat(mat_path)
        
        if not shape:
            raise ValueError(f"Cannot read shape from MAT file: {mat_path}")
        
        height, width, bands = shape
        logger.debug(f"Shape from MAT file: {shape}")
        
        # Read binary data
        dtype = np.float32
        expected_size = height * width * bands * np.dtype(dtype).itemsize
        actual_size = file_path.stat().st_size
        
        if actual_size != expected_size:
            raise ValueError(
                f"BIN file size mismatch: expected {expected_size} bytes, "
                f"got {actual_size} bytes"
            )
        
        with open(file_path, 'rb') as f:
            raw_data = f.read()
        
        # Convert to numpy array and reshape
        cube = np.frombuffer(raw_data, dtype=dtype)
        cube = cube.reshape((height, width, bands))
        
        logger.debug(f"Loaded BIN file with shape {cube.shape}")
        return cube
    
    def _find_mat_for_bin(self, bin_path: Path) -> Path:
        """
        Find corresponding MAT file based on bin file path.
        
        Args:
            bin_path: Path to bin file
            
        Returns:
            Path to MAT file or None
        """
        # Try multiple possible MAT file locations
        possible_paths = [
            # Same directory, same name
            bin_path.with_suffix('.mat'),
            # In mat directory instead of bin
            Path(str(bin_path).replace('\\bin\\', '\\mat\\').replace('/bin/', '/mat/')).with_suffix('.mat'),
            # bin/hsi -> mat/hsi
            Path(str(bin_path).replace('\\bin\\hsi\\', '\\mat\\hsi\\').replace('/bin/hsi/', '/mat/hsi/')).with_suffix('.mat'),
            # bin/gt -> mat/gt
            Path(str(bin_path).replace('\\bin\\gt\\', '\\mat\\gt\\').replace('/bin/gt/', '/mat/gt/')).with_suffix('.mat'),
        ]
        
        for mat_path in possible_paths:
            if mat_path.exists():
                return mat_path
        
        return None
    
    def _get_shape_from_mat(self, mat_path: Path):
        """
        Read HSI data shape from MAT file.
        
        Args:
            mat_path: Path to MAT file
            
        Returns:
            tuple: (height, width, bands) or None
        """
        try:
            # Try scipy first (v5/v7 format)
            data = io.loadmat(mat_path)
            valid_keys = [k for k in data.keys() if not k.startswith("__")]
            
            if valid_keys:
                cube_key = valid_keys[0]
                cube = np.asarray(data[cube_key])
                return cube.shape
            
        except NotImplementedError:
            # v7.3 format (HDF5)
            with h5py.File(mat_path, 'r') as f:
                valid_keys = [k for k in f.keys() if not k.startswith("#")]
                if valid_keys:
                    cube_key = valid_keys[0]
                    shape = f[cube_key].shape
                    if len(shape) == 3:
                        # HDF5 storage format is usually (C, W, H), needs transpose to (H, W, C)
                        return (shape[2], shape[1], shape[0])
        
        return None

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
            # 2D data treated as single-band (cannot apply PCA)
            raise ValueError(f"2D data detected, PCA requires multi-band data")
        else:
            raise ValueError(f"Unsupported data shape: {cube.shape}. Expected 3D array.")

        # Validate dimensions are positive
        if height <= 0 or width <= 0 or bands <= 0:
            raise ValueError(f"Invalid dimensions: {height}x{width}x{bands}")

        # PCA requires at least 3 bands to reduce to 3 components
        if bands < 3:
            raise ValueError(f"PCA requires at least 3 bands, got {bands}")

        return height, width, bands

    def _apply_pca(self, cube: np.ndarray) -> np.ndarray:
        """
        Apply PCA to reduce spectral dimensionality to 3 components.
        
        The transformation:
        1. Reshape cube to (height*width, bands)
        2. Apply PCA to get (height*width, 3)
        3. Reshape to (height, width, 3)
        4. Normalize to [0, 1] range
        
        Args:
            cube: Numpy array of shape (height, width, bands)
            
        Returns:
            Numpy array of shape (height, width, 3) normalized to [0, 1]
        """
        height, width, bands = cube.shape
        
        logger.debug(f"Applying PCA: input shape {cube.shape}")
        
        # Reshape to 2D for PCA (samples, features)
        # Each pixel is a sample, each band is a feature
        cube_2d = cube.reshape(-1, bands)
        
        # Handle NaN values by replacing with mean
        if np.any(np.isnan(cube_2d)):
            logger.warning("NaN values detected, replacing with column means")
            col_means = np.nanmean(cube_2d, axis=0)
            nan_indices = np.where(np.isnan(cube_2d))
            cube_2d[nan_indices] = np.take(col_means, nan_indices[1])
        
        # Apply PCA to reduce to 3 components
        pca = PCA(n_components=3)
        pca_result = pca.fit_transform(cube_2d)
        
        logger.debug(f"PCA explained variance ratio: {pca.explained_variance_ratio_}")
        logger.debug(f"Total variance explained: {sum(pca.explained_variance_ratio_):.4f}")
        
        # Reshape back to 3D
        rgb_cube = pca_result.reshape(height, width, 3)
        
        # Normalize to [0, 1] range for each channel
        rgb_cube = self._normalize_channels(rgb_cube)
        
        return rgb_cube.astype(np.float32)

    def _normalize_channels(self, cube: np.ndarray) -> np.ndarray:
        """
        Normalize each channel to [0, 1] range using min-max scaling.
        
        Args:
            cube: Numpy array of shape (height, width, channels)
            
        Returns:
            Normalized array with values in [0, 1]
        """
        normalized = np.zeros_like(cube, dtype=np.float32)
        
        for i in range(cube.shape[2]):
            channel = cube[:, :, i]
            min_val = np.min(channel)
            max_val = np.max(channel)
            
            if max_val - min_val > 0:
                normalized[:, :, i] = (channel - min_val) / (max_val - min_val)
            else:
                # Constant channel, set to 0
                normalized[:, :, i] = 0
        
        return normalized

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
        return output_dir / f"{mat_stem}_pca.bin"

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