import React, { useState, useEffect } from 'react';
import type { HsiData } from '../types/hsi';
import { 
  getHsiList, 
  loadHsiFromServer, 
  loadFromLocalFile,
  type HsiImageResponse 
} from '../services/hsiLoader';
import HsiFileUpload from '../components/HsiFileUpload';
import HsiViewer from '../components/HsiViewer';

const ViewerPage: React.FC = () => {
  const [hsiData, setHsiData] = useState<HsiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [serverImages, setServerImages] = useState<HsiImageResponse[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    loadServerImages();
  }, []);

  const loadServerImages = async () => {
    setLoadingList(true);
    try {
      const response = await getHsiList(0, 50);
      setServerImages(response.content);
    } catch (err) {
      console.error('Failed to load server images:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleLocalFileLoaded = async (file: File) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await loadFromLocalFile(file);
      setHsiData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HSI data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerImageLoad = async (id: number) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await loadHsiFromServer(id);
      setHsiData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HSI data from server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setHsiData(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading HSI data...</div>
        </div>
      )}

      {!hsiData && !isLoading && (
        <>
          {/* Server Images */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Server Images</h2>
            {loadingList ? (
              <div className="text-gray-500">Loading image list...</div>
            ) : serverImages.length === 0 ? (
              <div className="text-gray-500">No images available on server</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serverImages.map((img) => (
                  <div
                    key={img.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleServerImageLoad(img.id)}
                  >
                    <h3 className="font-medium text-gray-800">{img.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {img.width} x {img.height} | {img.bands} bands
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(img.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local File Upload */}
          <HsiFileUpload onFileLoaded={handleLocalFileLoaded} />
        </>
      )}

      {hsiData && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Load New Image
            </button>
          </div>
          <HsiViewer hsiData={hsiData} />
        </div>
      )}
    </div>
  );
};

export default ViewerPage;
