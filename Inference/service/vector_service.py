from rasterio import features
from shapely.geometry import shape


def mask_to_polygons(mask_matrix):
    """
    将 2D 掩码矩阵转换为 GeoJSON 多边形集合
    """
    # 确保是 int 类型
    mask_matrix = mask_matrix.astype(np.int32)

    # 提取形状 (会自动合并相同标签的连通区域)
    results = ({'properties': {'raster_val': v}, 'geometry': s}
               for i, (s, v) in enumerate(features.shapes(mask_matrix)))

    # 过滤掉背景 (假设 0 是背景)
    polygons = [res for res in results if res['properties']['raster_val'] != 0]
    return polygons  # 返回 GeoJSON 列表