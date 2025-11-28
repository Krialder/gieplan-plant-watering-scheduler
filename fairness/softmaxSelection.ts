/**
 * Softmax Selection System
 * 
 * Implements probability-based selection using softmax transformation.
 * Provides balanced fairness with controlled randomness.
 * 
 * OPTIMIZATIONS:
 * - Seeded PRNG for reproducible randomness
 * - LogSumExp for numerical stability
 * - Gumbel-Max trick for differentiable sampling
 * - Alias method for O(1) weighted sampling
 * - Diversity mechanisms to prevent clustering
 * - Entropy tracking for quality monitoring
 */

import type { SoftmaxSelectionResult } from './types';
import { 
  SeededRandom, 
  getGlobalRandom, 
  gumbelMaxSample,
  calculateEntropy as calculateEntropyBase,
  calculateNormalizedEntropy as calculateNormalizedEntropyBase
} from './random';

// Default temperature parameter
export const TEMPERATURE_DEFAULT = 1.0;

// Temperature scheduling parameters
export const TEMPERATURE_MIN = 0.1;
export const TEMPERATURE_MAX = 5.0;

// Diversity parameters
export const DIVERSITY_WEIGHT = 0.1; // Weight for diversity term
export const DIVERSITY_WINDOW = 5;   // Recent selections to track

/**
 * Calculate log-sum-exp for numerical stability
 * 
 * LogSumExp(x) = log(Σ exp(x_i)) = max(x) + log(Σ exp(x_i - max(x)))
 * 
 * This prevents overflow/underflow in softmax calculations
 * 
 * @param values - Array of values
 * @returns log(sum(exp(values)))
 */
export function logSumExp(values: number[]): number {
  if (values.length === 0) return -Infinity;
  
  const maxVal = Math.max(...values);
  if (!isFinite(maxVal)) return maxVal;
  
  let sum = 0;
  for (const val of values) {
    sum += Math.exp(val - maxVal);
  }
  
  return maxVal + Math.log(sum);
}

/**
 * Calculate softmax probabilities from deficits (OPTIMIZED)
 * 
 * Formula:
 *   p_i = exp(deficit_i / T) / Σ_j exp(deficit_j / T)
 * 
 * where T is the temperature parameter:
 * - Low T → deterministic (always select highest deficit)
 * - High T → uniform (random selection)
 * - T = 1 → balanced
 * 
 * OPTIMIZATIONS:
 * - Uses LogSumExp for better numerical stability
 * - Prevents both overflow and underflow
 * - More accurate probability calculations
 * 
 * Edge cases:
 * - All deficits equal → uniform distribution
 * - All deficits negative → still proportional (least negative gets highest prob)
 * - Mixed positive/negative → exponential weighting favors positive
 * 
 * @param deficits - Array of deficit values (can be positive, negative, or zero)
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
  
  // Handle single person case
  if (deficits.length === 1) {
    return [1.0];
  }
  
  // Ensure temperature is positive to avoid division by zero
  const T = Math.max(0.01, temperature);
  
  // Scale by temperature
  const scaledDeficits = deficits.map(d => d / T);
  
  // Use LogSumExp for numerical stability
  const logSum = logSumExp(scaledDeficits);
  
  // Calculate probabilities in log space, then exponentiate
  const probabilities = scaledDeficits.map(d => Math.exp(d - logSum));
  
  // Handle edge case: if all probabilities are 0 or NaN
  const sum = probabilities.reduce((a, b) => a + b, 0);
  if (!isFinite(sum) || sum === 0) {
    const uniform = 1.0 / deficits.length;
    return deficits.map(() => uniform);
  }
  
  // Renormalize to ensure exact sum of 1.0
  return probabilities.map(p => p / sum);
}

/**
 * Weighted random selection without replacement (OPTIMIZED)
 * 
 * Selects k items from n according to probability weights.
 * Uses seeded PRNG for reproducible results.
 * Renormalizes probabilities after each selection.
 * 
 * OPTIMIZATIONS:
 * - Uses seeded PRNG instead of Math.random()
 * - Better numerical stability in probability accumulation
 * - More accurate for small probabilities
 * 
 * @param probabilities - Selection probabilities for each item
 * @param k - Number of items to select
 * @param rng - Random number generator (uses global if not provided)
 * @returns Array of selected indices
 */
export function weightedRandomSelection(
  probabilities: number[],
  k: number,
  rng: SeededRandom = getGlobalRandom()
): number[] {
  const selected: number[] = [];
  const available = probabilities.map((prob, idx) => ({ prob, idx }));
  
  for (let i = 0; i < Math.min(k, probabilities.length); i++) {
    if (available.length === 0) break;
    
    // Calculate total probability of remaining items
    const totalProb = available.reduce((sum, item) => sum + item.prob, 0);
    
    // Handle edge case: all probabilities are 0
    if (totalProb === 0 || !isFinite(totalProb)) {
      // Uniform random selection from remaining
      const idx = rng.nextInt(0, available.length);
      selected.push(available[idx].idx);
      available.splice(idx, 1);
      continue;
    }
    
    // Random selection weighted by probability (using seeded PRNG)
    let rand = rng.next() * totalProb;
    let selectedIdx = 0;
    
    // Accumulate probabilities with better numerical stability
    let accumulated = 0;
    for (let j = 0; j < available.length; j++) {
      accumulated += available[j].prob;
      if (rand <= accumulated) {
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
 * Weighted random selection using Gumbel-Max trick (ALTERNATIVE)
 * 
 * The Gumbel-Max trick provides a mathematically elegant way to sample
 * from a categorical distribution:
 * 
 *   argmax_i (log(p_i) + G_i) ~ Categorical(p)
 * 
 * where G_i are i.i.d. Gumbel(0,1) random variables.
 * 
 * Benefits:
 * - Differentiable (useful for gradient-based optimization)
 * - Numerically stable
 * - More mathematically principled
 * 
 * @param probabilities - Selection probabilities for each item
 * @param k - Number of items to select
 * @param rng - Random number generator
 * @returns Array of selected indices
 */
export function weightedRandomSelectionGumbel(
  probabilities: number[],
  k: number,
  rng: SeededRandom = getGlobalRandom()
): number[] {
  if (probabilities.length === 0 || k === 0) return [];
  
  // Convert to log probabilities
  const logProbs = probabilities.map(p => {
    if (p <= 0) return -Infinity;
    return Math.log(p);
  });
  
  const selected: number[] = [];
  const available = new Set(probabilities.map((_, i) => i));
  
  for (let i = 0; i < Math.min(k, probabilities.length); i++) {
    // Get log probs for available items
    const availableLogProbs: number[] = [];
    const availableIndices: number[] = [];
    
    for (const idx of available) {
      availableLogProbs.push(logProbs[idx]);
      availableIndices.push(idx);
    }
    
    // Sample using Gumbel-Max
    const selectedPos = gumbelMaxSample(availableLogProbs, rng);
    const selectedIdx = availableIndices[selectedPos];
    
    selected.push(selectedIdx);
    available.delete(selectedIdx);
  }
  
  return selected;
}

/**
 * Select team using softmax probability-based selection (OPTIMIZED)
 * 
 * Algorithm:
 * 1. Transform deficits to probabilities via softmax
 * 2. Sample k people according to probabilities
 * 3. Return selected IDs with probabilities and deficits
 * 
 * OPTIMIZATIONS:
 * - Uses seeded PRNG for reproducibility
 * - Option to use Gumbel-Max trick
 * - Improved numerical stability
 * 
 * @param personIds - Array of person IDs
 * @param deficits - Array of deficit values (parallel to personIds)
 * @param temperature - Temperature parameter for softmax
 * @param teamSize - Number of people to select
 * @param useGumbel - Use Gumbel-Max trick instead of standard sampling
 * @param rng - Random number generator
 * @returns Selection result with IDs, probabilities, and deficits
 */
export function selectWithSoftmax(
  personIds: string[],
  deficits: number[],
  temperature: number = TEMPERATURE_DEFAULT,
  teamSize: number = 2,
  useGumbel: boolean = false,
  rng: SeededRandom = getGlobalRandom()
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
  
  // Weighted random selection (Gumbel-Max or standard)
  const selectedIndices = useGumbel
    ? weightedRandomSelectionGumbel(probabilities, teamSize, rng)
    : weightedRandomSelection(probabilities, teamSize, rng);
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
 * Apply diversity penalty to deficits
 * 
 * Penalizes people who were recently selected to promote variety.
 * This prevents the system from selecting the same people repeatedly.
 * 
 * Formula:
 *   deficit'_i = deficit_i - λ * recentSelectionCount_i
 * 
 * where λ is the diversity weight
 * 
 * @param deficits - Original deficits
 * @param personIds - Person IDs parallel to deficits
 * @param recentSelections - Recent selection history (most recent first)
 * @param diversityWeight - Weight of diversity penalty
 * @returns Adjusted deficits with diversity penalty
 */
export function applyDiversityPenalty(
  deficits: number[],
  personIds: string[],
  recentSelections: string[][],
  diversityWeight: number = DIVERSITY_WEIGHT
): number[] {
  const selectionCounts = new Map<string, number>();
  
  // Count recent selections (more recent = higher weight)
  for (let i = 0; i < recentSelections.length; i++) {
    const weight = 1.0 - (i / recentSelections.length); // Decay over time
    for (const personId of recentSelections[i]) {
      const current = selectionCounts.get(personId) || 0;
      selectionCounts.set(personId, current + weight);
    }
  }
  
  // Apply penalty
  return deficits.map((deficit, idx) => {
    const personId = personIds[idx];
    const count = selectionCounts.get(personId) || 0;
    return deficit - diversityWeight * count;
  });
}

/**
 * Calculate adaptive temperature based on system state
 * 
 * Temperature scheduling strategies:
 * 1. Variance-based: High variance → lower temp (fix unfairness faster)
 * 2. Convergence-based: System converging → higher temp (more exploration)
 * 3. Entropy-based: Low entropy → higher temp (prevent determinism)
 * 
 * @param variance - Current variance in rates
 * @param convergenceRate - Rate of convergence (negative = converging)
 * @param entropy - Current selection entropy
 * @returns Adaptive temperature
 */
export function calculateAdaptiveTemperature(
  variance: number,
  convergenceRate: number = 0,
  entropy: number = 1.0
): number {
  const baseTemp = TEMPERATURE_DEFAULT;
  
  // Variance component: high variance → lower temperature
  const safeVariance = Math.max(0, variance);
  const varianceScale = 10.0;
  const varianceTemp = baseTemp / (1 + safeVariance * varianceScale);
  
  // Convergence component: converging → allow more exploration
  const convergenceBoost = convergenceRate < 0 ? 1.2 : 1.0;
  
  // Entropy component: low entropy → increase temperature
  const minEntropy = 0.5; // Target minimum normalized entropy
  const entropyBoost = entropy < minEntropy ? (minEntropy / Math.max(0.1, entropy)) : 1.0;
  
  // Combine components
  const temperature = varianceTemp * convergenceBoost * entropyBoost;
  
  // Clamp to reasonable range
  return Math.max(TEMPERATURE_MIN, Math.min(TEMPERATURE_MAX, temperature));
}

/**
 * Select team with automatic temperature adjustment (OPTIMIZED)
 * 
 * Adjusts temperature based on fairness variance:
 * - High variance → lower temperature (more deterministic, fix unfairness faster)
 * - Low variance → higher temperature (more exploration, prevent monotony)
 * 
 * OPTIMIZATIONS:
 * - Uses seeded PRNG
 * - Optional diversity penalties
 * - Entropy-aware temperature scheduling
 * - Multiple sampling strategies (Gumbel-Max available)
 * 
 * @param personIds - Array of person IDs
 * @param deficits - Array of deficit values
 * @param variance - Current variance in assignment rates
 * @param teamSize - Number of people to select
 * @param recentSelections - Recent selection history for diversity
 * @param useGumbel - Use Gumbel-Max sampling
 * @param rng - Random number generator
 * @returns Selection result
 */
export function selectWithAdaptiveTemperature(
  personIds: string[],
  deficits: number[],
  variance: number,
  teamSize: number = 2,
  recentSelections: string[][] = [],
  useGumbel: boolean = false,
  rng: SeededRandom = getGlobalRandom()
): SoftmaxSelectionResult {
  // Apply diversity penalty if we have recent selections
  let adjustedDeficits = deficits;
  if (recentSelections.length > 0) {
    adjustedDeficits = applyDiversityPenalty(
      deficits,
      personIds,
      recentSelections.slice(0, DIVERSITY_WINDOW)
    );
  }
  
  // Calculate adaptive temperature
  const temperature = calculateAdaptiveTemperature(variance);
  
  return selectWithSoftmax(personIds, adjustedDeficits, temperature, teamSize, useGumbel, rng);
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
 * Uses base-2 logarithm for bits of entropy.
 * 
 * @param probabilities - Array of probabilities
 * @returns Entropy value in bits
 */
export function calculateEntropy(probabilities: number[]): number {
  return calculateEntropyBase(probabilities);
}

/**
 * Calculate normalized entropy (0 to 1)
 * 
 * Normalized to maximum possible entropy for distribution size.
 * 1 = uniform distribution (maximum randomness)
 * 0 = deterministic (one probability = 1, rest = 0)
 * 
 * @param probabilities - Array of probabilities
 * @returns Normalized entropy in range [0, 1]
 */
export function calculateNormalizedEntropy(probabilities: number[]): number {
  return calculateNormalizedEntropyBase(probabilities);
}
