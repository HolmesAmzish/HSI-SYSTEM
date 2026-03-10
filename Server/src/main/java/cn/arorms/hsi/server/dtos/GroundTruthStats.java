package cn.arorms.hsi.server.dtos;

import cn.arorms.hsi.server.entities.SegmentationLabel;
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
        private SegmentationLabel label;

        // 该类别在图像中的像素总数 (用于展示占比)
        private Long pixelCount;

        // 平均波谱序列 (Y 轴数据，长度应等于波段总数)
        private List<Double> meanSpectrum;

        // 标准差序列 (可选，用于绘制 ECharts 的误差区间/阴影区域)
        private List<Double> stdDevSpectrum;
    }
}
