/**
 * Ground Truth Class Distribution Component
 * Displays the pixel count and percentage for each class using ECharts
 * No legend, integrated with label list
 */

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { GroundTruthMatrix } from '@/types/groundTruth';
import { generateRandomColor } from '@/services/groundTruthService';

interface GtClassDistributionProps {
  matrix: GroundTruthMatrix;
  height?: string;
}

interface ClassDistribution {
  index: number;
  name: string;
  color: string;
  pixelCount: number;
  percentage: number;
}

const GtClassDistribution: React.FC<GtClassDistributionProps> = ({
  matrix,
  height = '200px',
}) => {
  // Calculate class distribution from matrix data
  const distribution = useMemo((): ClassDistribution[] => {
    if (!matrix.matrix) return [];

    // Decode base64 to byte array
    const binaryString = atob(matrix.matrix);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Count pixels for each class
    const counts: number[] = new Array(matrix.numClasses).fill(0);
    for (let i = 0; i < bytes.length; i++) {
      const labelValue = bytes[i];
      if (labelValue >= 0 && labelValue < matrix.numClasses) {
        counts[labelValue]++;
      }
    }

    const totalPixels = matrix.width * matrix.height;

    // Build distribution array
    return Array.from({ length: matrix.numClasses }, (_, i) => {
      const label = matrix.labelMap.find(l => l.labelIndex === i);
      const pixelCount = counts[i];
      const percentage = totalPixels > 0 ? (pixelCount / totalPixels) * 100 : 0;
      
      return {
        index: i,
        name: label?.name || label?.aliasName || `类别 ${i}`,
        color: label?.colourCode || generateRandomColor(i),
        pixelCount,
        percentage,
      };
    }).sort((a, b) => b.pixelCount - a.pixelCount); // Sort by pixel count descending
  }, [matrix]);

  // Prepare data for pie chart
  const pieData = distribution.map(d => ({
    name: d.name,
    value: d.pixelCount,
    itemStyle: { color: d.color },
  }));

  const chartOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const total = distribution.reduce((sum, d) => sum + d.pixelCount, 0);
        const percentage = total > 0 ? ((params.value / total) * 100).toFixed(2) : '0.00';
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>像素: ${params.value.toLocaleString()}</div>
            <div>占比: ${percentage}%</div>
          </div>
        `;
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      textStyle: {
        color: '#fff',
      },
    },
    // No legend
    series: [
      {
        name: '类别分布',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 3,
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 11,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
      },
    ],
  };

  return (
    <div style={{ height }}>
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default GtClassDistribution;
