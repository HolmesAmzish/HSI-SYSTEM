import React, { useState, useRef } from 'react';

interface HsiFileUploadProps {
  onFileLoaded: (file: File) => Promise<void>;
}

interface DetectedDimensions {
  height: number;
  width: number;
  bands: number;
  totalValues: number;
}

const HsiFileUpload: React.FC<HsiFileUploadProps> = ({ onFileLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [detectedDims, setDetectedDims] = useState<DetectedDimensions | null>(null);

  const detectDimensions = (fileSize: number): DetectedDimensions => {
    const totalValues = fileSize / 4; // float32 = 4 bytes
    
    const commonConfigs = [
      { height: 150, width: 150, bands: 68 },
      { height: 610, width: 340, bands: 103 },
      { height: 145, width: 145, bands: 200 },
      { height: 256, width: 256, bands: 160 },
      { height: 400, width: 400, bands: 150 },
    ];
    
    for (const config of commonConfigs) {
      if (config.height * config.width * config.bands === totalValues) {
        return { ...config, totalValues };
      }
    }
    
    const estimatedSize = Math.round(Math.cbrt(totalValues));
    const bands = Math.round(totalValues / (estimatedSize * estimatedSize));
    return { height: estimatedSize, width: estimatedSize, bands, totalValues };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const dims = detectDimensions(file.size);
      setDetectedDims(dims);
      setError('');
    }
  };

  const handleLoadFile = () => {
    if (!selectedFile) {
      setError('Please select a BIN file first');
      return;
    }
    onFileLoaded(selectedFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.bin')) {
      setSelectedFile(file);
      const dims = detectDimensions(file.size);
      setDetectedDims(dims);
      setError('');
    } else {
      setError('Please drop a valid .bin file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Load HSI Data</h2>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${selectedFile 
            ? 'border-green-400 bg-green-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".bin"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="text-green-700">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="text-gray-500">
            <p>Drop BIN file here or click to browse</p>
            <p className="text-sm mt-1">Supports float32 binary format</p>
          </div>
        )}
      </div>

      {detectedDims && selectedFile && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Detected Dimensions</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">{detectedDims.height}</div>
              <div className="text-xs text-gray-500">Height</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{detectedDims.width}</div>
              <div className="text-xs text-gray-500">Width</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">{detectedDims.bands}</div>
              <div className="text-xs text-gray-500">Bands</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">{detectedDims.totalValues.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Values</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleLoadFile}
        disabled={!selectedFile}
        className={`
          mt-4 w-full px-6 py-3 rounded-lg font-medium transition-colors
          ${selectedFile 
            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        Load HSI Data
      </button>
    </div>
  );
};

export default HsiFileUpload;
