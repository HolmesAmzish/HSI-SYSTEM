import scipy.io as io
import numpy as np
import h5py
import os
from config import DTYPE_OUT


class MatService:
    @staticmethod
    def process_mat(mat_path, bin_path):
        """
        核心流程：读取MAT -> 提取元数据 -> 存为BIN
        """
        try:
            # 1. 加载数据
            cube, meta_raw = MatService._load_mat_file(mat_path)

            # 2. 准备元数据 (用于回传 Java 更新数据库)
            h, w, b = cube.shape
            metadata = {
                "height": h,
                "width": w,
                "bands": b,
                "variables": list(meta_raw.keys())
            }

            # 3. 转换为连续内存的 float32 (C-order)
            # 这是 React 前端能正确读取的关键
            cube_fixed = cube.astype(DTYPE_OUT, order='C')

            # 4. 写入二进制
            with open(bin_path, 'wb') as f:
                f.write(cube_fixed.tobytes())

            return metadata
        except Exception as e:
            print(f"[MatService] Error: {str(e)}")
            raise e

    @staticmethod
    def _load_mat_file(file_path):
        """支持 v5/v7 和 v7.3 格式的自动识别读取"""
        try:
            # 尝试标准读取
            data = io.loadmat(file_path)
            valid_keys = [k for k in data.keys() if not k.startswith('__')]
            if not valid_keys:
                raise ValueError("MAT file is empty")

            cube_key = valid_keys[0]  # 默认取第一个变量
            return np.asarray(data[cube_key]), data

        except NotImplementedError:
            # 兼容 v7.3 (HDF5 格式)
            with h5py.File(file_path, 'r') as f:
                valid_keys = [k for k in f.keys() if not k.startswith('#')]
                cube_key = valid_keys[0]
                # HDF5 读出通常是 (C, W, H)，需要转置回 (H, W, C)
                cube = np.array(f[cube_key]).transpose(2, 1, 0)
                return cube, {cube_key: "v7.3_data"}