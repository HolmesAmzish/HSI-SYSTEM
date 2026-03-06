/**
 * Inference Type Definitions
 * Type definitions for inference tasks and models
 */

import type { ProcessStatus } from './hsi';

/**
 * Available model types for hyperspectral image classification
 */
export type ModelType = 
  | 'SPECTRALNET'      // Spectral feature extraction network
  | 'SPATIALNET'       // Spatial feature extraction network
  | 'SSRN'             // Spectral-Spatial Residual Network
  | 'HYBRIDSN'         // Hybrid Spectral Network
  | 'TRANSFORMER'      // Vision Transformer based model
  | 'CUSTOM';          // Custom user-defined model

/**
 * Model information metadata
 */
export interface ModelInfo {
  id: ModelType;
  name: string;
  description: string;
  supportedBands: number[];
  defaultParams: ModelParameters;
}

/**
 * Model hyperparameters configuration
 */
export interface ModelParameters {
  // Network architecture parameters
  patchSize: number;           // Spatial patch size (e.g., 5, 7, 9, 11)
  numComponents: number;       // Number of PCA components for dimensionality reduction
  
  // Training hyperparameters
  learningRate: number;        // Initial learning rate (e.g., 0.001, 0.0001)
  batchSize: number;          // Batch size for training (e.g., 16, 32, 64)
  epochs: number;             // Number of training epochs
  
  // Data augmentation settings
  useAugmentation: boolean;   // Enable data augmentation
  flipProb: number;          // Horizontal/vertical flip probability
  rotateProb: number;        // Rotation augmentation probability
  
  // Regularization parameters
  dropoutRate: number;       // Dropout rate for preventing overfitting
  l2Regularization: number;  // L2 weight decay coefficient
}

/**
 * Inference task entity
 */
export interface InferenceTask {
  id: string;
  name: string;
  hsiId: number;
  hsiName: string;
  modelType: ModelType;
  modelName: string;
  status: ProcessStatus;
  parameters: ModelParameters;
  
  // Timing information
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Progress tracking
  progress: number;           // Progress percentage (0-100)
  currentEpoch?: number;
  totalEpochs?: number;
  
  // Result information
  result?: InferenceResult;
  errorMessage?: string;
}

/**
 * Inference task result
 */
export interface InferenceResult {
  taskId: string;
  
  // Output maps
  classificationMap: string;     // Path/URL to classification result map
  confidenceMap?: string;        // Path/URL to confidence heatmap
  
  // Performance metrics
  metrics: ClassificationMetrics;
  
  // Per-class accuracy
  classAccuracy: Record<number, number>;
  
  // Confusion matrix for detailed analysis
  confusionMatrix?: number[][];
  
  // Training curve data
  trainingHistory?: TrainingHistory;
}

/**
 * Classification performance metrics
 */
export interface ClassificationMetrics {
  overallAccuracy: number;      // Overall Accuracy (OA)
  averageAccuracy: number;      // Average Accuracy (AA)
  kappaCoefficient: number;     // Cohen's Kappa coefficient
  
  // Detailed metrics
  precision: number;
  recall: number;
  f1Score: number;
}

/**
 * Training history for visualization
 */
export interface TrainingHistory {
  epochs: number[];
  trainLoss: number[];
  valLoss: number[];
  trainAccuracy: number[];
  valAccuracy: number[];
}

/**
 * Request to create new inference task
 */
export interface CreateInferenceRequest {
  name: string;
  hsiId: number;
  modelType: ModelType;
  parameters: ModelParameters;
  useGroundTruth: boolean;      // Whether to use ground truth for supervised training
  groundTruthId?: number;       // Associated ground truth ID
}

/**
 * Paginated inference task list response
 */
export interface InferenceTaskListResponse {
  content: InferenceTask[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Model performance comparison data
 */
export interface ModelComparison {
  modelType: ModelType;
  modelName: string;
  accuracy: number;
  trainingTime: number;
  inferenceTime: number;
  paramsCount: number;
}

/**
 * Pretrained model information
 */
export interface PretrainedModel {
  id: string;
  name: string;
  modelType: ModelType;
  dataset: string;
  accuracy: number;
  description: string;
  downloadUrl: string;
}
