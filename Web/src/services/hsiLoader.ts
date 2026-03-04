/**
 * HSI API Service
 * 
 * Communicates with the Spring Boot backend for hyperspectral image operations.
 * Base URL: http://localhost:8080/api/hsi
 */

import type { RgbBandConfig } from '../types/hsi';

const API_BASE_URL = '/api/hsi';

/**
 * Process status matching server
 */
export const ProcessStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;

export type ProcessStatus = typeof ProcessStatus[keyof typeof ProcessStatus];

/**
 * HSI Image metadata from server
 * Matches HyperspectralImage entity
 */
export interface HsiImageResponse {
  id: number;
  filename: string;
  status: ProcessStatus;
  matPath: string;
  binPath: string | null;
  headerHash: string | null;
  overviewPicturePath: string | null;
  metadata: string | null;
  fileSize: number | null;
  height: number | null;
  width: number | null;
  bands: number | null;
  dataType: string | null;
  processedAt: string | null;
}

/**
 * Paginated response from server
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Get list of HSI images from server
 */
export async function getHsiList(
  page: number = 0,
  size: number = 20
): Promise<PageResponse<HsiImageResponse>> {
  const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch HSI list: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Upload MAT file to server
 */
export async function uploadMatFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload MAT file: ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Get RGB image URL from server
 * @param id HSI image ID
 * @param bandConfig Optional RGB band configuration
 */
export function getHsiRgbImageUrl(
  id: number,
  bandConfig?: Partial<RgbBandConfig>
): string {
  let url = `${API_BASE_URL}/get-hsi/${id}`;
  
  if (bandConfig?.redBand !== undefined) {
    url += `?red=${bandConfig.redBand}`;
  }
  if (bandConfig?.greenBand !== undefined) {
    url += `${url.includes('?') ? '&' : '?'}green=${bandConfig.greenBand}`;
  }
  if (bandConfig?.blueBand !== undefined) {
    url += `${url.includes('?') ? '&' : '?'}blue=${bandConfig.blueBand}`;
  }
  
  return url;
}

/**
 * Get RGB image blob from server
 * @param id HSI image ID
 * @param bandConfig Optional RGB band configuration
 */
export async function getHsiRgbImage(
  id: number,
  bandConfig?: Partial<RgbBandConfig>
): Promise<Blob> {
  const url = getHsiRgbImageUrl(id, bandConfig);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to get HSI RGB image: ${response.statusText}`);
  }
  
  return await response.blob();
}
