/**
 * Hyperspectral Analysis Page
 * 
 * Provides advanced analysis tools for hyperspectral images:
 * - PCA 3D point cloud visualization
 * - Spectral statistics
 * - Ground truth comparison
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHsiList, type HsiImage, ProcessStatus } from '@/services/hsiLoader';
import { getGroundTruths } from '@/services/groundTruthService';
import type { GroundTruth, GroundTruthPageResponse } from '@/types/groundTruth';
import { triggerPcaTask, getPcaPointCloud, checkPcaExists } from '@/services/pcaService';
import type { PcaPointCloud } from '@/types/pca';
import PcaPointCloudViewer from '@/components/PcaPointCloudViewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Box,
  Play,
  RefreshCw,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HyperspectralAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const hsiIdParam = searchParams.get('id');
  const selectedHsiId = hsiIdParam ? parseInt(hsiIdParam, 10) : null;

  // State
  const [images, setImages] = useState<HsiImage[]>([]);
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // PCA state
  const [pointCloud, setPointCloud] = useState<PcaPointCloud | null>(null);
  const [isLoadingPca, setIsLoadingPca] = useState(false);
  const [isTriggeringPca, setIsTriggeringPca] = useState(false);
  const [selectedGtId, setSelectedGtId] = useState<string>('');
  const [pcaExists, setPcaExists] = useState<boolean | null>(null);

  // Load HSI list and ground truths
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load HSI list
      const hsiData = await getHsiList(0, 100);
      setImages(hsiData.content);
      
      // Load ground truths
      const gtData = await getGroundTruths(0, 100);
      setGroundTruths(gtData.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Check PCA existence and load when HSI is selected
  useEffect(() => {
    if (selectedHsiId) {
      checkAndLoadPca();
    } else {
      setPointCloud(null);
      setPcaExists(null);
    }
  }, [selectedHsiId]);

  const checkAndLoadPca = async () => {
    if (!selectedHsiId) return;
    
    setIsLoadingPca(true);
    try {
      // Check if PCA exists
      const exists = await checkPcaExists(selectedHsiId);
      setPcaExists(exists);
      
      if (exists) {
        // Load PCA data
        const gtId = selectedGtId ? parseInt(selectedGtId, 10) : undefined;
        const data = await getPcaPointCloud(selectedHsiId, gtId);
        setPointCloud(data);
      }
    } catch (err) {
      console.error('Failed to check/load PCA:', err);
      setPcaExists(false);
    } finally {
      setIsLoadingPca(false);
    }
  };

  const handleTriggerPca = async () => {
    if (!selectedHsiId) return;
    
    setIsTriggeringPca(true);
    try {
      const response = await triggerPcaTask(selectedHsiId);
      alert(`PCA任务已触发: ${response.taskId}\n请等待处理完成后刷新页面。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '触发PCA任务失败');
    } finally {
      setIsTriggeringPca(false);
    }
  };

  const handleRefreshPca = async () => {
    await checkAndLoadPca();
  };

  const handleGtChange = async (value: string) => {
    setSelectedGtId(value);
    if (selectedHsiId && pcaExists) {
      setIsLoadingPca(true);
      try {
        const gtId = value ? parseInt(value, 10) : undefined;
        const data = await getPcaPointCloud(selectedHsiId, gtId);
        setPointCloud(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载PCA数据失败');
      } finally {
        setIsLoadingPca(false);
      }
    }
  };

  const selectedImage = images.find(img => img.id === selectedHsiId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">加载数据中...</p>
      </div>
    );
  }

  // No HSI selected
  if (!selectedHsiId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">高光谱分析</h2>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">未选择高光谱图像</p>
            <p className="text-sm text-muted-foreground mb-4">
              请从HSI管理页面选择图像或在URL中指定ID
            </p>
            <Button onClick={() => navigate('/hsi-manage')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              前往HSI管理
            </Button>
          </CardContent>
        </Card>

        {/* Quick select */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">快速选择</CardTitle>
            <CardDescription>选择要分析的高光谱图像</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images
                .filter(img => img.status === ProcessStatus.COMPLETED)
                .slice(0, 8)
                .map((image) => (
                  <Button
                    key={image.id}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => navigate(`/analysis?id=${image.id}`)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="font-medium truncate">{image.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {image.id}
                      </p>
                    </div>
                  </Button>
                ))}
            </div>
            {images.filter(img => img.status === ProcessStatus.COMPLETED).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                没有可用的已处理图像
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Image not found
  if (!selectedImage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">高光谱分析</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ID为 {selectedHsiId} 的HSI不存在</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">高光谱分析</h2>
            <p className="text-sm text-muted-foreground">
              {selectedImage.filename} | ID: {selectedImage.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={pcaExists ? 'default' : 'secondary'}>
            {pcaExists ? 'PCA已就绪' : 'PCA未生成'}
          </Badge>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            分析控制
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Ground Truth Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">关联真值:</span>
              <Select value={selectedGtId} onValueChange={handleGtChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择真值（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {groundTruths
                    .filter(gt => gt.image?.dataset?.id === selectedImage.dataset?.id)
                    .map((gt) => (
                      <SelectItem key={gt.id} value={gt.id.toString()}>
                        {gt.filename} (ID: {gt.id})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!pcaExists && (
                <Button
                  onClick={handleTriggerPca}
                  disabled={isTriggeringPca}
                >
                  {isTriggeringPca ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  生成PCA
                </Button>
              )}
              
              {pcaExists && (
                <Button
                  variant="outline"
                  onClick={handleRefreshPca}
                  disabled={isLoadingPca}
                >
                  {isLoadingPca ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  刷新
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PCA 3D Visualization */}
      {isLoadingPca ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[500px]">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">加载PCA数据...</p>
          </CardContent>
        </Card>
      ) : pointCloud ? (
        <PcaPointCloudViewer pointCloud={pointCloud} height="600px" />
      ) : pcaExists === false ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
            <Box className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">PCA数据未生成</p>
            <p className="text-sm text-muted-foreground mb-4">
              点击"生成PCA"按钮开始处理
            </p>
            <Button onClick={handleTriggerPca} disabled={isTriggeringPca}>
              {isTriggeringPca ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              生成PCA
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default HyperspectralAnalysisPage;
