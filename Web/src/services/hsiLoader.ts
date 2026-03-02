/**
 * HSI API Service
 * 
 * Communicates with the Spring Boot backend for hyperspectral image operations.
 * Base URL: http://localhost:8080/api/hsi
 */

import type { HsiData, HsiImageMetadata } from '../types/hsi';

const API_BASE_URL = '/api/hsi';

/**
 * Process status enum matching server
 */
export enum ProcessStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

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
 * Load HSI binary data from server by ID
 */
export async function loadHsiFromServer(id: number): Promise<HsiData> {
  // First get metadata
  const listResponse = await getHsiList(0, 100);
  const imageMeta = listResponse.content.find(img => img.id === id);
  
  if (!imageMeta) {
    throw new Error(`HSI image with ID ${id} not found`);
  }
  
  // Download binary file
  const response = await fetch(`${API_BASE_URL}/getBin/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load HSI binary: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const cube = new Float32Array(arrayBuffer);
  
  return {
    cube,
    height: imageMeta.height,
    width: imageMeta.width,
    bands: imageMeta.bands,
    dataType: 'float32'
  };
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
 * Load HSI data from local file (fallback method)
 */
export async function loadFromLocalFile(file: File): Promise<HsiData> {
  const arrayBuffer = await file.arrayBuffer();
  const cube = new Float32Array(arrayBuffer);
  
  const totalValues = cube.length;
  
  const commonConfigs = [
    { height: 150, width: 150, bands: 68 },
    { height: 610, width: 340, bands: 103 },
    { height: 145, width: 145, bands: 200 },
    { height: 256, width: 256, bands: 160 },
    { height: 400, width: 400, bands: 150 },
  ];
  
  for (const config of commonConfigs) {
    if (config.height * config.width * config.bands === totalValues) {
      return {
        cube,
        height: config.height,
        width: config.width,
        bands: config.bands,
        dataType: 'float32'
      };
    }
  }
  
  const estimatedSize = Math.round(Math.cbrt(totalValues));
  const bands = Math.round(totalValues / (estimatedSize * estimatedSize));
  
  return {
    cube,
    height: estimatedSize,
    width: estimatedSize,
    bands,
    dataType: 'float32'
  };
}
