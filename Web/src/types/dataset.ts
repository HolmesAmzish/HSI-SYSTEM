/**
 * Dataset Type Definitions
 * Matches server Dataset entity
 */

/**
 * Dataset info embedded in HSI response
 */
export interface DatasetInfo {
  id: number;
  name: string;
  description?: string;
  height: number | null;
  width: number | null;
  bands: number | null;
  minBand: number | null;
  maxBand: number | null;
  defaultRed: number | null;
  defaultGreen: number | null;
  defaultBlue: number | null;
}