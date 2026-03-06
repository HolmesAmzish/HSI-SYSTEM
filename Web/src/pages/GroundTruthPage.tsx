import React, { useState, useEffect, useCallback } from 'react';
import {
  getGroundTruths,
  uploadGroundTruthMat,
  deleteGroundTruth,
  getGroundTruthMaskImage,
  getStatusColor,
  getStatusLabel,
} from '@/services/groundTruthService';
import { getHsiList } from '@/services/hsiLoader';
import type { GroundTruth } from '@/types/groundTruth';
import type { HsiImage } from '@/types/hsi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';

const GroundTruthPage: React.FC = () => {
  // Data states
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [hsiImages, setHsiImages] = useState<HsiImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedHsiId, setSelectedHsiId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Preview modal state
  const [previewGt, setPreviewGt] = useState<GroundTruth | null>(null);
  const [maskImageUrl, setMaskImageUrl] = useState<string>('');
  const [isLoadingMask, setIsLoadingMask] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [gtResponse, hsiResponse] = await Promise.all([
        getGroundTruths(currentPage),
        getHsiList(),
      ]);
      setGroundTruths(gtResponse.content);
      setTotalPages(gtResponse.totalPages);
      setHsiImages(hsiResponse.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate MAT file
      if (!file.name.endsWith('.mat')) {
        setError('请选择有效的 MAT 文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedHsiId || !selectedFile) {
      setError('请选择高光谱图像和 MAT 文件');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      await uploadGroundTruthMat(parseInt(selectedHsiId), selectedFile);
      setIsUploadModalOpen(false);
      setSelectedHsiId('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('gt-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Reload data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个真值数据吗？')) return;

    setIsLoading(true);
    try {
      await deleteGroundTruth(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setIsLoading(false);
    }
  };

  const handlePreview = async (gt: GroundTruth) => {
    setPreviewGt(gt);
    setIsLoadingMask(true);
    setError('');
    try {
      const url = await getGroundTruthMaskImage(gt.id);
      setMaskImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载掩码失败');
    } finally {
      setIsLoadingMask(false);
    }
  };

  const closePreview = () => {
    setPreviewGt(null);
    if (maskImageUrl) {
      URL.revokeObjectURL(maskImageUrl);
      setMaskImageUrl('');
    }
  };

  // Filter HSI images that don't have ground truth yet
  const availableHsiImages = hsiImages.filter(
    (hsi) => !groundTruths.some((gt) => gt.image?.id === hsi.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">真值数据管理</h2>
          <p className="text-sm text-muted-foreground">
            上传和管理高光谱图像的分割真值掩码
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上传真值
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">使用说明</p>
              <p className="text-xs text-muted-foreground">
                上传包含分割真值标签的 MAT 文件。系统将处理该文件并将栅格数据存储到 PostgreSQL 中。
                处理完成后，您可以在高光谱图像上可视化查看掩码叠加效果。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && groundTruths.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">暂无真值数据</p>
            <p className="text-sm text-muted-foreground mb-4">
              上传您的第一个真值 MAT 文件开始使用
            </p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              上传真值
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ground Truth List */}
      {!isLoading && groundTruths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groundTruths.map((gt) => (
            <Card key={gt.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{gt.filename}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {gt.image?.filename || '未知高光谱图像'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(gt.status)}>
                    {getStatusLabel(gt.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {gt.numClasses} 个类别
                    </span>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(gt)}
                      disabled={gt.status !== 'COMPLETED'}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(gt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            第 {currentPage + 1} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            下一页
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上传真值数据</DialogTitle>
            <DialogDescription>
              选择高光谱图像并上传对应的真值 MAT 文件。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* HSI Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">选择高光谱图像</label>
              <Select value={selectedHsiId} onValueChange={setSelectedHsiId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择高光谱图像..." />
                </SelectTrigger>
                <SelectContent>
                  {availableHsiImages.length === 0 ? (
                    <SelectItem value="none" disabled>
                      没有可用的高光谱图像
                    </SelectItem>
                  ) : (
                    availableHsiImages.map((hsi) => (
                      <SelectItem key={hsi.id} value={hsi.id.toString()}>
                        {hsi.filename}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableHsiImages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  所有高光谱图像都已有真值数据，请先删除现有的真值。
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">真值 MAT 文件</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="gt-file-input"
                  type="file"
                  accept=".mat"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="gt-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : '点击选择 MAT 文件'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    支持包含分割标签的 .mat 文件
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedHsiId('');
                setSelectedFile(null);
                setError('');
              }}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedHsiId || !selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewGt} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>真值预览</DialogTitle>
            <DialogDescription>
              {previewGt?.filename} - {previewGt?.numClasses} 个类别
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center min-h-[400px] bg-muted/30 rounded-lg overflow-hidden">
            {isLoadingMask ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">加载掩码中...</span>
              </div>
            ) : maskImageUrl ? (
              <img
                src={maskImageUrl}
                alt="真值掩码"
                className="max-w-full max-h-[600px] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
                <span>加载掩码图像失败</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePreview}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroundTruthPage;
