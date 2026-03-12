/**
 * Spectral Statistics Chart Component
 * Displays spectral curves with standard deviation bands for each category
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { GroundTruthStats, CategorySpectralStat } from '@/types/groundTruth';
import { generateRandomColor } from '@/services/groundTruthService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Info } from 'lucide-react';

interface SpectralStatsChartProps {
  stats: GroundTruthStats;
  title?: string;
  description?: string;
  height?: string;
}

/**
 * Get color for a category
 */
function getCategoryColor(category: CategorySpectralStat, index: number): string {
  // Use label's color if available, otherwise generate random color
  return category.label?.colourCode || generateRandomColor(index);
}

/**
 * Get category name
 */
function getCategoryName(category: CategorySpectralStat, index: number): string {
  return category.label?.name || category.label?.aliasName || `类别 ${category.label?.labelIndex ?? index}`;
}

/**
 * Format number for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

const SpectralStatsChart: React.FC<SpectralStatsChartProps> = ({
  stats,
  title = '光谱统计曲线',
  description = '各类别的平均光谱反射率曲线及标准差范围',
  height = '500px',
}) => {
  // Calculate total pixels
  const totalPixels = useMemo(() => {
    return stats.categories.reduce((sum, cat) => sum + cat.pixelCount, 0);
  }, [stats.categories]);

  // Build ECharts option
  const chartOption: EChartsOption = useMemo(() => {
    const series: EChartsOption['series'] = [];
    const legendData: string[] = [];

    stats.categories.forEach((category, index) => {
      const color = getCategoryColor(category, index);
      const name = getCategoryName(category, index);
      legendData.push(name);

      // Mean spectrum line
      series.push({
        name,
        type: 'line',
        data: category.meanSpectrum,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color,
        },
        itemStyle: {
          color,
        },
      });

      // Standard deviation band (area)
      if (category.stdDevSpectrum && category.stdDevSpectrum.length > 0) {
        // Calculate upper and lower bounds
        const upperBound = category.meanSpectrum.map((mean, i) => 
          mean + (category.stdDevSpectrum[i] || 0)
        );
        const lowerBound = category.meanSpectrum.map((mean, i) => 
          mean - (category.stdDevSpectrum[i] || 0)
        );

        // Create area for confidence band
        series.push({
          name: `${name} (标准差范围)`,
          type: 'line',
          data: lowerBound,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 0,
          },
          areaStyle: {
            color,
            opacity: 0.15,
          },
          stack: `confidence-${index}`,
          z: 1,
        });

        series.push({
          name: `${name} (上界)`,
          type: 'line',
          data: upperBound.map((val, i) => val - lowerBound[i]),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 0,
          },
          areaStyle: {
            color,
            opacity: 0.15,
          },
          stack: `confidence-${index}`,
          z: 1,
        });
      }
    });

    return {
      title: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          
          const wavelengthIndex = params[0]?.dataIndex;
          const wavelength = stats.wavelengths[wavelengthIndex]?.toFixed(2) || wavelengthIndex;
          
          let html = `<div style="font-weight: bold; margin-bottom: 4px;">波长: ${wavelength} nm</div>`;
          html += '<div style="max-height: 200px; overflow-y: auto;">';
          
          params.forEach((item: any) => {
            // Skip confidence band items
            if (item.seriesName.includes('标准差范围') || item.seriesName.includes('上界')) {
              return;
            }
            const value = item.value?.toFixed(4) || '-';
            const color = item.color;
            html += `
              <div style="display: flex; align-items: center; gap: 8px; margin: 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></span>
                <span style="flex: 1;">${item.seriesName}:</span>
                <span style="font-weight: 500;">${value}</span>
              </div>
            `;
          });
          html += '</div>';
          return html;
        },
      },
      legend: {
        data: legendData,
        type: 'scroll',
        bottom: 0,
        itemWidth: 15,
        itemHeight: 10,
        textStyle: {
          fontSize: 11,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: stats.wavelengths.map((w) => w.toFixed(2)),
        name: '波长 (nm)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        axisLabel: {
          formatter: (value: string) => {
            const num = parseFloat(value);
            // Show fewer labels for cleaner display
            return num % 50 < 1 ? value : '';
          },
          fontSize: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            opacity: 0.3,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '反射率',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        axisLabel: {
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            opacity: 0.3,
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          height: 20,
          bottom: 50,
        },
      ],
      series,
    };
  }, [stats]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {description}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.categories.length} 个类别
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Category Statistics */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">类别统计</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {stats.categories.map((category, index) => {
              const color = getCategoryColor(category, index);
              const name = getCategoryName(category, index);
              const percentage = ((category.pixelCount / totalPixels) * 100).toFixed(1);
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-background rounded border border-border/50"
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" title={name}>
                      {name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(category.pixelCount)} 像素 ({percentage}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Chart */}
        <ReactECharts
          option={chartOption}
          style={{ height }}
          opts={{
            renderer: 'canvas',
          }}
        />
      </CardContent>
    </Card>
  );
};

export default SpectralStatsChart;