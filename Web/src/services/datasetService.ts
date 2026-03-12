/**
 * Dataset API Service
 * 
 * Communicates with the Spring Boot backend for dataset operations.
 * Base URL: http://localhost:8080/api/datasets
 */

import type { SegmentationLabel } from '@/types/groundTruth';

const API_BASE_URL = '/api/datasets';
const LABELS_API_BASE_URL = '/api/labels';

/**
 * Dataset entity matching server
 */
export interface Dataset {
  id: number;
  name: string;
  description: string;
  // Dimensions from Python inference result
  height: number | null;
  width: number | null;
  bands: number | null;
  // User defined band range
  minBand: number | null;
  maxBand: number | null;
  // Default bands for false colored image
  defaultRed: number | null;
  defaultGreen: number | null;
  defaultBlue: number | null;
}

/**
 * Form data for creating/updating a dataset with all configurable fields
 */
export interface DatasetFormData {
  name: string;
  description?: string;
  // User defined band range
  minBand?: number | null;
  maxBand?: number | null;
  // Default bands for false colored image
  defaultRed?: number | null;
  defaultGreen?: number | null;
  defaultBlue?: number | null;
}

/**
 * Get all datasets
 */
export async function getDatasets(): Promise<Dataset[]> {
  const response = await fetch(API_BASE_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch datasets: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get dataset by ID
 */
export async function getDatasetById(id: number): Promise<Dataset> {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Create a new dataset
 */
export async function createDataset(formData: DatasetFormData): Promise<Dataset> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create dataset: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update an existing dataset
 */
export async function updateDataset(id: number, dataset: Omit<Dataset, 'id'>): Promise<Dataset> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataset),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update dataset: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Delete a dataset
 */
export async function deleteDataset(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete dataset: ${response.statusText}`);
  }
}

// ==================== Segmentation Label APIs ====================

/**
 * Get all segmentation labels
 */
export async function getAllSegmentationLabels(): Promise<SegmentationLabel[]> {
  const response = await fetch(LABELS_API_BASE_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch segmentation labels: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get all segmentation labels for a dataset
 */
export async function getSegmentationLabelsByDatasetId(datasetId: number): Promise<SegmentationLabel[]> {
  const response = await fetch(`${LABELS_API_BASE_URL}/dataset/${datasetId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch segmentation labels: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a segmentation label by ID
 */
export async function getSegmentationLabelById(id: number): Promise<SegmentationLabel> {
  const response = await fetch(`${LABELS_API_BASE_URL}/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch segmentation label: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Create a new segmentation label
 * Note: The label object should include the dataset reference
 */
export async function createSegmentationLabel(label: Omit<SegmentationLabel, 'id'>): Promise<SegmentationLabel> {
  const response = await fetch(LABELS_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(label),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create segmentation label: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update an existing segmentation label
 */
export async function updateSegmentationLabel(id: number, label: Omit<SegmentationLabel, 'id'>): Promise<SegmentationLabel> {
  const response = await fetch(`${LABELS_API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(label),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update segmentation label: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Delete a segmentation label
 */
export async function deleteSegmentationLabel(id: number): Promise<void> {
  const response = await fetch(`${LABELS_API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete segmentation label: ${response.statusText}`);
  }
}

/**
 * Generate a random hex color
 */
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
