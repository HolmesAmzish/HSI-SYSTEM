/**
 * HSI Type Definitions
 * Matches server HyperspectralImage entity
 */

import type { DatasetInfo } from './dataset';

/**
 * Process status matching server ProcessStatus enum
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
 * Matches server HyperspectralImage entity
 */
export interface HsiImage {
  id: number;
  filename: string;
  status: ProcessStatus;
  matPath: string;
  binPath: string | null;
  headerHash: string | null;
  overviewPicturePath: string | null;
  dataset: DatasetInfo | null;
  spatialResolution: number;
  fileSize: number | null;
  dataType: string | null;
  createdAt: string;
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
 * RGB Band Selection Configuration
 */
export interface RgbBandConfig {
  redBand: number;
  greenBand: number;
  blueBand: number;
}