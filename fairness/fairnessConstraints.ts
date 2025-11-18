/**
 * Fairness Constraints System
 * 
 * Implements mathematical constraints to ensure fairness over time.
 * Monitors violations and generates corrective actions.
 */

import type { 
  FairnessConstraints, 
  FairnessViolation, 
  CorrectiveAction,
  FairnessMetrics 
} from './types';

// Default constraint values
export const DEFAULT_CONSTRAINTS: FairnessConstraints = {
  maxCumulativeDeficit: 2.0,  // B(t) coefficient: bound = 2.0 * sqrt(tenure)
  maxVariance: 0.05,           // Maximum variance in assignment rates
  rollingWindowWeeks: 26       // 6 months rolling window
};

/**
 * Check if fairness constraints are satisfied
 * 
 * Constraints:
 * 1. Individual fairness: |cumulative_deficit(p_i)| ≤ β * sqrt(tenure_i)
 * 2. Group fairness: Var(rates) ≤ σ²_max
 * 
 * @param rates - Assignment rates for all people (assignments per day)
 * @param deficits - Cumulative deficits for all people
 * @param tenures - Tenure in days for all people
 * @param constraints - Constraint configuration
 * @returns Constraint check result with violations
 */
export function checkFairnessConstraints(
  rates: number[],
  deficits: number[],
  tenures: number[],
  constraints: FairnessConstraints
): { satisfied: boolean; violations: FairnessViolation[] } {
  const violations: FairnessViolation[] = [];
  const timestamp = new Date().toISOString();
  
  if (rates.length === 0) {
    return { satisfied: true, violations: [] };
  }
  
  // Check individual cumulative deficit constraints
  for (let i = 0; i < deficits.length; i++) {
    const deficit = deficits[i];
    const tenure = tenures[i];
    
    // Bound grows sublinearly with time: B(t) = β * sqrt(t)
    const bound = constraints.maxCumulativeDeficit * Math.sqrt(tenure);
    
    if (Math.abs(deficit) > bound) {
      violations.push({
        type: 'cumulative_deficit',
        personId: `person${i}`,
        value: deficit,
        bound,
        severity: Math.abs(deficit) / bound,
        timestamp
      });
    }
  }
  
  // Check group variance constraint
  const variance = calculateVariance(rates);
  
  if (variance > constraints.maxVariance) {
    violations.push({
      type: 'variance',
      value: variance,
      bound: constraints.maxVariance,
      severity: variance / constraints.maxVariance,
      timestamp
    });
  }
  
  return {
    satisfied: violations.length === 0,
    violations
  };
}

/**
 * Calculate comprehensive fairness metrics
 * 
 * Metrics:
 * - Variance and standard deviation
 * - Coefficient of variation (CV = σ/μ)
 * - Gini coefficient (inequality measure)
 * - Theil index (entropy-based fairness)
 * 
 * @param rates - Assignment rates for all people
 * @returns Comprehensive fairness metrics
 */
export function calculateFairnessMetrics(rates: number[]): FairnessMetrics {
  if (rates.length === 0) {
    return {
      variance: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
      giniCoefficient: 0,
      theilIndex: 0,
      maxDeficit: 0,
      minDeficit: 0,
      convergenceRate: 1.0
    };
  }
  
  // Basic statistics
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const variance = calculateVariance(rates);
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;
  
  // Gini coefficient: measure of inequality
  // G = Σᵢ Σⱼ |rᵢ - rⱼ| / (2n²μ)
  let giniSum = 0;
  for (let i = 0; i < rates.length; i++) {
    for (let j = 0; j < rates.length; j++) {
      giniSum += Math.abs(rates[i] - rates[j]);
    }
  }
  const giniCoefficient = mean > 0 
    ? giniSum / (2 * rates.length * rates.length * mean) 
    : 0;
  
  // Theil index: entropy-based measure
  // T = (1/n) Σᵢ (rᵢ/μ) log(rᵢ/μ)
  let theilSum = 0;
  for (const rate of rates) {
    if (rate > 0 && mean > 0) {
      const ratio = rate / mean;
      theilSum += ratio * Math.log(ratio);
    }
  }
  const theilIndex = rates.length > 0 ? theilSum / rates.length : 0;
  
  // Deficit range (assuming ideal rate = mean)
  const deficits = rates.map(r => mean - r);
  const maxDeficit = Math.max(...deficits);
  const minDeficit = Math.min(...deficits);
  
  // Convergence rate placeholder (to be calculated with temporal data)
  const convergenceRate = 1.0;
  
  return {
    variance,
    standardDeviation,
    coefficientOfVariation,
    giniCoefficient,
    theilIndex,
    maxDeficit,
    minDeficit,
    convergenceRate
  };
}

/**
 * Generate corrective actions for fairness violations
 * 
 * Strategy:
 * - Sort violations by severity
 * - For each violation, generate appropriate corrective action
 * - Magnitude and duration scale with severity
 * 
 * @param violations - Detected fairness violations
 * @returns List of corrective actions to apply
 */
export function applyCorrectiveActions(
  violations: FairnessViolation[]
): CorrectiveAction[] {
  const actions: CorrectiveAction[] = [];
  
  // Sort by severity (most severe first)
  const sorted = [...violations].sort((a, b) => b.severity - a.severity);
  
  for (const violation of sorted) {
    if (violation.type === 'cumulative_deficit' && violation.personId) {
      // For deficit violations, apply priority boost
      const magnitude = violation.severity;
      const duration = Math.ceil(violation.severity * 4); // weeks
      
      actions.push({
        personId: violation.personId,
        action: violation.value > 0 ? 'priority_boost' : 'priority_penalty',
        magnitude,
        duration,
        reason: `Cumulative deficit ${violation.value.toFixed(2)} exceeds bound ${violation.bound.toFixed(2)}`
      });
    }
  }
  
  return actions;
}

/**
 * Calculate variance of an array
 * 
 * @param values - Array of numbers
 * @returns Variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Evaluate convergence rate
 * 
 * Measures how fast variance is decreasing over time.
 * 
 * Theoretical bound: Var(t) ≤ C / sqrt(t)
 * Convergence rate = actual_variance / theoretical_bound
 * 
 * @param variance - Current variance
 * @param totalWeeks - Total weeks of operation
 * @returns Convergence rate (< 1 = faster than theory, > 1 = slower)
 */
export function evaluateConvergenceRate(
  variance: number,
  totalWeeks: number
): number {
  if (totalWeeks === 0) return 1.0;
  
  const theoreticalBound = 1.0 / Math.sqrt(totalWeeks);
  return variance / theoreticalBound;
}

/**
 * Check if system is converging to fairness
 * 
 * Checks if variance is decreasing over time
 * 
 * @param varianceHistory - History of variance measurements
 * @param windowSize - Window size for trend detection
 * @returns True if converging (variance trending down)
 */
export function isConverging(
  varianceHistory: number[],
  windowSize: number = 5
): boolean {
  if (varianceHistory.length < windowSize) {
    return false;
  }
  
  const recent = varianceHistory.slice(-windowSize);
  const older = varianceHistory.slice(-windowSize * 2, -windowSize);
  
  if (older.length === 0) return false;
  
  const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderMean = older.reduce((a, b) => a + b, 0) / older.length;
  
  return recentMean < olderMean;
}
