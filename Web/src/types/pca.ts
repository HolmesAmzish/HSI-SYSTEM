/**
 * PCA Point Cloud Types
 * Types for 3D PCA visualization
 */

import type { SegmentationLabel } from './groundTruth';

/**
 * PCA Point Cloud DTO
 * Contains XYZ coordinates for each pixel (from PCA-reduced 3 channels),
 * along with ground truth labels for visualization.
 * 
 * Data format: [x, y, z, gtIndex] for each pixel.
 * Size: [totalPoints * 4] - each point has x, y, z, gtIndex values.
 * Stored as flat array: [x0, y0, z0, gt0, x1, y1, z1, gt1, ...]
 * gtIndex is the ground truth label index (0 if no GT).
 */
export interface PcaPointCloud {
  /** Width of the original image */
  width: number;
  
  /** Height of the original image */
  height: number;
  
  /**
   * Point data array: [x, y, z, gtIndex] for each pixel.
   * Size: [totalPoints * 4] - each point has x, y, z, gtIndex values.
   * Stored as flat array: [x0, y0, z0, gt0, x1, y1, z1, gt1, ...]
   * gtIndex is the ground truth label index (0 if no GT).
   */
  points: number[];
  
  /**
   * Total number of points (width * height)
   * Calculated as: points.length / 4
   * Optional - will be calculated from points array if not provided
   */
  totalPoints?: number;
  
  /** 
   * Number of unique classes in ground truth
   * Optional - will be calculated from labels array if not provided
   */
  numClasses?: number;
  
  /** List of segmentation labels for the dataset */
  labels: SegmentationLabel[] | null;
}

/**
 * PCA Task Response
 */
export interface PcaTaskResponse {
  message: string;
  taskId: string;
}

/**
 * 3D Point with color for visualization
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
  label: number;
  row: number;
  col: number;
  color: string;
}

/**
 * View state for 3D visualization
 */
export interface ViewState3D {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoom: number;
  panX: number;
  panY: number;
}
