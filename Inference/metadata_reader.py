import h5py
import scipy.io


def get_metadata(file_path: str) -> metadata:
    metadata = {
        'file_path': file_path,
        'legacy_header': '',
        'version': 'unknown',
        'variables': []
    }

    # Extract legacy header
    try:
        with open(file_path, 'rb') as f:
            header_bytes = f.read(116)
            metadata["legacy_header"] = header_bytes.decode('ascii', errors='ignore').strip()
    except Exception as e:
        print(f"Error reading raw header: {e}")

    if "7.3" in metadata["legacy_header"]:
        metadata["version"] = "v7.3"
        _extract_h5py_metadata(file_path, metadata)
    else:
        metadata["version"] = "v5/v7"
        _extract_scipy_metadata(file_path, metadata)

    return metadata

def _extract_scipy_metadata(file_path, metadata_dict):
    """Extraction logic for v5/v7 files using scipy.whosmat."""
    try:
        # whosmat is efficient: it only reads the variable headers, not the data
        vars_info = scipy.io.whosmat(file_path)
        for name, shape, dtype in vars_info:
            metadata_dict["variables"].append({
                "name": name,
                "shape": shape,
                "dtype": dtype
            })
    except Exception as e:
        print(f"Scipy extraction failed: {e}")


def _extract_h5py_metadata(file_path, metadata_dict):
    """Extraction logic for v7.3 files using h5py."""
    try:
        with h5py.File(file_path, 'r') as f:
            for name in f.keys():
                # Skip MATLAB internal system groups
                if name.startswith('#'):
                    continue

                obj = f[name]
                if isinstance(obj, h5py.Dataset):
                    # Note: HDF5 stores data in (C, H, W) or (W, H, C) depending on export
                    metadata_dict["variables"].append({
                        "name": name,
                        "shape": obj.shape,
                        "dtype": str(obj.dtype)
                    })
    except Exception as e:
        print(f"h5py extraction failed: {e}")