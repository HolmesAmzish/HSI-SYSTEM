/**
 * Ground Truth Viewer Page
 * Unified UI with ViewerPage
 * Displays GT mask preview and spectral statistics
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getGroundTruthMaskImage,
  getGroundTruthMaskMatrix,
  getGroundTruthStats,
  buildColorMap,
  generateRandomColor,
} from '@/services/groundTruthService';
import type { GroundTruthMatrix, GroundTruthStats } from '@/types/groundTruth';
import SpectralStatsChart from '@/components/SpectralStatsChart';
import ImageViewer from '@/components/ImageViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ImageOff,
  ArrowLeft,
  Layers,
  Palette,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroundTruthViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const gtIdParam = searchParams.get('id');
  const gtId = gtIdParam ? parseInt(gtIdParam, 10) : null;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Mask data
  const [maskMatrix, setMaskMatrix] = useState<GroundTruthMatrix | null>(null);
  const [maskImageUrl, setMaskImageUrl] = useState<string>('');
  const [colorMap, setColorMap] = useState<Map<number, string>>(new Map());
  
  // Spectral stats
  const [spectralStats, setSpectralStats] = useState<GroundTruthStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (gtId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [gtId]);

  const loadData = async () => {
    if (!gtId) return;

    setIsLoading(true);
    setError('');

    try {
      // Load mask matrix and image
      const matrixData = await getGroundTruthMaskMatrix(gtId);
      setMaskMatrix(matrixData);
      
      // Build color map
      const colors = buildColorMap(matrixData.labelMap, matrixData.numClasses);
      setColorMap(colors);
      
      // Get rendered image
      const url = await getGroundTruthMaskImage(gtId);
      setMaskImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载真值数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpectralStats = async () => {
    if (!gtId || spectralStats) return;

    setIsLoadingStats(true);
    try {
      const stats = await getGroundTruthStats(gtId);
      setSpectralStats(stats);
    } catch (err) {
      console.error('Failed to load spectral stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load spectral stats after mask is loaded
  useEffect(() => {
    if (!isLoading && maskMatrix && !spectralStats) {
      loadSpectralStats();
    }
  }, [isLoading, maskMatrix]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (maskImageUrl) {
        URL.revokeObjectURL(maskImageUrl);
      }
    };
  }, [maskImageUrl]);

  // Get label info for display
  const getLabelInfo = (index: number): { name: string; color: string; hasDefinition: boolean } => {
    const label = maskMatrix?.labelMap.find(l => l.labelIndex === index);
    const color = colorMap.get(index) || generateRandomColor(index);
    return {
      name: label?.name || label?.aliasName || `类别 ${index}`,
      color,
      hasDefinition: !!label,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No ID specified
  if (!gtId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">未选择真值数据</p>
          <p className="text-sm text-muted-foreground mb-4">
            请从真值管理页面选择数据或在URL中指定ID
          </p>
          <Button onClick={() => navigate('/ground-truth')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            前往真值管理
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Data not found
  if (!maskMatrix) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">真值数据未找到</p>
          <p className="text-sm text-muted-foreground mb-4">
            ID为 {gtId} 的真值数据不存在
          </p>
          <Button onClick={() => navigate('/ground-truth')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            前往真值管理
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">真值查看</h2>
          <p className="text-sm text-muted-foreground">
            ID: {gtId} | 类别数: {maskMatrix.numClasses}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/ground-truth')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回管理
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Mask Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Image */}
              <div className="lg:col-span-3">
                {maskImageUrl ? (
                  <ImageViewer
                    src={maskImageUrl}
                    alt="真值掩码"
                    minHeight="400px"
                    maxHeight="500px"
                  />
                ) : (
                  <div className="flex justify-center items-center min-h-[400px] bg-muted/30 rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="h-12 w-12" />
                      <span>加载掩码图像失败</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4" />
                  <h3 className="text-sm font-medium">类别图例</h3>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {Array.from({ length: maskMatrix.numClasses }, (_, i) => i).map((index) => {
                    const info = getLabelInfo(index);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                      >
                        <div
                          className="w-4 h-4 rounded border border-border flex-shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {info.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            索引: {index}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spectral Statistics */}
        {isLoadingStats ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">加载光谱统计数据...</p>
            </CardContent>
          </Card>
        ) : spectralStats ? (
          <SpectralStatsChart
            stats={spectralStats}
            height="400px"
          />
        ) : null}
      </div>
    </div>
  );
};

export default GroundTruthViewerPage;
