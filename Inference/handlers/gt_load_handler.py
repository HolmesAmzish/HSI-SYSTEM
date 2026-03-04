"""
Handler for GT_LOAD task type.
Processes GT MAT files and stores raster data in PostgreSQL with PostGIS support.
"""

import logging
import scipy.io as io
import numpy as np
import h5py
from pathlib import Path
from typing import Any, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config.settings import settings
from models.result import GtLoadResult
from models.task import GtLoadPayload


logger = logging.getLogger(__name__)


class GtLoadHandler:
    """
    Handler for loading GT MAT files and storing raster data in PostgreSQL.
    
    This handler processes ground truth MAT files, extracts the mask data,
    and stores it in the ground_truth_masks table with PostGIS raster support.
    
    The raster data is stored as byte array in the database for efficient
    access and spatial operations via PostGIS.
    """

    def __init__(self):
        """Initialize database connection."""
        self.engine = create_engine(
            settings.postgres.connection_url,
            pool_size=settings.postgres.POSTGRES_POOL_SIZE,
            max_overflow=settings.postgres.POSTGRES_MAX_OVERFLOW,
            pool_timeout=settings.postgres.POSTGRES_POOL_TIMEOUT,
            pool_recycle=settings.postgres.POSTGRES_POOL_RECYCLE,
            echo=False
        )
        self.SessionLocal = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)

    def handle(self, task_id: str, payload: GtLoadPayload, output_dir: Optional[Path] = None) -> GtLoadResult:
        """
        Process a GT load task.
        
        Args:
            task_id: Unique task identifier
            payload: Task payload containing file path and dataset info
            output_dir: Optional directory for output binary files (for backup)
            
        Returns:
            GtLoadResult with metadata
            
        Raises:
            ValueError: If MAT file is invalid or cannot be loaded
            IOError: If database write fails
        """
        # Resolve file path: convert relative path to absolute path
        mat_path = self._resolve_file_path(payload.filePath)
        logger.info(f"Processing GT MAT file: {mat_path}")

        # Load MAT file and get mask data
        mask_data, unique_classes = self._load_mat_file(mat_path)

        # Get dimensions
        height, width = self._validate_mask_shape(mask_data)

        # Convert mask to byte array for storage
        raster_bytes = self._convert_to_raster_bytes(mask_data)

        # Store in PostgreSQL with PostGIS raster
        self._store_in_database(
            hsi_id=payload.dataset.id or 0,
            filename=Path(payload.filePath).name,
            mat_path=str(payload.filePath),
            raster_bytes=raster_bytes
        )

        logger.info(
            f"GT mask loaded: {height}x{width}, "
            f"classes: {unique_classes}, "
            f"stored in database"
        )

        return GtLoadResult(
            height=height,
            width=width,
            numClasses=len(unique_classes),
            maskPath=str(payload.filePath),
            classLabels={int(k): str(v) for k, v in unique_classes.items()}
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

    def _load_mat_file(self, file_path: Path) -> tuple[np.ndarray, dict]:
        """
        Load MAT file and extract ground truth mask data.
        
        Handles both v5/v7 (standard) and v7.3 (HDF5-based) MAT file formats.
        
        Args:
            file_path: Path to MAT file
            
        Returns:
            Tuple of (numpy array containing mask data, dict of class labels)
            
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

            # Extract class labels if available
            class_labels = self._extract_class_labels(data)

            logger.debug(f"Loaded mask from key '{mask_key}' with shape {mask_data.shape}")
            return mask_data, class_labels

        except NotImplementedError:
            # Handle v7.3 format (HDF5-based)
            logger.debug(f"Loading MAT file (v7.3/HDF5 format): {file_path}")
            with h5py.File(file_path, "r") as f:
                valid_keys = [k for k in f.keys() if not k.startswith("#")]
                if not valid_keys:
                    raise ValueError("HDF5 MAT file contains no valid data variables")

                mask_key = valid_keys[0]
                mask_data = np.array(f[mask_key])

                # Extract class labels if available
                class_labels = self._extract_class_labels_from_hdf5(f)

                logger.debug(f"Loaded HDF5 mask from key '{mask_key}' with shape {mask_data.shape}")
                return mask_data, class_labels

        except Exception as e:
            raise ValueError(f"Failed to load MAT file: {str(e)}")

    def _extract_class_labels(self, data: dict) -> dict:
        """
        Extract class labels from MAT file data.
        
        Looks for common variable names like 'labels', 'class_names', 'classNames'.
        
        Args:
            data: Dictionary loaded from MAT file
            
        Returns:
            Dictionary mapping class IDs to label names
        """
        class_labels = {}
        
        # Common variable names for class labels
        label_keys = ['labels', 'class_names', 'classNames', 'classLabels', 'names']
        
        for key in label_keys:
            if key in data:
                labels = data[key]
                if isinstance(labels, np.ndarray):
                    if labels.dtype.kind in ('U', 'S', 'O'):
                        # String array
                        for i, label in enumerate(labels.flatten()):
                            if isinstance(label, bytes):
                                class_labels[i + 1] = label.decode('utf-8')
                            else:
                                class_labels[i + 1] = str(label)
                    elif labels.dtype.kind == 'i' or labels.dtype.kind == 'f':
                        # Numeric array - use index as label
                        for i, val in enumerate(labels.flatten()):
                            class_labels[i + 1] = f"class_{int(val)}"
                break
        
        return class_labels

    def _extract_class_labels_from_hdf5(self, f: h5py.File) -> dict:
        """
        Extract class labels from HDF5 file.
        
        Args:
            f: Open HDF5 file object
            
        Returns:
            Dictionary mapping class IDs to label names
        """
        class_labels = {}
        
        # Common variable names for class labels
        label_keys = ['labels', 'class_names', 'classNames', 'classLabels', 'names']
        
        for key in label_keys:
            if key in f:
                labels = f[key]
                if isinstance(labels, h5py.Dataset):
                    labels_data = labels[:]
                    if labels_data.dtype.kind in ('U', 'S', 'O'):
                        for i, label in enumerate(labels_data.flatten()):
                            if isinstance(label, bytes):
                                class_labels[i + 1] = label.decode('utf-8')
                            else:
                                class_labels[i + 1] = str(label)
                break
        
        return class_labels

    def _validate_mask_shape(self, mask: np.ndarray) -> tuple[int, int]:
        """
        Validate and normalize mask shape.
        
        Args:
            mask: Numpy array containing ground truth mask
            
        Returns:
            Tuple of (height, width)
            
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

        return height, width

    def _convert_to_raster_bytes(self, mask: np.ndarray) -> bytes:
        """
        Convert mask data to bytes for database storage.
        
        The mask is converted to int16 for efficient storage while
        supporting up to 32767 class labels.
        
        Args:
            mask: Numpy array containing ground truth mask
            
        Returns:
            Bytes representation of the mask
        """
        # Convert to int16 for efficient storage
        mask_int16 = mask.astype(np.int16, order='C')
        return mask_int16.tobytes()

    def _store_in_database(
        self,
        hsi_id: int,
        filename: str,
        mat_path: str,
        raster_bytes: bytes
    ) -> None:
        """
        Store ground truth mask in PostgreSQL database.
        
        Args:
            hsi_id: ID of the associated hyperspectral image
            filename: Name of the MAT file
            mat_path: Path to the MAT file
            raster_bytes: Raster data as bytes
            
        Raises:
            IOError: If database write fails
        """
        try:
            with self.SessionLocal() as session:
                # Insert into ground_truth_masks table
                # The raster column uses PostGIS raster type, but we store as bytea
                # which PostgreSQL will handle appropriately
                query = text("""
                    INSERT INTO ground_truth_masks (hsi_id, filename, mat_path, raster)
                    VALUES (:hsi_id, :filename, :mat_path, :raster)
                """)
                
                session.execute(
                    query,
                    {
                        "hsi_id": hsi_id,
                        "filename": filename,
                        "mat_path": mat_path,
                        "raster": raster_bytes
                    }
                )
                
                session.commit()
                logger.info(f"Ground truth mask stored in database for hsi_id={hsi_id}")
                
        except Exception as e:
            session.rollback()
            raise IOError(f"Failed to store ground truth mask in database: {e}")