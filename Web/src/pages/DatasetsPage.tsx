import React, { useState, useEffect } from 'react';
import {
  getDatasets,
  createDataset,
  updateDataset,
  deleteDataset,
  type Dataset,
  type DatasetFormData
} from '@/services/datasetService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Info, Layers, Palette } from 'lucide-react';

const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [formData, setFormData] = useState<DatasetFormData>({
    name: '',
    description: '',
    minBand: null,
    maxBand: null,
    defaultRed: null,
    defaultGreen: null,
    defaultBlue: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据集失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingDataset(null);
    setFormData({
      name: '',
      description: '',
      minBand: null,
      maxBand: null,
      defaultRed: null,
      defaultGreen: null,
      defaultBlue: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setFormData({
      name: dataset.name,
      description: dataset.description || '',
      minBand: dataset.minBand ?? null,
      maxBand: dataset.maxBand ?? null,
      defaultRed: dataset.defaultRed ?? null,
      defaultGreen: dataset.defaultGreen ?? null,
      defaultBlue: dataset.defaultBlue ?? null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDataset(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '名称为必填项';
    }

    // Validate band range
    const minBand = formData.minBand ?? null;
    const maxBand = formData.maxBand ?? null;
    if (minBand !== null && maxBand !== null) {
      if (minBand < 0) {
        errors.minBand = '最小波段必须 >= 0';
      }
      if (maxBand < 0) {
        errors.maxBand = '最大波段必须 >= 0';
      }
      if (minBand > maxBand) {
        errors.minBand = '最小波段必须 <= 最大波段';
      }
    }

    // Validate default RGB bands
    const rgbFields: Array<'defaultRed' | 'defaultGreen' | 'defaultBlue'> = ['defaultRed', 'defaultGreen', 'defaultBlue'];
    rgbFields.forEach(field => {
      const value = formData[field] ?? null;
      if (value !== null && value < 0) {
        errors[field] = '波段索引必须 >= 0';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingDataset) {
        // For editing, merge with existing data
        const updateData: Omit<Dataset, 'id'> = {
          ...editingDataset,
          name: formData.name,
          description: formData.description || '',
          minBand: formData.minBand ?? null,
          maxBand: formData.maxBand ?? null,
          defaultRed: formData.defaultRed ?? null,
          defaultGreen: formData.defaultGreen ?? null,
          defaultBlue: formData.defaultBlue ?? null,
        };
        await updateDataset(editingDataset.id, updateData);
      } else {
        await createDataset(formData);
      }
      await loadDatasets();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此数据集吗？')) return;

    setIsLoading(true);
    setError('');
    try {
      await deleteDataset(id);
      await loadDatasets();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据集失败');
      setIsLoading(false);
    }
  };

  const handleNumberInput = (
    field: keyof DatasetFormData,
    value: string
  ) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Helper to display dimension info
  const formatDimensions = (dataset: Dataset) => {
    const parts: string[] = [];
    if (dataset.width && dataset.height) {
      parts.push(`${dataset.width}×${dataset.height}`);
    }
    if (dataset.bands) {
      parts.push(`${dataset.bands} 波段`);
    }
    return parts.length > 0 ? parts.join(' | ') : '暂无尺寸信息';
  };

  // Helper to display band range (in nm)
  const formatBandRange = (dataset: Dataset) => {
    if (dataset.minBand !== null && dataset.maxBand !== null) {
      return `${dataset.minBand}-${dataset.maxBand} nm`;
    }
    return '未设置';
  };

  // Helper to display default RGB
  const formatDefaultRGB = (dataset: Dataset) => {
    const rgb = [dataset.defaultRed, dataset.defaultGreen, dataset.defaultBlue];
    if (rgb.every(v => v !== null)) {
      return `R:${dataset.defaultRed} G:${dataset.defaultGreen} B:${dataset.defaultBlue}`;
    }
    return '未设置';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">数据集</h2>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          添加数据集
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && datasets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">暂无数据集</p>
            <p className="text-sm text-muted-foreground mb-4">创建您的第一个数据集开始使用</p>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              添加数据集
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dataset List */}
      {!isLoading && datasets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((dataset) => (
            <Card key={dataset.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{dataset.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditModal(dataset)}
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(dataset.id)}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dataset.description || '暂无描述'}
                </p>
                
                {/* Dimensions */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>{formatDimensions(dataset)}</span>
                </div>
                
                {/* Band Range */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  <span>范围: {formatBandRange(dataset)}</span>
                </div>
                
                {/* Default RGB */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  <span>RGB: {formatDefaultRGB(dataset)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDataset ? '编辑数据集' : '创建数据集'}
            </DialogTitle>
            <DialogDescription>
              {editingDataset 
                ? '更新此数据集的详细信息。' 
                : '添加新数据集以组织您的高光谱图像。'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                基本信息
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">
                  名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入数据集名称"
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="请输入描述（可选）"
                />
              </div>
            </div>

            <Separator />

            {/* Band Range Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                波段范围（可选）
              </h3>
              <p className="text-xs text-muted-foreground">
                定义此数据集的有效波长波段范围。
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBand">最小波段</Label>
                  <Input
                    id="minBand"
                    type="number"
                    min={0}
                    value={formData.minBand ?? ''}
                    onChange={(e) => handleNumberInput('minBand', e.target.value)}
                    placeholder="例如：0"
                    className={formErrors.minBand ? 'border-destructive' : ''}
                  />
                  {formErrors.minBand && (
                    <p className="text-xs text-destructive">{formErrors.minBand}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBand">最大波段</Label>
                  <Input
                    id="maxBand"
                    type="number"
                    min={0}
                    value={formData.maxBand ?? ''}
                    onChange={(e) => handleNumberInput('maxBand', e.target.value)}
                    placeholder="例如：200"
                    className={formErrors.maxBand ? 'border-destructive' : ''}
                  />
                  {formErrors.maxBand && (
                    <p className="text-xs text-destructive">{formErrors.maxBand}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Default RGB Bands Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4" />
                默认RGB波段（可选）
              </h3>
              <p className="text-xs text-muted-foreground">
                设置假彩色可视化的默认波段索引。
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultRed" className="text-red-500">红通道</Label>
                  <Input
                    id="defaultRed"
                    type="number"
                    min={0}
                    value={formData.defaultRed ?? ''}
                    onChange={(e) => handleNumberInput('defaultRed', e.target.value)}
                    placeholder="例如：50"
                    className={formErrors.defaultRed ? 'border-destructive' : ''}
                  />
                  {formErrors.defaultRed && (
                    <p className="text-xs text-destructive">{formErrors.defaultRed}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultGreen" className="text-green-500">绿通道</Label>
                  <Input
                    id="defaultGreen"
                    type="number"
                    min={0}
                    value={formData.defaultGreen ?? ''}
                    onChange={(e) => handleNumberInput('defaultGreen', e.target.value)}
                    placeholder="例如：100"
                    className={formErrors.defaultGreen ? 'border-destructive' : ''}
                  />
                  {formErrors.defaultGreen && (
                    <p className="text-xs text-destructive">{formErrors.defaultGreen}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultBlue" className="text-blue-500">蓝通道</Label>
                  <Input
                    id="defaultBlue"
                    type="number"
                    min={0}
                    value={formData.defaultBlue ?? ''}
                    onChange={(e) => handleNumberInput('defaultBlue', e.target.value)}
                    placeholder="例如：150"
                    className={formErrors.defaultBlue ? 'border-destructive' : ''}
                  />
                  {formErrors.defaultBlue && (
                    <p className="text-xs text-destructive">{formErrors.defaultBlue}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting ? '保存中...' : (editingDataset ? '更新' : '创建')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatasetsPage;