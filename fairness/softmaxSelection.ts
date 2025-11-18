/**
 * Softmax Selection System
 * 
 * Implements probability-based selection using softmax transformation.
 * Provides balanced fairness with controlled randomness.
 */

import type { SoftmaxSelectionResult } from './types';

// Default temperature parameter
export const TEMPERATURE_DEFAULT = 1.0;

/**
 * Calculate softmax probabilities from deficits
 * 
 * Formula:
 *   p_i = exp(deficit_i / T) / Σ_j exp(deficit_j / T)
 * 
 * where T is the temperature parameter:
 * - Low T → deterministic (always select highest deficit)
 * - High T → uniform (random selection)
 * - T = 1 → balanced
 * 
 * Uses numerical stability trick: subtract max before exp
 * 
 * @param deficits - Array of deficit values
 * @param temperature - Temperature parameter (default 1.0)
 * @returns Array of probabilities (sum = 1)
 */
export function calculateSoftmaxProbabilities(
  deficits: number[],
  temperature: number = TEMPERATURE_DEFAULT
): number[] {
  if (deficits.length === 0) {
    return [];
  }
  
  // Numerical stability: subtract max before exp
  const maxDeficit = Math.max(...deficits);
  
  // Calculate exp(deficit / temperature) for each
  const expValues = deficits.map(deficit => 
    Math.exp((deficit - maxDeficit) / temperature)
  );
  
  // Normalize to sum to 1
  const sumExp = expValues.reduce((sum, val) => sum + val, 0);
  
  return expValues.map(val => val / sumExp);
}

/**
 * Weighted random selection without replacement
 * 
 * Selects k items from n according to probability weights.
 * Renormalizes probabilities after each selection.
 * 
 * @param probabilities - Selection probabilities for each item
 * @param k - Number of items to select
 * @returns Array of selected indices
 */
export function weightedRandomSelection(
  probabilities: number[],
  k: number
): number[] {
  const selected: number[] = [];
  const available = probabilities.map((prob, idx) => ({ prob, idx }));
  
  for (let i = 0; i < Math.min(k, probabilities.length); i++) {
    if (available.length === 0) break;
    
    // Calculate total probability of remaining items
    const totalProb = available.reduce((sum, item) => sum + item.prob, 0);
    
    // Random selection weighted by probability
    let rand = Math.random() * totalProb;
    let selectedIdx = 0;
    
    for (let j = 0; j < available.length; j++) {
      rand -= available[j].prob;
      if (rand <= 0) {
        selectedIdx = j;
        break;
      }
    }
    
    // Add to selected and remove from available
    selected.push(available[selectedIdx].idx);
    available.splice(selectedIdx, 1);
  }
  
  return selected;
}

/**
 * Select team using softmax probability-based selection
 * 
 * Algorithm:
 * 1. Transform deficits to probabilities via softmax
 * 2. Sample k people according to probabilities
 * 3. Return selected IDs with probabilities and deficits
 * 
 * @param personIds - Array of person IDs
 * @param deficits - Array of deficit values (parallel to personIds)
 * @param temperature - Temperature parameter for softmax
 * @param teamSize - Number of people to select
 * @returns Selection result with IDs, probabilities, and deficits
 */
export function selectWithSoftmax(
  personIds: string[],
  deficits: number[],
  temperature: number = TEMPERATURE_DEFAULT,
  teamSize: number = 2
): SoftmaxSelectionResult {
  if (personIds.length !== deficits.length) {
    throw new Error('personIds and deficits must have same length');
  }
  
  if (personIds.length === 0) {
    return {
      selectedIds: [],
      probabilities: new Map(),
      expectedDeficits: new Map()
    };
  }
  
  // Calculate softmax probabilities
  const probabilities = calculateSoftmaxProbabilities(deficits, temperature);
  
  // Weighted random selection
  const selectedIndices = weightedRandomSelection(probabilities, teamSize);
  const selectedIds = selectedIndices.map(idx => personIds[idx]);
  
  // Build probability map
  const probabilityMap = new Map<string, number>();
  for (let i = 0; i < personIds.length; i++) {
    probabilityMap.set(personIds[i], probabilities[i]);
  }
  
  // Build deficit map
  const deficitMap = new Map<string, number>();
  for (let i = 0; i < personIds.length; i++) {
    deficitMap.set(personIds[i], deficits[i]);
  }
  
  return {
    selectedIds,
    probabilities: probabilityMap,
    expectedDeficits: deficitMap
  };
}

/**
 * Select team with automatic temperature adjustment
 * 
 * Adjusts temperature based on fairness variance:
 * - High variance → lower temperature (more deterministic, fix unfairness faster)
 * - Low variance → higher temperature (more exploration, prevent monotony)
 * 
 * @param personIds - Array of person IDs
 * @param deficits - Array of deficit values
 * @param variance - Current variance in assignment rates
 * @param teamSize - Number of people to select
 * @returns Selection result
 */
export function selectWithAdaptiveTemperature(
  personIds: string[],
  deficits: number[],
  variance: number,
  teamSize: number = 2
): SoftmaxSelectionResult {
  // Adaptive temperature: inversely proportional to variance
  // High variance → low temperature (more deterministic)
  // Low variance → high temperature (more random)
  const baseTemp = 1.0;
  const varianceScale = 10.0; // Tuning parameter
  const temperature = baseTemp / (1 + variance * varianceScale);
  
  // Clamp temperature to reasonable range
  const clampedTemp = Math.max(0.2, Math.min(5.0, temperature));
  
  return selectWithSoftmax(personIds, deficits, clampedTemp, teamSize);
}

/**
 * Calculate expected number of assignments over N selections
 * 
 * Given probabilities, calculate E[assignments] = Σ p_i for each person
 * 
 * @param probabilities - Map of person ID to selection probability
 * @param numSelections - Number of future selections
 * @returns Map of person ID to expected assignment count
 */
export function calculateExpectedAssignments(
  probabilities: Map<string, number>,
  numSelections: number
): Map<string, number> {
  const expected = new Map<string, number>();
  
  for (const [personId, prob] of probabilities.entries()) {
    expected.set(personId, prob * numSelections);
  }
  
  return expected;
}

/**
 * Calculate entropy of selection distribution
 * 
 * Entropy = -Σ p_i log(p_i)
 * 
 * Higher entropy = more uniform distribution (more randomness)
 * Lower entropy = more concentrated distribution (more deterministic)
 * 
 * @param probabilities - Array of probabilities
 * @returns Entropy value
 */
export function calculateEntropy(probabilities: number[]): number {
  let entropy = 0;
  
  for (const p of probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}
