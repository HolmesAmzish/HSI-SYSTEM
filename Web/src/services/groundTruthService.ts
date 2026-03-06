/**
 * Ground Truth Service
 * API calls for ground truth management
 */

import type { GroundTruth, GroundTruthPageResponse, GroundTruthFormData } from '@/types/groundTruth';

const API_BASE = '/api/gt';

/**
 * Get all ground truths with pagination
 */
export async function getGroundTruths(page: number = 0, size: number = 20): Promise<GroundTruthPageResponse> {
  const response = await fetch(`${API_BASE}?page=${page}&size=${size}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ground truths: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Upload MAT file for ground truth
 * This will trigger Python processing via Redis MQ
 */
export async function uploadGroundTruthMat(hsiId: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload/${hsiId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ground truth: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Create ground truth manually (without file upload)
 */
export async function createGroundTruth(hsiId: number, data: GroundTruthFormData): Promise<GroundTruth> {
  const response = await fetch(`${API_BASE}/${hsiId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create ground truth: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete ground truth by ID
 */
export async function deleteGroundTruth(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete ground truth: ${response.statusText}`);
  }
}

/**
 * Get ground truth mask image as PNG
 * Returns blob URL for display
 */
export async function getGroundTruthMaskImage(id: number): Promise<string> {
  const response = await fetch(`${API_BASE}/mask/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch mask image: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get status badge color based on process status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PROCESSING':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'FAILED':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'PENDING':
    default:
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  }
}

/**
 * Get status label in Chinese
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return '已完成';
    case 'PROCESSING':
      return '处理中';
    case 'FAILED':
      return '失败';
    case 'PENDING':
      return '待处理';
    default:
      return status;
  }
}
