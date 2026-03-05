/**
 * HSI API Service
 * 
 * Communicates with the Spring Boot backend for hyperspectral image operations.
 * Base URL: http://localhost:8080/api/hsi
 */

import type { RgbBandConfig, HsiImage, PageResponse, ProcessStatus } from '@/types/hsi';
import type { DatasetInfo } from '@/types/dataset';

const API_BASE_URL = '/api/hsi';

/**
 * Get list of HSI images from server
 */
export async function getHsiList(
  page: number = 0,
  size: number = 20
): Promise<PageResponse<HsiImage>> {
  const response = await fetch(`${API_BASE_URL}?page=${page}&size=${size}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch HSI list: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Upload MAT file to server with dataset ID
 * @param file MAT file to upload
 * @param datasetId ID of the dataset to associate the HSI with
 */
export async function uploadMatFile(file: File, datasetId: number): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload/${datasetId}`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload MAT file: ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Calculate default RGB bands based on dataset settings
 * Priority: dataset default bands > 25%, 50%, 75% of total bands
 */
export function calculateDefaultRgbBands(dataset: DatasetInfo): RgbBandConfig {
  const totalBands = dataset.bands || 100;
  
  return {
    redBand: dataset.defaultRed ?? Math.floor(totalBands * 0.25),
    greenBand: dataset.defaultGreen ?? Math.floor(totalBands * 0.5),
    blueBand: dataset.defaultBlue ?? Math.floor(totalBands * 0.75),
  };
}

/**
 * Get RGB image URL from server
 * @param id HSI image ID
 * @param dataset Dataset info (required for calculating default bands)
 * @param bandConfig Optional RGB band configuration (if not provided, uses dataset defaults or calculated defaults)
 */
export function getHsiRgbImageUrl(
  id: number,
  dataset: DatasetInfo,
  bandConfig?: Partial<RgbBandConfig>
): string {
  // Calculate default bands from dataset
  const defaults = calculateDefaultRgbBands(dataset);
  
  // Use provided bands or fall back to defaults
  const red = bandConfig?.redBand ?? defaults.redBand;
  const green = bandConfig?.greenBand ?? defaults.greenBand;
  const blue = bandConfig?.blueBand ?? defaults.blueBand;
  
  return `${API_BASE_URL}/get-image/${id}?red=${red}&green=${green}&blue=${blue}`;
}

/**
 * Get RGB image blob from server
 * @param id HSI image ID
 * @param dataset Dataset info (required for calculating default bands)
 * @param bandConfig Optional RGB band configuration
 */
export async function getHsiRgbImage(
  id: number,
  dataset: DatasetInfo,
  bandConfig?: Partial<RgbBandConfig>
): Promise<Blob> {
  const url = getHsiRgbImageUrl(id, dataset, bandConfig);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to get HSI RGB image: ${response.statusText}`);
  }
  
  return await response.blob();
}

/**
 * Update HSI metadata
 * @param id HSI image ID
 * @param hsi Updated HSI data
 */
export async function updateHsi(
  id: number,
  hsi: Partial<HsiImage>
): Promise<HsiImage> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hsi),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update HSI: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Delete HSI image
 * @param id HSI image ID
 */
export async function deleteHsi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete HSI: ${response.statusText}`);
  }
}

// Re-export types for convenience
export type { RgbBandConfig, HsiImage, PageResponse } from '@/types/hsi';
export type { DatasetInfo } from '@/types/dataset';
export { ProcessStatus } from '@/types/hsi';
