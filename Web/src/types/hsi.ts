/**
 * Hyperspectral Image Data Structure
 */
export interface HsiData {
  cube: Float32Array;
  height: number;
  width: number;
  bands: number;
  dataType: 'float32' | 'float64' | 'int16' | 'uint8';
}

/**
 * RGB Band Selection Configuration
 */
export interface RgbBandConfig {
  redBand: number;
  greenBand: number;
  blueBand: number;
}

/**
 * File metadata from MAT file
 */
export interface HsiFileMetadata {
  name: string;
  path: string;
  type: 'mat' | 'bin';
  size?: number;
}
