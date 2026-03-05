import React, { useState, useRef } from 'react';
import { type Dataset } from '@/services/datasetService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Plus, FileUp } from 'lucide-react';

interface HsiFileUploadProps {
  onFileUploaded: (file: File, datasetId: number) => Promise<void>;
  datasets: Dataset[];
  selectedDatasetId: number | null;
  onDatasetChange: (datasetId: number) => void;
  onCreateDataset: () => void;
}

const HsiFileUpload: React.FC<HsiFileUploadProps> = ({ 
  onFileUploaded, 
  datasets, 
  selectedDatasetId, 
  onDatasetChange,
  onCreateDataset 
}) => {
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
      setError('请先选择MAT文件');
      return;
    }
    
    if (!selectedDatasetId) {
      setError('请先选择或创建数据集');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      await onFileUploaded(selectedFile, selectedDatasetId);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
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
      setError('请拖放有效的.mat文件');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">上传MAT文件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          上传包含高光谱图像数据的MATLAB (.mat)文件。
          服务器将处理并转换为二进制格式。
        </p>

        {/* Dataset Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            选择数据集
          </label>
          <div className="flex gap-2">
            <select
              value={selectedDatasetId || ''}
              onChange={(e) => onDatasetChange(Number(e.target.value))}
              disabled={isUploading}
              className="flex-1 border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- 选择数据集 --</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={onCreateDataset}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-1" />
              新建
            </Button>
          </div>
        </div>

        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isUploading 
              ? 'border-border bg-muted cursor-not-allowed'
              : selectedFile 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                : 'border-input hover:border-primary hover:bg-accent'
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
            <div className="text-green-600 dark:text-green-400">
              <FileUp className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <p>拖放MAT文件到此处或点击浏览</p>
              <p className="text-sm mt-1">支持MATLAB .mat格式</p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUploadFile}
          disabled={!selectedFile || !selectedDatasetId || isUploading}
          className="w-full"
        >
          {isUploading ? '上传中...' : '上传MAT文件'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HsiFileUpload;