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
  
  constructor(constraints: FairnessConstraints = DEFAULT_CONSTRAINTS) {
    this.bayesianStates = new Map();
    this.correctiveActions = new Map();
    this.constraints = constraints;
  }
  
  /**
   * Initialize or update Bayesian state for a person
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
   */
  updateAfterAssignment(
    personId: string,
    assigned: boolean,
    daysElapsed: number,
    idealRate: number
  ): void {
    const currentState = this.bayesianStates.get(personId);
    if (!currentState) {
      throw new Error(`No Bayesian state found for person ${personId}`);
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
    
    // Check constraints
    const { violations } = checkFairnessConstraints(
      rates,
      deficits,
      tenures,
      this.constraints
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
   * Clear expired corrective actions
   */
  clearExpiredActions(currentWeek: number): void {
    for (const [personId, action] of this.correctiveActions.entries()) {
      // This is simplified - in real implementation, track start week
      // For now, just clear all actions after duration
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
   * Reset engine state
   */
  reset(): void {
    this.bayesianStates.clear();
    this.correctiveActions.clear();
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
