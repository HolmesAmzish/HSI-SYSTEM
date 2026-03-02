import React, { useState, useMemo, useCallback } from 'react';
import type { HsiData, RgbBandConfig } from '../types/hsi';

interface HsiViewerProps {
  hsiData: HsiData;
}

const HsiViewer: React.FC<HsiViewerProps> = ({ hsiData }) => {
  const { cube, height, width, bands } = hsiData;

  const [rgbConfig, setRgbConfig] = useState<RgbBandConfig>({
    redBand: Math.min(30, bands - 1),
    greenBand: Math.min(20, bands - 1),
    blueBand: Math.min(10, bands - 1)
  });

  const normalizeBand = useCallback((
    bandIndex: number,
    height: number,
    width: number,
    cube: Float32Array,
    bands: number
  ): Uint8ClampedArray => {
    const bandData = new Float32Array(height * width);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * bands + bandIndex;
        bandData[y * width + x] = cube[idx];
      }
    }

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < bandData.length; i++) {
      if (bandData[i] < min) min = bandData[i];
      if (bandData[i] > max) max = bandData[i];
    }

    const range = max - min;
    const normalized = new Uint8ClampedArray(height * width);
    for (let i = 0; i < bandData.length; i++) {
      normalized[i] = range > 0 
        ? Math.round(((bandData[i] - min) / range) * 255) 
        : 0;
    }

    return normalized;
  }, []);

  const imageData = useMemo(() => {
    const redData = normalizeBand(rgbConfig.redBand, height, width, cube, bands);
    const greenData = normalizeBand(rgbConfig.greenBand, height, width, cube, bands);
    const blueData = normalizeBand(rgbConfig.blueBand, height, width, cube, bands);

    const data = new Uint8ClampedArray(height * width * 4);
    for (let i = 0; i < height * width; i++) {
      data[i * 4] = redData[i];
      data[i * 4 + 1] = greenData[i];
      data[i * 4 + 2] = blueData[i];
      data[i * 4 + 3] = 255;
    }

    return new ImageData(data, width, height);
  }, [cube, height, width, bands, rgbConfig, normalizeBand]);

  const handleBandChange = (channel: 'red' | 'green' | 'blue', bandIndex: number) => {
    setRgbConfig(prev => ({
      ...prev,
      [channel === 'red' ? 'redBand' : channel === 'green' ? 'greenBand' : 'blueBand']: bandIndex
    }));
  };

  const bandOptions = Array.from({ length: bands }, (_, i) => (
    <option key={i} value={i}>Band {i + 1}</option>
  ));

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Image container with internal scroll */}
        <div className="flex justify-center">
          <div className="overflow-auto max-h-80 min-h-96 border border-gray-200 rounded">
            <div className="relative">
              <HsiImageCanvas imageData={imageData} width={width} height={height} />
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {width} x {height} | {bands} bands
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">RGB Band Selection</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-red-600 mb-1">Red Channel</label>
            <select
              value={rgbConfig.redBand}
              onChange={(e) => handleBandChange('red', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-red-500 focus:outline-none"
            >
              {bandOptions}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-600 mb-1">Green Channel</label>
            <select
              value={rgbConfig.greenBand}
              onChange={(e) => handleBandChange('green', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              {bandOptions}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-600 mb-1">Blue Channel</label>
            <select
              value={rgbConfig.blueBand}
              onChange={(e) => handleBandChange('blue', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {bandOptions}
            </select>
          </div>
        </div>

        <div className="mt-3 text-center text-sm text-gray-500">
          Composite: Band {rgbConfig.redBand + 1} (R) / Band {rgbConfig.greenBand + 1} (G) / Band {rgbConfig.blueBand + 1} (B)
        </div>
      </div>
    </div>
  );
};

const HsiImageCanvas: React.FC<{ imageData: ImageData; width: number; height: number }> = ({
  imageData,
  width,
  height
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offscreenCtx = offscreen.getContext('2d');
    if (!offscreenCtx) return;

    offscreenCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  }, [imageData, width, height]);

  // Calculate canvas size maintaining aspect ratio
  // min-height-96 = 384px (h-96)
  const minHeight = 384; // h-96 in tailwind
  const aspectRatio = width / height;
  
  let canvasWidth: number;
  let canvasHeight: number;
  
  // Scale to fit minimum height while maintaining aspect ratio
  if (height < minHeight) {
    // Scale up to minimum height
    canvasHeight = minHeight;
    canvasWidth = Math.round(minHeight * aspectRatio);
  } else {
    // Use original dimensions (container will handle scroll)
    canvasHeight = height;
    canvasWidth = width;
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default HsiViewer;
