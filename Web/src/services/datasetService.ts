/**
 * Dataset API Service
 * 
 * Communicates with the Spring Boot backend for dataset operations.
 * Base URL: http://localhost:8080/api/datasets
 */

const API_BASE_URL = '/api/datasets';

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