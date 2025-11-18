/**
 * Penalized Priority Calculation with L4 Regularization
 * 
 * Implements penalty-based priority to prevent extreme deviations from fair assignment rates.
 * Uses L4 (quartic) penalty for aggressive correction of large deficits.
 */

import type { PenalizedPriorityResult } from './types';

// Configuration parameters
export const PENALTY_LAMBDA = 0.1;      // L4 penalty strength
export const TENURE_WEIGHT_SCALE = 1.0; // Tenure weight scaling
const EPSILON = 1;                       // Small constant to prevent division by zero

/**
 * Calculate penalized priority with L4 regularization
 * 
 * Formula:
 *   priority = deficit / tenure + λ · sign(deficit) · |deficit/tenure|³
 * 
 * The L4 penalty aggressively corrects large deviations:
 * - Small deficits: penalty ≈ 0 (tolerated)
 * - Large deficits: penalty grows cubically (aggressively corrected)
 * 
 * @param deficit - Expected selections minus actual selections
 * @param tenure - Days person has been in program
 * @returns Penalized priority components and final score
 */
export function calculatePenalizedPriority(
  deficit: number,
  tenure: number
): PenalizedPriorityResult {
  // Use epsilon to prevent division by zero
  const effectiveTenure = Math.max(tenure, EPSILON);
  
  // Base priority (linear in deficit/tenure)
  const basePriority = deficit / effectiveTenure;
  
  // Normalized deficit (deficit per unit tenure)
  const normalizedDeficit = deficit / effectiveTenure;
  
  // L4 penalty boost: λ · sign(d) · |d|³
  // This grows cubically, so large deviations are aggressively corrected
  const penaltyBoost = PENALTY_LAMBDA * 
                       Math.sign(normalizedDeficit) * 
                       Math.pow(Math.abs(normalizedDeficit), 3);
  
  // Tenure weight: longer tenure = more stable (less reactive to short-term fluctuations)
  // Normalized to 1 year (365 days)
  // Uses log scale so growth slows over time
  const tenureWeight = Math.log(effectiveTenure + EPSILON) / Math.log(365);
  
  // Final priority: base + penalty boost (dampened by tenure weight)
  // Longer tenure people are less volatile in their priority
  const finalPriority = basePriority + penaltyBoost * (1 / (tenureWeight + 1));
  
  return {
    basePriority,
    penaltyBoost,
    tenureWeight,
    finalPriority
  };
}

/**
 * Calculate penalty contribution only (for analysis)
 * 
 * @param deficit - Cumulative deficit
 * @param tenure - Days in program
 * @returns Penalty boost value
 */
export function calculatePenaltyBoost(deficit: number, tenure: number): number {
  const effectiveTenure = Math.max(tenure, EPSILON);
  const normalizedDeficit = deficit / effectiveTenure;
  return PENALTY_LAMBDA * Math.sign(normalizedDeficit) * Math.pow(Math.abs(normalizedDeficit), 3);
}

/**
 * Calculate optimal penalty lambda for a given deficit threshold
 * 
 * Used for parameter tuning: finds λ such that a deficit of `threshold`
 * receives a priority boost of `targetBoost`.
 * 
 * @param deficitThreshold - Deficit level to optimize for
 * @param targetBoost - Desired priority boost at threshold
 * @param tenure - Typical tenure (default 90 days)
 * @returns Optimal lambda value
 */
export function calculateOptimalLambda(
  deficitThreshold: number,
  targetBoost: number,
  tenure: number = 90
): number {
  const normalizedDeficit = deficitThreshold / tenure;
  // targetBoost = λ · |normalizedDeficit|³
  // λ = targetBoost / |normalizedDeficit|³
  return targetBoost / Math.pow(Math.abs(normalizedDeficit), 3);
}
