/**
 * PCA Point Cloud 3D Viewer Component (ECharts 3D Version)
 * 
 * Displays 3D point cloud from PCA-reduced hyperspectral data using ECharts GL.
 * Supports interactive rotation, zoom, and category filtering.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PcaPointCloud, Point3D } from '@/types/pca';
import { buildColorMap } from '@/services/pcaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  Palette,
  Move,
  Box,
} from 'lucide-react';

// Import ECharts
import * as echarts from 'echarts';
import 'echarts-gl';

interface PcaPointCloudViewerProps {
  pointCloud: PcaPointCloud;
  height?: string;
}

const PcaPointCloudViewer: React.FC<PcaPointCloudViewerProps> = ({
  pointCloud,
  height = '500px',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [pointSize, setPointSize] = useState(2);
  // Calculate numClasses from labels or use max label index from points
  const numClasses = pointCloud.numClasses ?? 
    (pointCloud.labels?.length ? 
      pointCloud.labels.reduce((max, l) => Math.max(max, l.labelIndex), 0) + 1 : 
      (() => {
        let maxLabel = 0;
        for (let i = 3; i < pointCloud.points.length; i += 4) {
          maxLabel = Math.max(maxLabel, pointCloud.points[i]);
        }
        return maxLabel + 1;
      })()
    );

  const [visibleClasses, setVisibleClasses] = useState<Set<number>>(
    () => new Set(Array.from({ length: numClasses }, (_, i) => i))
  );
  const [colorMap, setColorMap] = useState<Map<number, string>>(new Map());
  const [showAll, setShowAll] = useState(true);
  
  // View state
  const [viewMode, setViewMode] = useState<'3d' | 'xy' | 'xz' | 'yz'>('3d');
  const [opacity, setOpacity] = useState(0.8);

  // Build color map
  useEffect(() => {
    const colors = buildColorMap(pointCloud.labels, numClasses);
    setColorMap(colors);
  }, [pointCloud, numClasses]);

  // Calculate total points from points array length
  const totalPoints = pointCloud.totalPoints ?? Math.floor(pointCloud.points.length / 4);

  // Convert flat arrays to Point3D array
  const convertToPoints = useCallback((): Point3D[] => {
    const points: Point3D[] = [];
    const { points: pointData, width } = pointCloud;

    for (let i = 0; i < totalPoints; i++) {
      const offset = i * 4;
      const x = pointData[offset];
      const y = pointData[offset + 1];
      const z = pointData[offset + 2];
      const label = pointData[offset + 3];
      const color = colorMap.get(label) || '#888888';
      
      // Calculate row and col from index
      const row = Math.floor(i / width);
      const col = i % width;

      points.push({
        x,
        y,
        z,
        row,
        col,
        label,
        color,
      });
    }

    return points;
  }, [pointCloud, colorMap]);

  // Filter and group points by class
  const getFilteredData = useCallback(() => {
    const points = convertToPoints();
    const filteredPoints = points.filter((p) => visibleClasses.has(p.label));
    
    // Group by class
    const grouped: { [key: number]: Point3D[] } = {};
    filteredPoints.forEach((p) => {
      if (!grouped[p.label]) {
        grouped[p.label] = [];
      }
      grouped[p.label].push(p);
    });
    
    return grouped;
  }, [convertToPoints, visibleClasses]);

  // Get chart option
  const getChartOption = useCallback(() => {
    const grouped = getFilteredData();
    const series: echarts.SeriesOption[] = [];

    Object.entries(grouped).forEach(([labelStr, points]) => {
      const label = parseInt(labelStr);
      const labelInfo = pointCloud.labels?.find((l) => l.labelIndex === label);
      const color = colorMap.get(label) || '#888888';
      const name = labelInfo?.name || labelInfo?.aliasName || `类别 ${label}`;

      // Map points based on view mode
      const data = points.map((p) => {
        if (viewMode === 'xy') {
          return [p.x, p.y, 0];
        } else if (viewMode === 'xz') {
          return [p.x, p.z, 0];
        } else if (viewMode === 'yz') {
          return [p.y, p.z, 0];
        }
        return [p.x, p.y, p.z];
      });

      series.push({
        name,
        type: (viewMode === '3d' ? 'scatter3D' : 'scatter') as any,
        symbolSize: pointSize,
        data,
        itemStyle: {
          color,
          opacity,
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
          },
        },
      });
    });

    const is3D = viewMode === '3d';

    return {
      tooltip: {
        show: true,
        formatter: (params: any) => {
          if (params.value) {
            const [x, y, z] = params.value;
            return `${params.seriesName}<br/>
                    X: ${x.toFixed(4)}<br/>
                    Y: ${y.toFixed(4)}<br/>
                    ${is3D ? `Z: ${z.toFixed(4)}<br/>` : ''}`;
          }
          return '';
        },
      },
      legend: {
        show: false, // We use custom legend
      },
      grid3D: is3D ? {
        viewControl: {
          autoRotate: false,
          projection: 'perspective',
          rotateSensitivity: 1,
          zoomSensitivity: 1,
          panSensitivity: 1,
          alpha: 20,
          beta: 40,
          distance: 200,
        },
        light: {
          main: {
            intensity: 1.2,
            shadow: false,
          },
          ambient: {
            intensity: 0.3,
          },
        },
        postEffect: {
          enable: false,
        },
      } : undefined,
      xAxis3D: is3D ? {
        name: 'X',
        nameTextStyle: { color: '#888' },
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { textStyle: { color: '#888' } },
      } : undefined,
      yAxis3D: is3D ? {
        name: 'Y',
        nameTextStyle: { color: '#888' },
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { textStyle: { color: '#888' } },
      } : undefined,
      zAxis3D: is3D ? {
        name: 'Z',
        nameTextStyle: { color: '#888' },
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { textStyle: { color: '#888' } },
      } : undefined,
      xAxis: !is3D ? {
        type: 'value',
        name: viewMode === 'yz' ? 'Y' : 'X',
        nameTextStyle: { color: '#888' },
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { color: '#888' },
        splitLine: { lineStyle: { color: '#333' } },
      } : undefined,
      yAxis: !is3D ? {
        type: 'value',
        name: viewMode === 'xz' ? 'Z' : (viewMode === 'yz' ? 'Z' : 'Y'),
        nameTextStyle: { color: '#888' },
        axisLine: { lineStyle: { color: '#888' } },
        axisLabel: { color: '#888' },
        splitLine: { lineStyle: { color: '#333' } },
      } : undefined,
      series,
      backgroundColor: 'transparent',
    };
  }, [getFilteredData, viewMode, pointSize, opacity, colorMap, pointCloud.labels]);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose existing chart
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // Create new chart
    chartInstance.current = echarts.init(chartRef.current, 'dark', {
      renderer: 'canvas',
    });

    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Update chart option
  useEffect(() => {
    if (!chartInstance.current) return;

    const option = getChartOption();
    chartInstance.current.setOption(option, true);
  }, [getChartOption]);

  // Toggle class visibility
  const toggleClass = (classIndex: number) => {
    setVisibleClasses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classIndex)) {
        newSet.delete(classIndex);
      } else {
        newSet.add(classIndex);
      }
      return newSet;
    });
  };

  // Toggle all classes
  const toggleAll = () => {
    if (showAll) {
      setVisibleClasses(new Set());
    } else {
      setVisibleClasses(new Set(Array.from({ length: numClasses }, (_, i) => i)));
    }
    setShowAll(!showAll);
  };

  // Reset view
  const resetView = () => {
    if (chartInstance.current) {
      chartInstance.current.dispatchAction({
        type: 'restore',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={resetView} title="重置视图">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              <Button
                variant={viewMode === '3d' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('3d')}
                className="flex items-center gap-1"
              >
                <Box className="h-3 w-3" />
                3D
              </Button>
              <Button
                variant={viewMode === 'xy' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('xy')}
              >
                XY
              </Button>
              <Button
                variant={viewMode === 'xz' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('xz')}
              >
                XZ
              </Button>
              <Button
                variant={viewMode === 'yz' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('yz')}
              >
                YZ
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">点大小:</span>
                <div className="w-24">
                  <Slider
                    value={[pointSize]}
                    onValueChange={(value) => setPointSize(value[0])}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{pointSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">透明度:</span>
                <div className="w-24">
                  <Slider
                    value={[opacity * 100]}
                    onValueChange={(value) => setOpacity(value[0] / 100)}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{Math.round(opacity * 100)}%</span>
              </div>
              {viewMode !== '3d' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Move className="h-3 w-3" />
                  滚轮缩放
                </div>
              )}
            </div>
          </div>

          {/* Chart Container */}
          <div
            ref={chartRef}
            className="relative w-full rounded-lg overflow-hidden"
            style={{ height }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Info */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              总点数: {totalPoints.toLocaleString()} | 尺寸: {pointCloud.width} x{' '}
              {pointCloud.height}
            </span>
            <span>可见: {visibleClasses.size} / {numClasses} 类别</span>
          </div>
        </CardContent>
      </Card>

      {/* Class Legend */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              类别图例
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {showAll ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  隐藏全部
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  显示全部
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Array.from({ length: numClasses }, (_, i) => i).map((index) => {
              const label = pointCloud.labels?.find((l) => l.labelIndex === index);
              const color = colorMap.get(index) || '#888888';
              const isVisible = visibleClasses.has(index);

              return (
                <button
                  key={index}
                  onClick={() => toggleClass(index)}
                  className={`flex items-center gap-2 p-2 rounded-md text-left transition-all ${
                    isVisible ? 'bg-muted/50 hover:bg-muted' : 'bg-muted/20 opacity-50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded flex-shrink-0 border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {label?.name || label?.aliasName || `类别 ${index}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">索引: {index}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PcaPointCloudViewer;
