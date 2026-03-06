/**
 * Ground Truth Type Definitions
 * Matches server GroundTruth entity
 */

import type { ProcessStatus } from './hsi';
import type { HsiImage } from './hsi';

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
 * Form data for creating ground truth manually
 */
export interface GroundTruthFormData {
  filename: string;
  numClasses: number;
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
