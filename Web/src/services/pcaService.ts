/**
 * PCA Service
 * 
 * Communicates with the Spring Boot backend for PCA operations.
 * Base URL: http://localhost:8080/api/hsi/pca
 */

import type { PcaPointCloud, PcaTaskResponse } from '@/types/pca';

const API_BASE_URL = '/api/hsi';

/**
 * Trigger PCA task for a hyperspectral image.
 * Sends a PCA task to Redis MQ for Python worker to process.
 * 
 * @param hsiId HSI ID
 * @returns Task response with taskId
 */
export async function triggerPcaTask(hsiId: number): Promise<PcaTaskResponse> {
  const response = await fetch(`${API_BASE_URL}/pca/${hsiId}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to trigger PCA task: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get PCA point cloud data for 3D visualization.
 * Returns XYZ coordinates from PCA-reduced 3 channels with optional GT labels.
 * 
 * @param hsiId HSI ID
 * @param gtId Ground truth ID (optional)
 * @returns PcaPointCloud DTO
 */
export async function getPcaPointCloud(
  hsiId: number,
  gtId?: number
): Promise<PcaPointCloud> {
  const url = new URL(`${API_BASE_URL}/pca/${hsiId}`, window.location.origin);
  if (gtId !== undefined) {
    url.searchParams.append('gtId', gtId.toString());
  }
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to get PCA point cloud: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Check if PCA data exists for an HSI image
 * @param hsiId HSI ID
 * @returns true if PCA data exists
 */
export async function checkPcaExists(hsiId: number): Promise<boolean> {
  try {
    await getPcaPointCloud(hsiId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Build color map from segmentation labels
 * @param labels List of segmentation labels
 * @param numClasses Number of classes
 * @returns Map from label index to color
 */
export function buildColorMap(
  labels: { labelIndex: number; color?: string }[] | null | undefined,
  numClasses: number
): Map<number, string> {
  const colorMap = new Map<number, string>();
  
  // First, add defined labels
  if (labels) {
    labels.forEach((label) => {
      if (label.color) {
        colorMap.set(label.labelIndex, label.color);
      }
    });
  }
  
  // Generate random colors for undefined labels
  for (let i = 0; i < numClasses; i++) {
    if (!colorMap.has(i)) {
      colorMap.set(i, generateRandomColor(i));
    }
  }
  
  return colorMap;
}

/**
 * Generate a random color based on seed
 * @param seed Random seed
 * @returns Hex color string
 */
export function generateRandomColor(seed: number): string {
  const hue = (seed * 137.508) % 360;
  const saturation = 70 + (seed % 20);
  const lightness = 50 + (seed % 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Convert HSL to Hex color
 * @param hsl HSL color string
 * @returns Hex color string
 */
export function hslToHex(hsl: string): string {
  // Parse HSL values
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!match) return '#888888';
  
  const h = parseFloat(match[1]) / 360;
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
