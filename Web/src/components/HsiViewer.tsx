import React, { useState, useEffect } from 'react';
import { getHsiRgbImageUrl, calculateDefaultRgbBands, type HsiImage } from '@/services/hsiLoader';
import type { RgbBandConfig } from '@/types/hsi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          {/* Image container */}
          <div className="flex justify-center">
            <div className="w-full overflow-auto border border-border rounded relative" style={{ height: '384px' }}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-destructive">{error}</div>
                </div>
              )}
              {imageUrl && (
                <img
                  key={imageUrl}
                  src={imageUrl}
                  alt="HSI假彩色图像"
                  className="block"
                  style={{ 
                    display: isLoading ? 'none' : 'block',
                    minHeight: '80px',
                    height: '384px',
                    width: 'auto',
                    maxWidth: 'none'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              {!isLoading && !error && width && height && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {width} x {height} | {bands} 波段
                </div>
              )}
            </div>
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