"""
Test script for reading binary HSI cube files.
Reads a bin file, automatically extracts shape from corresponding MAT file,
prints sample data, and displays a false color image.
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import scipy.io as io
import h5py


# ==================== Configuration ====================
# Modify the bin file path here
BIN_PATH = r"C:\Development\repositories\HSI-SYSTEM\SharedData\bin\hsi\Dioni.bin"

# Data type
DTYPE = "float32"

# Band indices for false color image (RGB)
# Modify these values to select different band combinations
RED_BAND = 100    # Red channel band index
GREEN_BAND = 50   # Green channel band index
BLUE_BAND = 20    # Blue channel band index
# ======================================================


def get_shape_from_mat(mat_path: str):
    """
    Read HSI data shape from corresponding MAT file.
    
    Args:
        mat_path: Path to MAT file
    
    Returns:
        tuple: (height, width, bands) or None
    """
    mat_path = Path(mat_path)
    
    if not mat_path.exists():
        return None
    
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
                # HDF5 storage format is usually (C, W, H), needs transpose
                shape = f[cube_key].shape
                if len(shape) == 3:
                    return (shape[2], shape[1], shape[0])  # (H, W, C)
    
    return None


def find_mat_for_bin(bin_path: str):
    """
    Find corresponding MAT file based on bin file path.
    
    Args:
        bin_path: Path to bin file
    
    Returns:
        str: MAT file path or None
    """
    bin_path = Path(bin_path)
    
    # Try multiple possible MAT file locations
    possible_mat_paths = [
        # Same directory
        bin_path.with_suffix('.mat'),
        # In mat directory
        Path(str(bin_path).replace('\\bin\\', '\\mat\\').replace('/bin/', '/mat/')).with_suffix('.mat'),
        # bin/hsi -> mat/hsi
        Path(str(bin_path).replace('\\bin\\hsi\\', '\\mat\\hsi\\').replace('/bin/hsi/', '/mat/hsi/')).with_suffix('.mat'),
        # bin/gt -> mat/gt
        Path(str(bin_path).replace('\\bin\\gt\\', '\\mat\\gt\\').replace('/bin/gt/', '/mat/gt/')).with_suffix('.mat'),
    ]
    
    for mat_path in possible_mat_paths:
        if mat_path.exists():
            return str(mat_path)
    
    return None


def read_bin_file(bin_path: str, dtype: str = "float32"):
    """
    Read binary HSI data file, automatically get shape from corresponding MAT file.
    
    Args:
        bin_path: Path to bin file
        dtype: Data type (default: float32)
    
    Returns:
        tuple: (numpy array, shape) or (None, None)
    """
    bin_path = Path(bin_path)
    
    if not bin_path.exists():
        raise FileNotFoundError(f"Bin file not found: {bin_path}")
    
    print(f"\n{'='*60}")
    print(f"BIN File Read Report")
    print(f"{'='*60}")
    print(f"BIN file path: {bin_path}")
    
    # Find corresponding MAT file
    mat_path = find_mat_for_bin(str(bin_path))
    
    if mat_path:
        print(f"Found corresponding MAT file: {mat_path}")
        shape = get_shape_from_mat(mat_path)
        
        if shape:
            height, width, bands = shape
            print(f"Shape read from MAT file: {shape} (H x W x B)")
        else:
            print(f"WARNING: Unable to read shape from MAT file")
            return None, None
    else:
        print(f"WARNING: No corresponding MAT file found")
        
        # Infer possible shape from file size
        actual_size = bin_path.stat().st_size
        total_elements = actual_size // np.dtype(dtype).itemsize
        print(f"File size: {actual_size:,} bytes")
        print(f"Total elements: {total_elements:,}")
        print(f"Please specify shape manually or ensure MAT file exists")
        return None, None
    
    # Calculate expected file size
    expected_size = height * width * bands * np.dtype(dtype).itemsize
    actual_size = bin_path.stat().st_size
    
    print(f"\nFile size: {actual_size:,} bytes ({actual_size / 1024 / 1024:.2f} MB)")
    print(f"Expected size: {expected_size:,} bytes ({expected_size / 1024 / 1024:.2f} MB)")
    
    if actual_size != expected_size:
        print(f"\nWARNING: File size mismatch! Difference: {actual_size - expected_size} bytes")
        return None, None
    
    print(f"SUCCESS: File size matches!")
    
    # Read binary data
    with open(bin_path, 'rb') as f:
        raw_data = f.read()
    
    # Convert to numpy array and reshape
    cube = np.frombuffer(raw_data, dtype=dtype)
    cube = cube.reshape((height, width, bands))
    
    print(f"SUCCESS: Data loaded successfully, shape: {cube.shape}")
    
    return cube, (height, width, bands)


def print_sample_data(cube: np.ndarray):
    """
    Print sample data.
    
    Args:
        cube: HSI data array (height, width, bands)
    """
    height, width, bands = cube.shape
    
    # Select representative rows and columns
    row_indices = [0, height // 4, height // 2, 3 * height // 4, height - 1]
    col_indices = [0, width // 4, width // 2, 3 * width // 4, width - 1]
    
    print(f"\n{'='*60}")
    print(f"Data Statistics")
    print(f"{'='*60}")
    print(f"Shape: {cube.shape}")
    print(f"Data type: {cube.dtype}")
    print(f"Min value: {cube.min():.6f}")
    print(f"Max value: {cube.max():.6f}")
    print(f"Mean value: {cube.mean():.6f}")
    print(f"Std deviation: {cube.std():.6f}")
    
    # Check for NaN or Inf values
    nan_count = np.isnan(cube).sum()
    inf_count = np.isinf(cube).sum()
    if nan_count > 0 or inf_count > 0:
        print(f"WARNING: Data contains {nan_count} NaN values and {inf_count} Inf values")
    else:
        print(f"SUCCESS: No NaN or Inf values detected")
    
    print(f"\n{'='*60}")
    print(f"Sample Data (Spectral values at various locations)")
    print(f"{'='*60}")
    
    # Print samples at specified locations
    for r in row_indices:
        for c in col_indices:
            if 0 <= r < height and 0 <= c < width:
                print(f"\nPixel [{r}, {c}]:")
                print(f"  First 5 bands: {cube[r, c, :5]}")
                print(f"  Middle 5 bands: {cube[r, c, bands//2-2:bands//2+3]}")
                print(f"  Last 5 bands: {cube[r, c, -5:]}")


def display_false_color(cube: np.ndarray, red_band: int, green_band: int, blue_band: int):
    """
    Display false color image.
    
    Args:
        cube: HSI data array (height, width, bands)
        red_band: Red channel band index
        green_band: Green channel band index
        blue_band: Blue channel band index
    """
    height, width, bands = cube.shape
    
    # Validate band indices
    if not (0 <= red_band < bands and 0 <= green_band < bands and 0 <= blue_band < bands):
        print(f"WARNING: Band index out of range! Valid range: 0-{bands-1}")
        # Auto-adjust to valid values
        red_band = min(red_band, bands - 1)
        green_band = min(green_band, bands - 1)
        blue_band = min(blue_band, bands - 1)
    
    print(f"\n{'='*60}")
    print(f"False Color Image Display")
    print(f"{'='*60}")
    print(f"Red channel: Band {red_band}")
    print(f"Green channel: Band {green_band}")
    print(f"Blue channel: Band {blue_band}")
    
    # Extract RGB bands
    red = cube[:, :, red_band]
    green = cube[:, :, green_band]
    blue = cube[:, :, blue_band]
    
    # Normalize to 0-1 range (percentile clipping for contrast enhancement)
    def normalize_band(band, lower_percentile=2, upper_percentile=98):
        """Normalize band data to 0-1 range"""
        lower = np.percentile(band, lower_percentile)
        upper = np.percentile(band, upper_percentile)
        band_clipped = np.clip(band, lower, upper)
        return (band_clipped - lower) / (upper - lower + 1e-10)
    
    red_norm = normalize_band(red)
    green_norm = normalize_band(green)
    blue_norm = normalize_band(blue)
    
    # Combine into RGB image
    rgb_image = np.stack([red_norm, green_norm, blue_norm], axis=2)
    
    # Display images
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # False color composite
    axes[0, 0].imshow(rgb_image)
    axes[0, 0].set_title(f'False Color Composite (R:{red_band}, G:{green_band}, B:{blue_band})')
    axes[0, 0].axis('off')
    
    # Single band grayscale images
    im1 = axes[0, 1].imshow(red, cmap='gray')
    axes[0, 1].set_title(f'Band {red_band} (Red Channel)')
    axes[0, 1].axis('off')
    plt.colorbar(im1, ax=axes[0, 1], fraction=0.046, pad=0.04)
    
    im2 = axes[1, 0].imshow(green, cmap='gray')
    axes[1, 0].set_title(f'Band {green_band} (Green Channel)')
    axes[1, 0].axis('off')
    plt.colorbar(im2, ax=axes[1, 0], fraction=0.046, pad=0.04)
    
    im3 = axes[1, 1].imshow(blue, cmap='gray')
    axes[1, 1].set_title(f'Band {blue_band} (Blue Channel)')
    axes[1, 1].axis('off')
    plt.colorbar(im3, ax=axes[1, 1], fraction=0.046, pad=0.04)
    
    plt.tight_layout()
    plt.show()
    
    # Also display spectral curve
    center_h, center_w = height // 2, width // 2
    spectrum = cube[center_h, center_w, :]
    
    plt.figure(figsize=(10, 4))
    plt.plot(range(bands), spectrum, 'b-', linewidth=1)
    plt.axvline(x=red_band, color='r', linestyle='--', label=f'Red band {red_band}')
    plt.axvline(x=green_band, color='g', linestyle='--', label=f'Green band {green_band}')
    plt.axvline(x=blue_band, color='b', linestyle='--', label=f'Blue band {blue_band}')
    plt.xlabel('Band Index')
    plt.ylabel('Spectral Value')
    plt.title(f'Spectral Curve of Center Pixel [{center_h}, {center_w}]')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()


def main():
    """Main function"""
    print(f"\n{'='*60}")
    print(f"HSI BIN File Read Test")
    print(f"{'='*60}")
    print(f"Configuration:")
    print(f"  BIN file: {BIN_PATH}")
    print(f"  Data type: {DTYPE}")
    
    # Read bin file (automatically get shape from MAT file)
    cube, shape = read_bin_file(BIN_PATH, DTYPE)
    
    if cube is None:
        print("FAILED: Unable to read bin file!")
        return
    
    # Print sample data
    print_sample_data(cube)
    
    # Display false color image
    display_false_color(cube, RED_BAND, GREEN_BAND, BLUE_BAND)
    
    print(f"\n{'='*60}")
    print(f"SUCCESS: Test completed!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()