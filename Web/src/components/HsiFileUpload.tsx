import React, { useState, useRef } from 'react';

interface HsiFileUploadProps {
  onFileUploaded: (file: File) => Promise<void>;
}

const HsiFileUpload: React.FC<HsiFileUploadProps> = ({ onFileUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a MAT file first');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      await onFileUploaded(selectedFile);
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.mat')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please drop a valid .mat file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Upload MAT File</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Upload a MATLAB (.mat) file containing hyperspectral image data. 
        The server will process it and convert to binary format.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isUploading 
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-not-allowed'
            : selectedFile 
              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mat"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        {selectedFile ? (
          <div className="text-green-700 dark:text-green-400">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            <p>Drop MAT file here or click to browse</p>
            <p className="text-sm mt-1">Supports MATLAB .mat format</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleUploadFile}
        disabled={!selectedFile || isUploading}
        className={`
          mt-4 w-full px-6 py-3 rounded-lg font-medium transition-colors
          ${selectedFile && !isUploading
            ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isUploading ? 'Uploading...' : 'Upload MAT File'}
      </button>
    </div>
  );
};

export default HsiFileUpload;