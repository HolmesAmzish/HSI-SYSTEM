/**
 * Ground Truth File Upload Component
 * Unified UI with HsiFileUpload
 */

import React, { useState, useRef } from 'react';
import type { HsiImage } from '@/types/hsi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileUp, ImageIcon } from 'lucide-react';

interface GtFileUploadProps {
  onFileUploaded: (file: File, hsiId: number) => Promise<void>;
  hsiImages: HsiImage[];
  availableHsiImages: HsiImage[];
}

const GtFileUpload: React.FC<GtFileUploadProps> = ({ 
  onFileUploaded, 
  hsiImages,
  availableHsiImages 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHsiId, setSelectedHsiId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.mat')) {
        setError('请选择有效的 MAT 文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError('请先选择MAT文件');
      return;
    }
    
    if (!selectedHsiId) {
      setError('请先选择高光谱图像');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      await onFileUploaded(selectedFile, parseInt(selectedHsiId));
      setSelectedFile(null);
      setSelectedHsiId('');
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
        <CardTitle className="text-lg">上传真值数据</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          上传包含分割真值标签的MATLAB (.mat)文件。
          系统将处理该文件并将数据存储到数据库中。
        </p>

        {/* HSI Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            选择高光谱图像
          </label>
          <select
            value={selectedHsiId}
            onChange={(e) => setSelectedHsiId(e.target.value)}
            disabled={isUploading}
            className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">-- 选择高光谱图像 --</option>
            {availableHsiImages.map((hsi) => (
              <option key={hsi.id} value={hsi.id.toString()}>
                {hsi.filename}
              </option>
            ))}
          </select>
          {availableHsiImages.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              所有高光谱图像都已有真值数据，请先删除现有的真值。
            </p>
          )}
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
              <p className="text-sm mt-1">支持包含分割标签的 .mat 文件</p>
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
          disabled={!selectedFile || !selectedHsiId || isUploading}
          className="w-full"
        >
          {isUploading ? '上传中...' : '上传真值文件'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GtFileUpload;
