/**
 * Dynamic Fairness Engine - Main Integration Module
 * 
 * Combines all fairness subsystems into unified API
 */

export * from './types';
export * from './penalizedPriority';
export * from './bayesianState';
export * from './fairnessConstraints';
export * from './softmaxSelection';

import type { Person, Schedule } from '../src/types';
import type { 
  BayesianState, 
  FairnessConstraints, 
  FairnessMetrics,
  CorrectiveAction 
} from './types';
import { calculatePenalizedPriority } from './penalizedPriority';
import { 
  initializeBayesianState, 
  updateBayesianState,
  getConfidenceInterval 
} from './bayesianState';
import { 
  checkFairnessConstraints, 
  calculateFairnessMetrics,
  applyCorrectiveActions,
  DEFAULT_CONSTRAINTS 
} from './fairnessConstraints';
import { 
  selectWithSoftmax,
  selectWithAdaptiveTemperature 
} from './softmaxSelection';

/**
 * Dynamic Fairness Engine
 * 
 * Main class that coordinates all fairness subsystems
 */
export class DynamicFairnessEngine {
  private bayesianStates: Map<string, BayesianState>;
  private correctiveActions: Map<string, CorrectiveAction>;
  private constraints: FairnessConstraints;
  private varianceHistory: number[] = []; // Track variance over time for convergence analysis
  private metricsHistory: FairnessMetrics[] = []; // Track all metrics over time
  
  constructor(constraints: FairnessConstraints = DEFAULT_CONSTRAINTS) {
    this.bayesianStates = new Map();
    this.correctiveActions = new Map();
    this.constraints = constraints;
  }
  
  /**
   * Initialize or update Bayesian state for a person
   * NOTE: Prefer using AdaptiveFairnessManager.initializeFromPeople() instead
   */
  initializePerson(
    personId: string,
    initialRate: number,
    date: string
  ): void {
    const state = initializeBayesianState(personId, initialRate, date);
    this.bayesianStates.set(personId, state);
  }
  
  /**
   * Update Bayesian state after an assignment
   * NOTE: Prefer using AdaptiveFairnessManager for integrated state management
   */
  updateAfterAssignment(
    personId: string,
    assigned: boolean,
    daysElapsed: number,
    idealRate: number
  ): void {
    const currentState = this.bayesianStates.get(personId);
    if (!currentState) {
      // Silently initialize if not found (for graceful degradation)
      this.initializePerson(personId, idealRate, new Date().toISOString());
      return;
    }
    
    const updated = updateBayesianState(
      currentState,
      assigned,
      daysElapsed,
      idealRate
    );
    
    this.bayesianStates.set(personId, updated);
  }
  
  /**
   * Calculate priority with penalization for a person
   */
  calculatePersonPriority(deficit: number, tenure: number): number {
    const result = calculatePenalizedPriority(deficit, tenure);
    return result.finalPriority;
  }
  
  /**
   * Check fairness constraints and generate corrective actions
   */
  checkAndCorrect(
    rates: number[],
    deficits: number[],
    tenures: number[],
    personIds: string[]
  ): { metrics: FairnessMetrics; violations: any[]; actions: CorrectiveAction[] } {
    // Calculate fairness metrics
    const metrics = calculateFairnessMetrics(rates);
    
    // Store metrics for convergence tracking
    this.metricsHistory.push(metrics);
    this.varianceHistory.push(metrics.variance);
    
    // Keep only recent history (last 100 measurements)
    if (this.varianceHistory.length > 100) {
      this.varianceHistory.shift();
      this.metricsHistory.shift();
    }
    
    // Check constraints (with person IDs for proper tracking)
    const { violations } = checkFairnessConstraints(
      rates,
      deficits,
      tenures,
      this.constraints,
      personIds // FIXED: Pass personIds to constraint checker
    );
    
    // Generate corrective actions
    const actions = applyCorrectiveActions(violations);
    
    // Store corrective actions
    for (const action of actions) {
      this.correctiveActions.set(action.personId, action);
    }
    
    return { metrics, violations, actions };
  }
  
  /**
   * Select team using adaptive softmax selection
   */
  selectTeam(
    personIds: string[],
    deficits: number[],
    variance: number,
    teamSize: number = 2
  ): string[] {
    const result = selectWithAdaptiveTemperature(
      personIds,
      deficits,
      variance,
      teamSize
    );
    
    return result.selectedIds;
  }
  
  /**
   * Select team with fixed temperature
   */
  selectTeamWithTemperature(
    personIds: string[],
    deficits: number[],
    temperature: number,
    teamSize: number = 2
  ): string[] {
    const result = selectWithSoftmax(
      personIds,
      deficits,
      temperature,
      teamSize
    );
    
    return result.selectedIds;
  }
  
  /**
   * Get confidence interval for person's rate estimate
   */
  getPersonConfidenceInterval(
    personId: string,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } | null {
    const state = this.bayesianStates.get(personId);
    if (!state) return null;
    
    return getConfidenceInterval(state, confidenceLevel);
  }
  
  /**
   * Get active corrective action for person
   */
  getCorrectiveAction(personId: string): CorrectiveAction | null {
    return this.correctiveActions.get(personId) || null;
  }
  
  /**
   * Clear expired corrective actions (optional - not currently used)
   * @deprecated Corrective actions are informational only, expiration not enforced
   */
  clearExpiredActions(currentWeek: number): void {
    // This method is kept for backwards compatibility but is not actively used
    // The corrective actions system is informational/diagnostic rather than prescriptive
    for (const [personId, action] of this.correctiveActions.entries()) {
      if (action.duration <= 0) {
        this.correctiveActions.delete(personId);
      }
    }
  }
  
  /**
   * Get all Bayesian states
   */
  getAllBayesianStates(): Map<string, BayesianState> {
    return new Map(this.bayesianStates);
  }
  
  /**
   * Get variance history for convergence analysis
   */
  getVarianceHistory(): number[] {
    return [...this.varianceHistory];
  }
  
  /**
   * Get full metrics history
   */
  getMetricsHistory(): FairnessMetrics[] {
    return [...this.metricsHistory];
  }
  
  /**
   * Check if system is converging (variance decreasing over time)
   */
  isConverging(windowSize: number = 10): boolean {
    if (this.varianceHistory.length < windowSize * 2) {
      return false; // Not enough data
    }
    
    const recent = this.varianceHistory.slice(-windowSize);
    const older = this.varianceHistory.slice(-windowSize * 2, -windowSize);
    
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderMean = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentMean < olderMean;
  }
  
  /**
   * Get convergence rate (how fast variance is decreasing)
   * Returns percentage change per measurement
   */
  getConvergenceRate(windowSize: number = 20): number {
    if (this.varianceHistory.length < windowSize) {
      return 0;
    }
    
    const recent = this.varianceHistory.slice(-windowSize);
    
    // Calculate linear regression slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < recent.length; i++) {
      sumX += i;
      sumY += recent[i];
      sumXY += i * recent[i];
      sumX2 += i * i;
    }
    
    const n = recent.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Return slope as percentage of current variance
    const currentVariance = recent[recent.length - 1];
    return currentVariance > 0 ? (slope / currentVariance) * 100 : 0;
  }
  
  /**
   * Reset engine state
   */
  reset(): void {
    this.bayesianStates.clear();
    this.correctiveActions.clear();
    this.varianceHistory = [];
    this.metricsHistory = [];
  }
}

/**
 * Create and initialize fairness engine
 */
export function createFairnessEngine(
  constraints?: FairnessConstraints
): DynamicFairnessEngine {
  return new DynamicFairnessEngine(constraints);
}
