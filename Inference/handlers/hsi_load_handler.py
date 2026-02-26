import scipy.io as io
import numpy as np
import h5py
from pathlib import Path
from core.dependencies import container

class HsiLoadHandler:
    """
    Handler for loading HSI MAT files and converting to binary format.
    Pure function: receives filepath, returns metadata and saves binary file.
    """

    @staticmethod
    def load_mat_to_bin(mat_path: str, output_dir: str) -> dict:
        """
        Load MAT file, save as binary, and return metadata.
        
        Args:
            mat_path: Path to MAT file
            output_dir: Directory to save binary file
            
        Returns:
            Dictionary containing metadata:
            {
                "height": int,
                "width": int, 
                "bands": int,
                "binary_path": str,
                "data_type": str,
                "file_size": int
            }
            
        Raises:
            ValueError: If MAT file cannot be loaded or is invalid
            IOError: If binary file cannot be written
        """
        # Create output directory if it doesn't exist
        # output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load MAT file
        cube, _ = HsiLoadHandler._load_mat_file(mat_path)
        
        # Get dimensions
        if len(cube.shape) == 3:
            height, width, bands = cube.shape
        elif len(cube.shape) == 2:
            height, width = cube.shape
            bands = 1
            # cube = cube.reshape(height, width, 1)
        else:
            raise ValueError(f"Unsupported data shape: {cube.shape}")
        
        # Generate binary file path
        mat_stem = Path(mat_path).stem
        output_dir = Path(output_dir)
        bin_path = output_dir / f"{mat_stem}.bin"
        
        # Convert to float32 and save
        cube_float32 = cube.astype('float32', order='C')
        with open(bin_path, 'wb') as f:
            f.write(cube_float32.tobytes())
        
        # Return metadata
        return {
            "height": height,
            "width": width,
            "bands": bands,
            "binary_path": str(bin_path),
            "data_type": "float32",
            "file_size": bin_path.stat().st_size
        }
    
    @staticmethod
    def _load_mat_file(file_path: str):
        """
        Load MAT file and return cube data.
        
        Args:
            file_path: Path to MAT file
            
        Returns:
            Tuple of (cube_data, raw_data_dict)
            
        Raises:
            ValueError: If file cannot be loaded or is empty
        """
        try:
            # Try standard v5/v7 format
            data = io.loadmat(file_path)
            
            # Filter out MATLAB internal variables
            valid_keys = [k for k in data.keys() if not k.startswith('__')]
            if not valid_keys:
                raise ValueError("MAT file contains no valid data variables")
            
            # Use first valid variable
            cube_key = valid_keys[0]
            cube_data = np.asarray(data[cube_key])
            
            return cube_data, data
            
        except NotImplementedError:
            # Handle v7.3 format (HDF5-based)
            with h5py.File(file_path, 'r') as f:
                valid_keys = [k for k in f.keys() if not k.startswith('#')]
                if not valid_keys:
                    raise ValueError("HDF5 MAT file contains no valid data variables")
                
                cube_key = valid_keys[0]
                # Transpose from (channels, width, height) to (height, width, channels)
                cube_data = np.array(f[cube_key]).transpose(2, 1, 0)
                
                return cube_data, {cube_key: f[cube_key]}
        
        except Exception as e:
            raise ValueError(f"Failed to load MAT file: {str(e)}")
