import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { HsiImage, ProcessStatus } from '@/types/hsi';
import type { PageResponse } from '@/types/hsi';
import { getHsiList, triggerInferenceTask, AVAILABLE_MODELS, getStatusColor, getStatusLabel } from '@/services/inferenceService';

/**
 * Get status badge for HSI
 */
function getHsiStatusBadge(status: ProcessStatus) {
  const statusConfig: Record<ProcessStatus, { color: string; label: string }> = {
    PENDING: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: '待处理' },
    PROCESSING: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: '处理中' },
    COMPLETED: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: '已完成' },
    FAILED: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: '失败' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

/**
 * Check if HSI needs inference based on status
 * PENDING or FAILED status means inference is needed
 */
function needsInference(status: ProcessStatus): boolean {
  return status === 'PENDING' || status === 'FAILED';
}

/**
 * Check if HSI inference is completed
 */
function isInferenceCompleted(status: ProcessStatus): boolean {
  return status === 'COMPLETED';
}

/**
 * Check if dataset has model (always returns true as per requirement)
 */
function hasDatasetModel(hsi: HsiImage): boolean {
  // As per requirement: always return true
  return true;
}

/**
 * Get model name from dataset (use dataset name as model name)
 */
function getModelName(hsi: HsiImage): string | null {
  return hsi.dataset?.name || null;
}

const InferencePage: React.FC = () => {
  const [hsiList, setHsiList] = useState<HsiImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [triggerResult, setTriggerResult] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  // Load HSI list
  useEffect(() => {
    loadHsiList();
  }, []);

  async function loadHsiList() {
    setLoading(true);
    setError(null);
    try {
      const data: PageResponse<HsiImage> = await getHsiList(0, 50);
      setHsiList(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HSI list');
    } finally {
      setLoading(false);
    }
  }

  async function handleTriggerInference(hsiId: number) {
    setTriggeringId(hsiId);
    try {
      const result = await triggerInferenceTask(hsiId);
      setTriggerResult(prev => ({ ...prev, [hsiId]: result }));
      // Refresh the list after triggering
      await loadHsiList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger inference');
    } finally {
      setTriggeringId(null);
    }
  }

  // Filter HSI list based on status and model
  const filteredHsiList = hsiList.filter(hsi => {
    // Status filter
    if (statusFilter !== 'all' && hsi.status !== statusFilter.toUpperCase()) {
      return false;
    }
    // Model filter - filter by dataset (model)
    if (modelFilter !== 'all') {
      if (modelFilter === 'with-model') {
        return hasDatasetModel(hsi);
      } else if (modelFilter === 'without-model') {
        return !hasDatasetModel(hsi);
      }
    }
    return true;
  });

  // Calculate statistics
  const stats = {
    total: hsiList.length,
    pending: hsiList.filter(h => h.status === 'PENDING').length,
    processing: hsiList.filter(h => h.status === 'PROCESSING').length,
    completed: hsiList.filter(h => h.status === 'COMPLETED').length,
    failed: hsiList.filter(h => h.status === 'FAILED').length,
    withModel: hsiList.filter(h => hasDatasetModel(h)).length,
  };

  // Get unique dataset names for model filter
  const datasetNames = Array.from(
    new Set(hsiList.filter(h => h.dataset?.name).map(h => h.dataset!.name))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">推理管理</h1>
          <p className="text-muted-foreground mt-1">
            管理高光谱图像的推理任务，查看任务状态和结果。模型名称使用数据集名称。
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-500">待处理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500">处理中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500">失败</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-500">有模型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withModel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>高光谱图像列表</CardTitle>
              <CardDescription>
                选择需要推理的图像并触发推理任务
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="PENDING">待处理</SelectItem>
                  <SelectItem value="PROCESSING">处理中</SelectItem>
                  <SelectItem value="COMPLETED">已完成</SelectItem>
                  <SelectItem value="FAILED">失败</SelectItem>
                </SelectContent>
              </Select>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="with-model">有模型</SelectItem>
                  <SelectItem value="without-model">无模型</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadHsiList} disabled={loading}>
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredHsiList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-muted-foreground mb-2">暂无数据</div>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all' 
                  ? '请先上传高光谱图像数据' 
                  : '当前筛选条件下没有数据'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>数据集/模型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>文件大小</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHsiList.map((hsi) => {
                  const needsInf = needsInference(hsi.status);
                  const isCompleted = isInferenceCompleted(hsi.status);
                  const isProcessing = hsi.status === 'PROCESSING';
                  const isTriggering = triggeringId === hsi.id;

                  return (
                    <TableRow key={hsi.id}>
                      <TableCell className="font-medium">{hsi.id}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {hsi.filename}
                      </TableCell>
                      <TableCell>
                        {hsi.dataset?.name ? (
                          <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            {hsi.dataset.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">未关联</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getHsiStatusBadge(hsi.status)}
                      </TableCell>
                      <TableCell>
                        {hsi.fileSize 
                          ? `${(hsi.fileSize / 1024 / 1024).toFixed(2)} MB` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(hsi.createdAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {needsInf && (
                            <Button
                              size="sm"
                              onClick={() => handleTriggerInference(hsi.id)}
                              disabled={isTriggering || isProcessing}
                              className="bg-primary hover:bg-primary/90"
                            >
                              {isTriggering ? '触发中...' : '触发推理'}
                            </Button>
                          )}
                          {isProcessing && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                              推理中...
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              推理完成
                            </Badge>
                          )}
                          {triggerResult[hsi.id] && !needsInf && !isProcessing && (
                            <span className="text-xs text-muted-foreground">
                              已触发
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dataset Models Info */}
      {datasetNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>数据集模型</CardTitle>
            <CardDescription>
              已关联数据集的 HSI 可以使用对应的模型进行推理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasetNames.map((name) => (
                <div
                  key={name}
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                      {name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    模型名称：{name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    状态：已上传 ✓
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InferencePage;