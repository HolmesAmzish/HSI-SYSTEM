import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHsiList, type HsiImage, ProcessStatus } from '@/services/hsiLoader';
import HsiViewer from '@/components/HsiViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ImageOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * HSI Viewer Page - Pure renderer for hyperspectral images
 * Uses URL parameter ?id=xxx to determine which HSI to display
 * Management functions (upload, edit, delete) are in HsiManagePage
 */
const ViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [images, setImages] = useState<HsiImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get HSI ID from URL
  const hsiIdParam = searchParams.get('id');
  const selectedImageId = hsiIdParam ? parseInt(hsiIdParam, 10) : null;

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getHsiList(0, 100);
      setImages(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载图像失败');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedImage = images.find(img => img.id === selectedImageId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No ID specified
  if (!selectedImageId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">未选择图像</p>
          <p className="text-sm text-muted-foreground mb-4">
            请从HSI管理页面选择图像或在URL中指定ID
          </p>
          <Button onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            前往HSI管理
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Image not found
  if (!selectedImage) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">图像未找到</p>
          <p className="text-sm text-muted-foreground mb-4">
            ID为 {selectedImageId} 的HSI不存在
          </p>
          <Button onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            前往HSI管理
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Image not processed yet
  if (selectedImage.status !== ProcessStatus.COMPLETED) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground mb-2">图像处理中</p>
          <p className="text-sm text-muted-foreground mb-4">
            状态：{selectedImage.status}
          </p>
          <Button onClick={() => navigate('/hsi-manage')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            前往HSI管理
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render the image viewer
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{selectedImage.filename}</h2>
          <p className="text-sm text-muted-foreground">
            ID: {selectedImage.id} | 数据集: {selectedImage.dataset?.name || '未知'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/hsi-manage')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回管理
        </Button>
      </div>
      
      <HsiViewer image={selectedImage} />
    </div>
  );
};

export default ViewerPage;