/**
 * Datasets Management Page
 * Left-Right Layout: List on left, Detail/Edit on right
 */

import React, { useState, useEffect } from 'react';
import {
  getDatasets,
  createDataset,
  updateDataset,
  deleteDataset,
  getSegmentationLabelsByDatasetId,
  createSegmentationLabel,
  updateSegmentationLabel,
  deleteSegmentationLabel,
  generateRandomColor,
  type Dataset,
  type DatasetFormData,
} from '@/services/datasetService';
import type { SegmentationLabel } from '@/types/groundTruth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, Info, Layers, Palette, Tags, Save, X } from 'lucide-react';

const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Selected dataset for editing
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Dataset form state
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

  // Labels state
  const [labels, setLabels] = useState<SegmentationLabel[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [editingLabel, setEditingLabel] = useState<SegmentationLabel | null>(null);
  const [labelFormData, setLabelFormData] = useState<{
    labelIndex: number;
    name: string;
    aliasName: string;
    colourCode: string;
  }>({
    labelIndex: 0,
    name: '',
    aliasName: '',
    colourCode: '#000000',
  });
  const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getDatasets();
      setDatasets(data);
      // If we have datasets and none selected, select the first one
      if (data.length > 0 && !selectedDataset && !isCreating) {
        handleSelectDataset(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据集失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setIsCreating(false);
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
    
    // Load labels
    setIsLoadingLabels(true);
    try {
      const data = await getSegmentationLabelsByDatasetId(dataset.id);
      setLabels(data);
    } catch (err) {
      console.error('Failed to load labels:', err);
      setLabels([]);
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedDataset(null);
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
    setLabels([]);
  };

  const handleCancelEdit = () => {
    if (datasets.length > 0) {
      handleSelectDataset(datasets[0]);
    } else {
      setSelectedDataset(null);
      setIsCreating(false);
    }
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
      if (isCreating) {
        const newDataset = await createDataset(formData);
        await loadDatasets();
        handleSelectDataset(newDataset);
      } else if (selectedDataset) {
        const updateData: Omit<Dataset, 'id'> = {
          ...selectedDataset,
          name: formData.name,
          description: formData.description || '',
          minBand: formData.minBand ?? null,
          maxBand: formData.maxBand ?? null,
          defaultRed: formData.defaultRed ?? null,
          defaultGreen: formData.defaultGreen ?? null,
          defaultBlue: formData.defaultBlue ?? null,
        };
        const updated = await updateDataset(selectedDataset.id, updateData);
        await loadDatasets();
        setSelectedDataset(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此数据集吗？')) return;

    setError('');
    try {
      await deleteDataset(id);
      await loadDatasets();
      if (selectedDataset?.id === id) {
        setSelectedDataset(null);
        setIsCreating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据集失败');
    }
  };

  const handleNumberInput = (
    field: keyof DatasetFormData,
    value: string
  ) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Label management handlers
  const handleOpenCreateLabel = () => {
    setEditingLabel(null);
    setLabelFormData({
      labelIndex: labels.length,
      name: '',
      aliasName: '',
      colourCode: generateRandomColor(),
    });
  };

  const handleOpenEditLabel = (label: SegmentationLabel) => {
    setEditingLabel(label);
    setLabelFormData({
      labelIndex: label.labelIndex,
      name: label.name,
      aliasName: label.aliasName,
      colourCode: label.colourCode,
    });
  };

  const handleLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDataset) return;

    setIsSubmittingLabel(true);
    setError('');

    try {
      const labelData = {
        ...labelFormData,
        dataset: selectedDataset,
      };
      if (editingLabel) {
        await updateSegmentationLabel(editingLabel.id, labelData);
      } else {
        await createSegmentationLabel(labelData);
      }
      // Reload labels
      const data = await getSegmentationLabelsByDatasetId(selectedDataset.id);
      setLabels(data);
      setEditingLabel(null);
      setLabelFormData({
        labelIndex: labels.length + (editingLabel ? 0 : 1),
        name: '',
        aliasName: '',
        colourCode: generateRandomColor(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存标签失败');
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!selectedDataset) return;
    if (!confirm('确定要删除此标签吗？')) return;

    setError('');
    try {
      await deleteSegmentationLabel(labelId);
      const data = await getSegmentationLabelsByDatasetId(selectedDataset.id);
      setLabels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除标签失败');
    }
  };

  // Helper to display dimension info
  const formatDimensions = (dataset: Dataset) => {
    const parts: string[] = [];
    if (dataset.width && dataset.height) {
      parts.push(`${dataset.width}×${dataset.height}`);
    }
    if (dataset.bands) {
      parts.push(`${dataset.bands}波段`);
    }
    return parts.length > 0 ? parts.join(' | ') : '暂无尺寸';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">数据集管理</h2>
        <Button onClick={handleStartCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建数据集
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {datasets.length === 0 && !isCreating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">暂无数据集</p>
            <p className="text-sm text-muted-foreground mb-4">创建您的第一个数据集开始使用</p>
            <Button onClick={handleStartCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新建数据集
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Left Right Layout */}
      {(datasets.length > 0 || isCreating) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Left: Dataset List */}
          <div className="lg:col-span-1 space-y-2 overflow-y-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">数据集列表</h3>
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                onClick={() => handleSelectDataset(dataset)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedDataset?.id === dataset.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{dataset.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dataset.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {dataset.description || '暂无描述'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>{formatDimensions(dataset)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Detail/Edit Panel */}
          <div className="lg:col-span-3 overflow-y-auto">
            <Card className="h-full border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {isCreating ? '新建数据集' : (selectedDataset ? '编辑数据集' : '选择数据集')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isCreating && !selectedDataset ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mb-4" />
                    <p>请从左侧选择一个数据集进行编辑</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">基本信息</TabsTrigger>
                      <TabsTrigger value="labels" disabled={isCreating}>
                        分割标签
                      </TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-6 mt-4">
                      {/* Name */}
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

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">描述</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          placeholder="请输入描述（可选）"
                        />
                      </div>

                      <Separator />

                      {/* Band Range */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">波段范围（nm）</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minBand">最小波段</Label>
                            <Input
                              id="minBand"
                              type="number"
                              min={0}
                              value={formData.minBand ?? ''}
                              onChange={(e) => handleNumberInput('minBand', e.target.value)}
                              placeholder="例如：400"
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
                              placeholder="例如：1000"
                              className={formErrors.maxBand ? 'border-destructive' : ''}
                            />
                            {formErrors.maxBand && (
                              <p className="text-xs text-destructive">{formErrors.maxBand}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Default RGB */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">默认RGB波段</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="defaultRed" className="text-red-500">红通道</Label>
                            <Input
                              id="defaultRed"
                              type="number"
                              min={0}
                              value={formData.defaultRed ?? ''}
                              onChange={(e) => handleNumberInput('defaultRed', e.target.value)}
                              placeholder="波段索引"
                              className={formErrors.defaultRed ? 'border-destructive' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="defaultGreen" className="text-green-500">绿通道</Label>
                            <Input
                              id="defaultGreen"
                              type="number"
                              min={0}
                              value={formData.defaultGreen ?? ''}
                              onChange={(e) => handleNumberInput('defaultGreen', e.target.value)}
                              placeholder="波段索引"
                              className={formErrors.defaultGreen ? 'border-destructive' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="defaultBlue" className="text-blue-500">蓝通道</Label>
                            <Input
                              id="defaultBlue"
                              type="number"
                              min={0}
                              value={formData.defaultBlue ?? ''}
                              onChange={(e) => handleNumberInput('defaultBlue', e.target.value)}
                              placeholder="波段索引"
                              className={formErrors.defaultBlue ? 'border-destructive' : ''}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Labels Tab */}
                    <TabsContent value="labels" className="space-y-4 mt-4">
                      {isLoadingLabels ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {/* Label List */}
                          <div className="space-y-2 max-h-[250px] overflow-y-auto border rounded-lg p-2">
                            {labels.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Tags className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">暂无标签</p>
                              </div>
                            ) : (
                              labels.map((label) => (
                                <div
                                  key={label.id}
                                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                                >
                                  <div
                                    className="w-6 h-6 rounded border border-border flex-shrink-0"
                                    style={{ backgroundColor: label.colourCode }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{label.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      索引:{label.labelIndex}
                                      {label.aliasName && ` | ${label.aliasName}`}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleOpenEditLabel(label)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDeleteLabel(label.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Label Form */}
                          <div className="border rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-medium">
                              {editingLabel ? '编辑标签' : '添加新标签'}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="labelIndex" className="text-xs">标签索引</Label>
                                <Input
                                  id="labelIndex"
                                  type="number"
                                  min={0}
                                  value={labelFormData.labelIndex}
                                  onChange={(e) =>
                                    setLabelFormData({
                                      ...labelFormData,
                                      labelIndex: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="colourCode" className="text-xs">颜色</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="colourCode"
                                    type="color"
                                    value={labelFormData.colourCode}
                                    onChange={(e) =>
                                      setLabelFormData({
                                        ...labelFormData,
                                        colourCode: e.target.value,
                                      })
                                    }
                                    className="w-10 h-8 p-1"
                                  />
                                  <Input
                                    type="text"
                                    value={labelFormData.colourCode}
                                    onChange={(e) =>
                                      setLabelFormData({
                                        ...labelFormData,
                                        colourCode: e.target.value,
                                      })
                                    }
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="labelName" className="text-xs">名称</Label>
                              <Input
                                id="labelName"
                                value={labelFormData.name}
                                onChange={(e) =>
                                  setLabelFormData({ ...labelFormData, name: e.target.value })
                                }
                                placeholder="例如：植被"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="aliasName" className="text-xs">英文别名（可选）</Label>
                              <Input
                                id="aliasName"
                                value={labelFormData.aliasName}
                                onChange={(e) =>
                                  setLabelFormData({ ...labelFormData, aliasName: e.target.value })
                                }
                                placeholder="例如：Vegetation"
                                className="h-8"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleLabelSubmit}
                                disabled={isSubmittingLabel || !labelFormData.name.trim()}
                                className="flex-1"
                              >
                                {isSubmittingLabel ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : null}
                                {editingLabel ? '更新' : '添加'}
                              </Button>
                              {editingLabel && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingLabel(null)}
                                >
                                  取消
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      取消
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !formData.name.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetsPage;
