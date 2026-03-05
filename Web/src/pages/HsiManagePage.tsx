import React, { useState, useEffect } from 'react';
import {
  getHsiList,
  uploadMatFile,
  updateHsi,
  deleteHsi,
  type HsiImage,
  type PageResponse,
  ProcessStatus
} from '@/services/hsiLoader';
import { getDatasets, createDataset, type Dataset } from '@/services/datasetService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HsiFileUpload from '@/components/HsiFileUpload';

const HsiManagePage: React.FC = () => {
  const [hsiList, setHsiList] = useState<PageResponse<HsiImage> | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Dataset selection for upload
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  
  // Create dataset dialog
  const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  
  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHsi, setEditingHsi] = useState<HsiImage | null>(null);
  const [editFilename, setEditFilename] = useState('');
  const [editSpatialResolution, setEditSpatialResolution] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  const fetchHsiList = async () => {
    try {
      setIsLoading(true);
      const data = await getHsiList(0, 50);
      setHsiList(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载HSI列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDatasets = async () => {
    try {
      const data = await getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    fetchHsiList();
    fetchDatasets();
  }, []);

  const handleFileUploaded = async (file: File, datasetId: number) => {
    await uploadMatFile(file, datasetId);
    fetchHsiList();
  };

  const handleCreateDataset = async () => {
    if (!newDatasetName.trim()) return;
    
    try {
      setIsCreatingDataset(true);
      const dataset = await createDataset({
        name: newDatasetName,
        description: newDatasetDescription,
      });
      setDatasets([...datasets, dataset]);
      setSelectedDatasetId(dataset.id);
      setCreateDatasetDialogOpen(false);
      setNewDatasetName('');
      setNewDatasetDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建数据集失败');
    } finally {
      setIsCreatingDataset(false);
    }
  };

  const openEditDialog = (hsi: HsiImage) => {
    setEditingHsi(hsi);
    setEditFilename(hsi.filename);
    setEditSpatialResolution(hsi.spatialResolution?.toString() || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingHsi) return;
    
    try {
      setIsSaving(true);
      await updateHsi(editingHsi.id, {
        filename: editFilename,
        spatialResolution: editSpatialResolution ? parseFloat(editSpatialResolution) : undefined,
      });
      setEditDialogOpen(false);
      fetchHsiList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此HSI吗？')) return;
    
    try {
      setDeletingId(id);
      await deleteHsi(id);
      fetchHsiList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (hsi: HsiImage) => {
    navigate(`/viewer?id=${hsi.id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const statusTexts: Record<string, string> = {
      PENDING: '等待中',
      PROCESSING: '处理中',
      COMPLETED: '已完成',
      FAILED: '失败',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusTexts[status] || status}
      </span>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">HSI 管理</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-1">
          <HsiFileUpload
            onFileUploaded={handleFileUploaded}
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onDatasetChange={setSelectedDatasetId}
            onCreateDataset={() => setCreateDatasetDialogOpen(true)}
          />
        </div>

        {/* HSI List Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>HSI 文件列表</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : hsiList?.content.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无HSI文件，请上传MAT文件开始使用。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>文件名</TableHead>
                      <TableHead>数据集</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hsiList?.content.map((hsi) => (
                      <TableRow key={hsi.id}>
                        <TableCell>{hsi.id}</TableCell>
                        <TableCell className="font-medium">{hsi.filename}</TableCell>
                        <TableCell>{hsi.dataset?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(hsi.status)}</TableCell>
                        <TableCell>{formatFileSize(hsi.fileSize)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(hsi)}
                              title="查看"
                              disabled={hsi.status !== ProcessStatus.COMPLETED}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(hsi)}
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(hsi.id)}
                              title="删除"
                              disabled={deletingId === hsi.id}
                            >
                              {deletingId === hsi.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dataset Dialog */}
      <Dialog open={createDatasetDialogOpen} onOpenChange={setCreateDatasetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新数据集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="数据集名称"
              />
            </div>
            <div className="space-y-2">
              <Label>描述（可选）</Label>
              <Input
                value={newDatasetDescription}
                onChange={(e) => setNewDatasetDescription(e.target.value)}
                placeholder="数据集描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDatasetDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateDataset} disabled={!newDatasetName.trim() || isCreatingDataset}>
              {isCreatingDataset ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  创建
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑HSI元数据</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>文件名</Label>
              <Input
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>空间分辨率（米/像素）</Label>
              <Input
                type="number"
                step="0.01"
                value={editSpatialResolution}
                onChange={(e) => setEditSpatialResolution(e.target.value)}
                placeholder="例如：7.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HsiManagePage;