package cn.arorms.hsi.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroundTruthStats {
    private List<Float> wavelengths;

    private List<CategorySpectralStat> categories;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySpectralStat {
        // 类别 ID (即 GT 矩阵中的像素值，如 0, 1, 2...)
        private Integer classId;

        // 类别名称 (如 "Water", "Vegetation"，如果你的系统中有存储的话)
        private String className;

        // 该类别在图像中的像素总数 (用于展示占比)
        private Long pixelCount;

        // 平均波谱序列 (Y 轴数据，长度应等于波段总数)
        private List<Double> meanSpectrum;

        // 标准差序列 (可选，用于绘制 ECharts 的误差区间/阴影区域)
        private List<Double> stdDevSpectrum;
    }
}
