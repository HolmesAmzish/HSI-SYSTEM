/**
 * HSI Viewer Component
 * Displays hyperspectral images with RGB band selection
 * Provides zoom, rotate, and pan functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getHsiRgbImageUrl, calculateDefaultRgbBands, type HsiImage } from '@/services/hsiLoader';
import type { RgbBandConfig } from '@/types/hsi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Move,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HsiViewerProps {
  image: HsiImage;
}

const HsiViewer: React.FC<HsiViewerProps> = ({ image }) => {
  // Get dimensions from dataset (new entity structure)
  const height = image.dataset?.height ?? null;
  const width = image.dataset?.width ?? null;
  const bands = image.dataset?.bands ?? null;
  
  // Initialize with default bands from dataset or 25%, 50%, 75%
  const [rgbConfig, setRgbConfig] = useState<RgbBandConfig>(() => {
    if (image.dataset) {
      return calculateDefaultRgbBands(image.dataset);
    }
    const bandCount = bands || 100;
    return {
      redBand: Math.floor(bandCount * 0.25),
      greenBand: Math.floor(bandCount * 0.5),
      blueBand: Math.floor(bandCount * 0.75)
    };
  });
  
  // Pending config for slider changes (not applied until confirmed)
  const [pendingConfig, setPendingConfig] = useState<RgbBandConfig>(rgbConfig);
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Image viewer state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image when rgbConfig changes (confirmed)
  useEffect(() => {
    if (!image.dataset) {
      setError('无数据集信息');
      return;
    }
    const url = getHsiRgbImageUrl(image.id, image.dataset, rgbConfig);
    setImageUrl(url);
    setIsLoading(true);
    setError('');
  }, [image.id, image.dataset, rgbConfig]);

  // Sync pending config when image changes
  useEffect(() => {
    if (image.dataset) {
      const newConfig = calculateDefaultRgbBands(image.dataset);
      setRgbConfig(newConfig);
      setPendingConfig(newConfig);
    }
    setHasChanges(false);
    // Reset viewer state when image changes
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [image.id, image.dataset]);

  const handleBandChange = (channel: 'redBand' | 'greenBand' | 'blueBand', value: number[]) => {
    setPendingConfig(prev => {
      const newConfig = {
        ...prev,
        [channel]: value[0]
      };
      // Check if different from current config
      setHasChanges(
        newConfig.redBand !== rgbConfig.redBand ||
        newConfig.greenBand !== rgbConfig.greenBand ||
        newConfig.blueBand !== rgbConfig.blueBand
      );
      return newConfig;
    });
  };

  const handleApplyConfig = () => {
    setRgbConfig(pendingConfig);
    setHasChanges(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('图像加载失败');
  };

  const bandCount = bands || 0;

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomSliderChange = useCallback((value: number[]) => {
    setScale(value[0]);
  }, []);

  // Rotation controls
  const handleRotateCW = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleRotateCCW = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Fit to container
  const handleFit = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.25), 5));
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-lg">
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                title="缩小"
                disabled={scale <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="w-24">
                <Slider
                  value={[scale]}
                  onValueChange={handleZoomSliderChange}
                  min={0.25}
                  max={5}
                  step={0.25}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                title="放大"
                disabled={scale >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Rotation controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotateCCW}
                title="逆时针旋转"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotateCW}
                title="顺时针旋转"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Other controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFit}
                title="适应窗口"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="重置"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image container */}
          <div
            ref={containerRef}
            className={cn(
              'relative overflow-hidden border border-border rounded-lg bg-muted/30',
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{ height: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
                <div className="text-destructive">{error}</div>
              </div>
            )}
            
            {/* Drag hint */}
            {!isLoading && !error && scale === 1 && rotation === 0 && position.x === 0 && position.y === 0 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
                <Move className="h-3 w-3" />
                拖拽移动 · 滚轮缩放
              </div>
            )}

            {/* Image with transform */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {imageUrl && (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="HSI假彩色图像"
                  className="max-w-full max-h-full object-contain select-none"
                  style={{ 
                    display: isLoading ? 'none' : 'block',
                    minHeight: '80px',
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  draggable={false}
                />
              )}
            </div>

            {/* Image info overlay */}
            {!isLoading && !error && width && height && (
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm z-10">
                {width} x {height} | {bands} 波段
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {bandCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">RGB波段选择</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Three sliders in a row */}
            <div className="grid grid-cols-3 gap-6">
              {/* Red Channel Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">红通道</label>
                  <span className="text-sm text-muted-foreground">
                    {pendingConfig.redBand + 1}
                  </span>
                </div>
                <Slider
                  value={[pendingConfig.redBand]}
                  onValueChange={(value) => handleBandChange('redBand', value)}
                  min={0}
                  max={bandCount - 1}
                  step={1}
                />
              </div>

              {/* Green Channel Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">绿通道</label>
                  <span className="text-sm text-muted-foreground">
                    {pendingConfig.greenBand + 1}
                  </span>
                </div>
                <Slider
                  value={[pendingConfig.greenBand]}
                  onValueChange={(value) => handleBandChange('greenBand', value)}
                  min={0}
                  max={bandCount - 1}
                  step={1}
                />
              </div>

              {/* Blue Channel Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">蓝通道</label>
                  <span className="text-sm text-muted-foreground">
                    {pendingConfig.blueBand + 1}
                  </span>
                </div>
                <Slider
                  value={[pendingConfig.blueBand]}
                  onValueChange={(value) => handleBandChange('blueBand', value)}
                  min={0}
                  max={bandCount - 1}
                  step={1}
                />
              </div>
            </div>

            {/* Action buttons and info */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                合成：波段 {pendingConfig.redBand + 1} (R) / 波段 {pendingConfig.greenBand + 1} (G) / 波段 {pendingConfig.blueBand + 1} (B)
              </span>
              <Button
                onClick={handleApplyConfig}
                disabled={!hasChanges}
                size="sm"
              >
                应用
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HsiViewer;