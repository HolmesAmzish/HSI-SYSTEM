/**
 * Ground Truth Type Definitions
 * Matches server GroundTruth entity and DTOs
 */

import type { ProcessStatus } from './hsi';
import type { HsiImage } from './hsi';
import type { Dataset } from '@/services/datasetService';

/**
 * Segmentation Label entity
 * Represents a class label with color information
 */
export interface SegmentationLabel {
  id: number;
  labelIndex: number;
  name: string;
  aliasName: string;
  colourCode: string; // Hex color code, e.g., #FF5733
  dataset: Dataset; // Reference to the parent dataset
}

/**
 * Ground Truth entity from server
 */
export interface GroundTruth {
  id: number;
  image: HsiImage | null;
  filename: string;
  matPath: string;
  numClasses: number;
  status: ProcessStatus;
}

/**
 * Ground Truth Matrix DTO
 * Contains raw label matrix data for frontend rendering
 */
export interface GroundTruthMatrix {
  matrix: string; // Base64 encoded byte array
  labelMap: SegmentationLabel[];
  height: number;
  width: number;
  numClasses: number;
}

/**
 * Form data for creating ground truth manually
 */
export interface GroundTruthFormData {
  filename: string;
  numClasses: number;
}

/**
 * Category spectral statistics
 * Contains spectral data for a single category/label
 */
export interface CategorySpectralStat {
  label: SegmentationLabel;
  pixelCount: number;
  meanSpectrum: number[];
  stdDevSpectrum: number[];
}

/**
 * Ground Truth Statistics
 * Contains spectral statistics for all categories in a ground truth
 */
export interface GroundTruthStats {
  wavelengths: number[];
  categories: CategorySpectralStat[];
}

/**
 * Paginated response for ground truth list
 */
export interface GroundTruthPageResponse {
  content: GroundTruth[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
