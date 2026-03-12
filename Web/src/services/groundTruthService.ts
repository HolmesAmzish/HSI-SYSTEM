/**
 * Ground Truth Service
 * API calls for ground truth management
 */

import type { GroundTruth, GroundTruthPageResponse, GroundTruthFormData, GroundTruthMatrix, SegmentationLabel, GroundTruthStats } from '@/types/groundTruth';

const API_BASE = '/api/gt';

/**
 * Generate a random color for labels without defined colors
 * Returns hex color code
 */
export function generateRandomColor(index: number): string {
  // Use HSL to generate distinct colors
  const hue = (index * 137.508) % 360; // Golden angle approximation for good distribution
  const saturation = 70 + (index % 2) * 20; // 70% or 90%
  const lightness = 50 + (index % 3) * 10; // 50%, 60%, or 70%
  return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to Hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Build color map from label map
 * Returns a map of label index to hex color
 */
export function buildColorMap(labelMap: SegmentationLabel[], numClasses: number): Map<number, string> {
  const colorMap = new Map<number, string>();
  
  // First, add colors from label map
  labelMap.forEach(label => {
    if (label.colourCode) {
      colorMap.set(label.labelIndex, label.colourCode);
    }
  });
  
  // Then, generate random colors for missing labels
  for (let i = 0; i < numClasses; i++) {
    if (!colorMap.has(i)) {
      colorMap.set(i, generateRandomColor(i));
    }
  }
  
  return colorMap;
}

/**
 * Render ground truth matrix to canvas
 * Returns canvas element
 */
export function renderGroundTruthToCanvas(
  matrixData: Uint8Array,
  width: number,
  height: number,
  colorMap: Map<number, string>
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const labelValue = matrixData[idx];
      const colorHex = colorMap.get(labelValue) || '#000000';
      const rgb = hexToRgb(colorHex);
      
      const pixelIdx = idx * 4;
      data[pixelIdx] = rgb.r;
      data[pixelIdx + 1] = rgb.g;
      data[pixelIdx + 2] = rgb.b;
      data[pixelIdx + 3] = 255; // Alpha
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

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
 * Get ground truth mask matrix data
 * Returns GroundTruthMatrix with base64 encoded matrix and label map
 */
export async function getGroundTruthMaskMatrix(id: number): Promise<GroundTruthMatrix> {
  const response = await fetch(`${API_BASE}/mask/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch mask matrix: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get ground truth mask image as PNG URL
 * This renders the matrix data to a canvas and returns a blob URL
 */
export async function getGroundTruthMaskImage(id: number): Promise<string> {
  const matrixData = await getGroundTruthMaskMatrix(id);
  
  // Decode base64 matrix to Uint8Array
  const binaryString = atob(matrixData.matrix);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Build color map
  const colorMap = buildColorMap(matrixData.labelMap, matrixData.numClasses);
  
  // Render to canvas
  const canvas = renderGroundTruthToCanvas(
    bytes,
    matrixData.width,
    matrixData.height,
    colorMap
  );
  
  // Convert to blob URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error('Failed to create blob from canvas'));
      }
    }, 'image/png');
  });
}

/**
 * Get ground truth spectral statistics
 * Returns wavelengths and category spectral data
 */
export async function getGroundTruthStats(id: number): Promise<GroundTruthStats> {
  const response = await fetch(`${API_BASE}/stats/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ground truth stats: ${response.statusText}`);
  }

  return response.json();
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
