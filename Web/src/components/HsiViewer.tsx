import React, { useState, useEffect } from 'react';
import { getHsiRgbImageUrl, type HsiImageResponse } from '../services/hsiLoader';
import type { RgbBandConfig } from '../types/hsi';

interface HsiViewerProps {
  image: HsiImageResponse;
}

const HsiViewer: React.FC<HsiViewerProps> = ({ image }) => {
  const { height, width, bands } = image;
  
  // Initialize with default bands at 25%, 50%, 75%
  const [rgbConfig, setRgbConfig] = useState<RgbBandConfig>(() => {
    const bandCount = bands || 100;
    return {
      redBand: Math.floor(bandCount * 0.25),
      greenBand: Math.floor(bandCount * 0.5),
      blueBand: Math.floor(bandCount * 0.75)
    };
  });
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const url = getHsiRgbImageUrl(image.id, rgbConfig);
    setImageUrl(url);
    setIsLoading(true);
    setError('');
  }, [image.id, rgbConfig]);

  const handleBandChange = (channel: 'redBand' | 'greenBand' | 'blueBand', bandIndex: number) => {
    setRgbConfig(prev => ({
      ...prev,
      [channel]: bandIndex
    }));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load image');
  };

  const bandCount = bands || 0;
  const bandOptions = Array.from({ length: bandCount }, (_, i) => (
    <option key={i} value={i}>Band {i + 1}</option>
  ));

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {/* Image container */}
        <div className="flex justify-center">
          <div className="w-full overflow-auto border border-gray-200 dark:border-gray-700 rounded relative" style={{ height: '384px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                <div className="text-gray-600 dark:text-gray-400">Loading image...</div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                <div className="text-red-600 dark:text-red-400">{error}</div>
              </div>
            )}
            {imageUrl && (
              <img
                key={imageUrl}
                src={imageUrl}
                alt="HSI False Color"
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
                {width} x {height} | {bands} bands
              </div>
            )}
          </div>
        </div>
      </div>

      {bandCount > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">RGB Band Selection</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">Red Channel</label>
              <select
                value={rgbConfig.redBand}
                onChange={(e) => handleBandChange('redBand', parseInt(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-red-500 focus:outline-none"
              >
                {bandOptions}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-600 dark:text-green-400 mb-1">Green Channel</label>
              <select
                value={rgbConfig.greenBand}
                onChange={(e) => handleBandChange('greenBand', parseInt(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-green-500 focus:outline-none"
              >
                {bandOptions}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Blue Channel</label>
              <select
                value={rgbConfig.blueBand}
                onChange={(e) => handleBandChange('blueBand', parseInt(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none"
              >
                {bandOptions}
              </select>
            </div>
          </div>

          <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Composite: Band {rgbConfig.redBand + 1} (R) / Band {rgbConfig.greenBand + 1} (G) / Band {rgbConfig.blueBand + 1} (B)
          </div>
        </div>
      )}
    </div>
  );
};

export default HsiViewer;