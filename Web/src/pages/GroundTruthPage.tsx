/**
 * Ground Truth Management Page
 * Unified UI with HsiManagePage
 * Handles GT file upload and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getGroundTruths,
  uploadGroundTruthMat,
  deleteGroundTruth,
} from '@/services/groundTruthService';
import { getHsiList, type HsiImage, ProcessStatus } from '@/services/hsiLoader';
import type { GroundTruth } from '@/types/groundTruth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GtFileUpload from '@/components/GtFileUpload';

const GroundTruthPage: React.FC = () => {
  // Data states
  const [groundTruths, setGroundTruths] = useState<GroundTruth[]>([]);
  const [hsiImages, setHsiImages] = useState<HsiImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const navigate = useNavigate();

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

  const handleFileUploaded = async (file: File, hsiId: number) => {
    await uploadGroundTruthMat(hsiId, file);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个真值数据吗？')) return;

    setDeletingId(id);
    try {
      await deleteGroundTruth(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (gt: GroundTruth) => {
    navigate(`/gt-viewer?id=${gt.id}`);
  };

  // Filter HSI images that don't have ground truth yet
  const availableHsiImages = hsiImages.filter(
    (hsi) => !groundTruths.some((gt) => gt.image?.id === hsi.id)
  );

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">真值数据管理</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-1">
          <GtFileUpload
            onFileUploaded={handleFileUploaded}
            hsiImages={hsiImages}
            availableHsiImages={availableHsiImages}
          />
        </div>

        {/* GT List Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>真值文件列表</CardTitle>
              <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : groundTruths.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无真值数据，请上传MAT文件开始使用。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>文件名</TableHead>
                      <TableHead>关联HSI</TableHead>
                      <TableHead>类别数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groundTruths.map((gt) => (
                      <TableRow key={gt.id}>
                        <TableCell>{gt.id}</TableCell>
                        <TableCell className="font-medium">{gt.filename}</TableCell>
                        <TableCell>{gt.image?.filename || '-'}</TableCell>
                        <TableCell>{gt.numClasses}</TableCell>
                        <TableCell>{getStatusBadge(gt.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(gt)}
                              title="查看"
                              disabled={gt.status !== ProcessStatus.COMPLETED}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(gt.id)}
                              title="删除"
                              disabled={deletingId === gt.id}
                            >
                              {deletingId === gt.id ? (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroundTruthPage;
