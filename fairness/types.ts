/**
 * Type definitions for dynamic fairness system
 */

export interface BayesianState {
  personId: string;
  priorMean: number;          // μ_prior (believed fair rate)
  priorVariance: number;      // σ²_prior (uncertainty)
  observedRate: number;       // yᵢ(t) (actual rate)
  posteriorMean: number;      // μ_posterior (updated belief)
  posteriorVariance: number;  // σ²_posterior (updated uncertainty)
  lastUpdateDate: string;
}

export interface FairnessViolation {
  type: 'cumulative_deficit' | 'variance' | 'convergence';
  personId?: string;
  value: number;
  bound: number;
  severity: number;  // value / bound
  timestamp: string;
}

export interface FairnessConstraints {
  maxCumulativeDeficit: number;  // B(t) coefficient
  maxVariance: number;            // σ²_max
  rollingWindowWeeks: number;     // Time window for moving average
}

export interface CorrectiveAction {
  personId: string;
  action: 'priority_boost' | 'priority_penalty' | 'mandatory_selection';
  magnitude: number;
  duration: number;  // in weeks
  reason: string;
}

export interface FairnessMetrics {
  variance: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  giniCoefficient: number;
  theilIndex: number;
  maxDeficit: number;
  minDeficit: number;
  convergenceRate: number;
}

export interface PenalizedPriorityResult {
  basePriority: number;
  penaltyBoost: number;
  tenureWeight: number;
  finalPriority: number;
}

export interface SoftmaxSelectionResult {
  selectedIds: string[];
  probabilities: Map<string, number>;
  expectedDeficits: Map<string, number>;
}
