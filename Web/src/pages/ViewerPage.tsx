import React, { useState, useEffect } from 'react';
import { 
  getHsiList, 
  uploadMatFile,
  type HsiImageResponse 
} from '../services/hsiLoader';
import HsiFileUpload from '../components/HsiFileUpload';
import HsiViewer from '../components/HsiViewer';

const ViewerPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<HsiImageResponse | null>(null);
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

  const handleMatUpload = async (file: File) => {
    setIsLoading(true);
    setError('');

    try {
      await uploadMatFile(file);
      // Refresh the server images list after successful upload
      await loadServerImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload MAT file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerImageSelect = (image: HsiImageResponse) => {
    if (image.status === 'COMPLETED') {
      setSelectedImage(image);
      setError('');
    } else {
      setError('Image is not ready for viewing. Status: ' + image.status);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Processing...</div>
        </div>
      )}

      {!selectedImage && !isLoading && (
        <>
          {/* Server Images */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Server Images</h2>
              <button
                onClick={loadServerImages}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
              >
                Refresh
              </button>
            </div>
            {loadingList ? (
              <div className="text-gray-500 dark:text-gray-400">Loading image list...</div>
            ) : serverImages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">No images available on server</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serverImages.map((img) => (
                  <div
                    key={img.id}
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-gray-800 ${
                      img.status === 'COMPLETED' 
                        ? 'hover:border-blue-300 dark:hover:border-blue-600' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => handleServerImageSelect(img)}
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">{img.filename}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {img.width && img.height ? `${img.width} x ${img.height}` : 'Dimensions unknown'}
                      {img.bands ? ` | ${img.bands} bands` : ''}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {img.fileSize ? `${(img.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                      img.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      img.status === 'PROCESSING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      img.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {img.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAT File Upload */}
          <HsiFileUpload onFileUploaded={handleMatUpload} />
        </>
      )}

      {selectedImage && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{selectedImage.filename}</h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Back to List
            </button>
          </div>
          <HsiViewer image={selectedImage} />
        </div>
      )}
    </div>
  );
};

export default ViewerPage;