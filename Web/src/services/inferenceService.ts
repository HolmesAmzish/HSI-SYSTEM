/**
 * Inference Service
 * API calls for inference task management
 */

import type {
  InferenceTask,
  InferenceTaskListResponse,
  CreateInferenceRequest,
  ModelInfo,
  PretrainedModel,
  ModelComparison,
  InferenceResult,
} from '@/types/inference';
import type { ModelType, ModelParameters } from '@/types/inference';

const API_BASE = '/api/inference';

/**
 * Available models with their default configurations
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'SPECTRALNET',
    name: '光谱网络 (SpectralNet)',
    description: '专注于光谱特征提取的深度网络，适用于光谱特征明显的数据集',
    supportedBands: [10, 20, 30, 50, 100],
    defaultParams: {
      patchSize: 1,
      numComponents: 30,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      useAugmentation: false,
      flipProb: 0,
      rotateProb: 0,
      dropoutRate: 0.3,
      l2Regularization: 0.0001,
    },
  },
  {
    id: 'SPATIALNET',
    name: '空间网络 (SpatialNet)',
    description: '专注于空间特征提取的卷积网络，适用于空间结构明显的数据集',
    supportedBands: [3, 10, 20, 30],
    defaultParams: {
      patchSize: 9,
      numComponents: 3,
      learningRate: 0.0005,
      batchSize: 16,
      epochs: 150,
      useAugmentation: true,
      flipProb: 0.5,
      rotateProb: 0.3,
      dropoutRate: 0.4,
      l2Regularization: 0.0005,
    },
  },
  {
    id: 'SSRN',
    name: '光谱-空间残差网络 (SSRN)',
    description: '结合光谱和空间特征的残差网络，平衡光谱和空间信息',
    supportedBands: [10, 20, 30, 50],
    defaultParams: {
      patchSize: 7,
      numComponents: 20,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 200,
      useAugmentation: true,
      flipProb: 0.5,
      rotateProb: 0.2,
      dropoutRate: 0.2,
      l2Regularization: 0.0001,
    },
  },
  {
    id: 'HYBRIDSN',
    name: '混合光谱网络 (HybridSN)',
    description: '3D-2D混合卷积网络，同时捕获光谱和空间特征',
    supportedBands: [10, 20, 30, 50, 100],
    defaultParams: {
      patchSize: 11,
      numComponents: 30,
      learningRate: 0.001,
      batchSize: 16,
      epochs: 100,
      useAugmentation: true,
      flipProb: 0.5,
      rotateProb: 0.3,
      dropoutRate: 0.3,
      l2Regularization: 0.0001,
    },
  },
  {
    id: 'TRANSFORMER',
    name: 'Transformer模型',
    description: '基于Vision Transformer的模型，适合大规模数据集',
    supportedBands: [20, 50, 100, 200],
    defaultParams: {
      patchSize: 9,
      numComponents: 50,
      learningRate: 0.0001,
      batchSize: 8,
      epochs: 300,
      useAugmentation: true,
      flipProb: 0.5,
      rotateProb: 0.5,
      dropoutRate: 0.1,
      l2Regularization: 0.00001,
    },
  },
  {
    id: 'CUSTOM',
    name: '自定义模型',
    description: '用户自定义模型架构，可灵活配置参数',
    supportedBands: [1, 3, 10, 20, 30, 50, 100, 200],
    defaultParams: {
      patchSize: 7,
      numComponents: 30,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      useAugmentation: true,
      flipProb: 0.5,
      rotateProb: 0.3,
      dropoutRate: 0.3,
      l2Regularization: 0.0001,
    },
  },
];

/**
 * Get all inference tasks with pagination
 */
export async function getInferenceTasks(
  page: number = 0,
  size: number = 20
): Promise<InferenceTaskListResponse> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks?page=${page}&size=${size}`);
  // if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  // return response.json();
  
  // Mock data for development
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size,
    number: page,
  };
}

/**
 * Create new inference task
 */
export async function createInferenceTask(
  request: CreateInferenceRequest
): Promise<InferenceTask> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // });
  // if (!response.ok) throw new Error(`Failed to create task: ${response.statusText}`);
  // return response.json();
  
  throw new Error('API not implemented');
}

/**
 * Get inference task by ID
 */
export async function getInferenceTask(taskId: string): Promise<InferenceTask> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}`);
  // if (!response.ok) throw new Error(`Failed to fetch task: ${response.statusText}`);
  // return response.json();
  
  throw new Error('API not implemented');
}

/**
 * Delete inference task
 */
export async function deleteInferenceTask(taskId: string): Promise<void> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
  // if (!response.ok) throw new Error(`Failed to delete task: ${response.statusText}`);
  
  throw new Error('API not implemented');
}

/**
 * Cancel running inference task
 */
export async function cancelInferenceTask(taskId: string): Promise<void> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, { method: 'POST' });
  // if (!response.ok) throw new Error(`Failed to cancel task: ${response.statusText}`);
  
  throw new Error('API not implemented');
}

/**
 * Get inference result
 */
export async function getInferenceResult(taskId: string): Promise<InferenceResult> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}/result`);
  // if (!response.ok) throw new Error(`Failed to fetch result: ${response.statusText}`);
  // return response.json();
  
  throw new Error('API not implemented');
}

/**
 * Get classification map image
 */
export async function getClassificationMap(taskId: string): Promise<string> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}/classification-map`);
  // if (!response.ok) throw new Error(`Failed to fetch map: ${response.statusText}`);
  // const blob = await response.blob();
  // return URL.createObjectURL(blob);
  
  throw new Error('API not implemented');
}

/**
 * Get confidence map image
 */
export async function getConfidenceMap(taskId: string): Promise<string> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/tasks/${taskId}/confidence-map`);
  // if (!response.ok) throw new Error(`Failed to fetch map: ${response.statusText}`);
  // const blob = await response.blob();
  // return URL.createObjectURL(blob);
  
  throw new Error('API not implemented');
}

/**
 * Get available pretrained models
 */
export async function getPretrainedModels(): Promise<PretrainedModel[]> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/pretrained-models`);
  // if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
  // return response.json();
  
  return [];
}

/**
 * Get model comparison data
 */
export async function getModelComparison(hsiId: number): Promise<ModelComparison[]> {
  // TODO: Implement API call
  // const response = await fetch(`${API_BASE}/model-comparison?hsiId=${hsiId}`);
  // if (!response.ok) throw new Error(`Failed to fetch comparison: ${response.statusText}`);
  // return response.json();
  
  return [];
}

/**
 * Get model info by type
 */
export function getModelInfo(modelType: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelType);
}

/**
 * Get default parameters for model
 */
export function getDefaultParameters(modelType: ModelType): ModelParameters {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelType);
  return model?.defaultParams || AVAILABLE_MODELS[0].defaultParams;
}

/**
 * Validate model parameters
 */
export function validateParameters(
  params: ModelParameters,
  numBands: number
): string[] {
  const errors: string[] = [];
  
  if (params.patchSize < 1 || params.patchSize > 25) {
    errors.push('Patch size must be between 1 and 25');
  }
  
  if (params.numComponents < 1 || params.numComponents > numBands) {
    errors.push(`Number of components must be between 1 and ${numBands}`);
  }
  
  if (params.learningRate <= 0 || params.learningRate > 1) {
    errors.push('Learning rate must be between 0 and 1');
  }
  
  if (params.batchSize < 1 || params.batchSize > 512) {
    errors.push('Batch size must be between 1 and 512');
  }
  
  if (params.epochs < 1 || params.epochs > 10000) {
    errors.push('Epochs must be between 1 and 10000');
  }
  
  if (params.dropoutRate < 0 || params.dropoutRate > 1) {
    errors.push('Dropout rate must be between 0 and 1');
  }
  
  return errors;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PROCESSING':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'FAILED':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'PENDING':
    default:
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  }
}

/**
 * Get status label in Chinese
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return '已完成';
    case 'PROCESSING':
      return '处理中';
    case 'FAILED':
      return '失败';
    case 'PENDING':
      return '待处理';
    default:
      return status;
  }
}

/**
 * Get model name in Chinese
 */
export function getModelName(modelType: string): string {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelType);
  return model?.name || modelType;
}
