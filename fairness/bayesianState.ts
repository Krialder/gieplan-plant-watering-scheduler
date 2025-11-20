/**
 * Bayesian Random Walk Model for Fairness
 * 
 * Implements a Kalman filter-style Bayesian update for tracking assignment rates.
 * Smooths short-term volatility and applies drift correction toward ideal rates.
 */

import type { BayesianState } from './types';

// Configuration parameters
export const SIGMA_PROCESS_SQ = 0.005;      // Process noise variance (drift per week)
export const SIGMA_OBS_SQ = 0.05;           // Observation noise variance
export const DRIFT_THRESHOLD = 0.03;        // Threshold for drift correction
export const DRIFT_CORRECTION_ALPHA = 0.2;  // Correction rate (0-1)
const INITIAL_VARIANCE = 0.1;               // Initial uncertainty

/**
 * Initialize Bayesian state for a person
 * 
 * @param personId - Person identifier
 * @param initialRate - Initial belief about fair rate
 * @param date - Initialization date
 * @param initialVariance - Initial uncertainty (optional)
 * @returns Initialized Bayesian state
 */
export function initializeBayesianState(
  personId: string,
  initialRate: number,
  date: string,
  initialVariance: number = INITIAL_VARIANCE
): BayesianState {
  return {
    personId,
    priorMean: initialRate,
    priorVariance: initialVariance,
    observedRate: 0,
    posteriorMean: initialRate,
    posteriorVariance: initialVariance,
    lastUpdateDate: date
  };
}

/**
 * Initialize Bayesian state for a new person joining an existing system
 * 
 * This function allows new people to start with a baseline rate (from existing members)
 * rather than starting at zero. This prevents the "catch-up" problem where new people
 * get over-selected to match the cumulative assignments of long-term members.
 * 
 * The new person's initial rate is set to match the current average rate, and their
 * variance reflects uncertainty (higher than existing members who have more data).
 * 
 * @param personId - Person identifier
 * @param baselineRate - Average rate of existing members (assignments per day)
 * @param date - Initialization date
 * @param highUncertainty - Whether to use higher initial variance (default true)
 * @returns Initialized Bayesian state with baseline
 */
export function initializeBayesianStateWithBaseline(
  personId: string,
  baselineRate: number,
  date: string,
  highUncertainty: boolean = true
): BayesianState {
  // New people have higher uncertainty since we have no observations
  const variance = highUncertainty ? INITIAL_VARIANCE * 2 : INITIAL_VARIANCE;
  
  return {
    personId,
    priorMean: baselineRate,
    priorVariance: variance,
    observedRate: 0,
    posteriorMean: baselineRate,
    posteriorVariance: variance,
    lastUpdateDate: date
  };
}

/**
 * Update Bayesian state using Kalman filter
 * 
 * Mathematical model:
 *   Prior: r(t) ~ N(μ_prior, σ²_prior + σ²_process)
 *   Observation: y(t) ~ N(r(t), σ²_obs)
 *   Posterior: r(t) | y(t) ~ N(μ_posterior, σ²_posterior)
 * 
 * Kalman filter equations:
 *   K = σ²_prior / (σ²_prior + σ²_obs)  [Kalman gain]
 *   μ_posterior = μ_prior + K(y - μ_prior)
 *   σ²_posterior = (1 - K) σ²_prior
 * 
 * @param state - Current Bayesian state
 * @param assigned - Whether person was assigned this period
 * @param daysElapsed - Days since last update
 * @param idealRate - Target ideal rate
 * @returns Updated Bayesian state
 */
export function updateBayesianState(
  state: BayesianState,
  assigned: boolean,
  daysElapsed: number,
  idealRate: number
): BayesianState {
  // Process noise increases with time elapsed
  const processVariance = SIGMA_PROCESS_SQ * (daysElapsed / 7); // Normalized to weekly
  
  // Prior for this update: previous posterior + process noise
  const priorMean = state.posteriorMean;
  const priorVariance = state.posteriorVariance + processVariance;
  
  // Observed rate increment
  // If assigned, observed increment = 1 / daysElapsed (rate per day)
  // If not assigned, no new information about rate
  const observedIncrement = assigned && daysElapsed > 0 ? (1 / daysElapsed) : 0;
  const newObservedRate = state.observedRate + observedIncrement;
  
  // Kalman gain: how much to trust the observation vs. prior
  // High variance in prior → high gain (trust observation more)
  // High variance in observation → low gain (trust prior more)
  const kalmanGain = priorVariance / (priorVariance + SIGMA_OBS_SQ);
  
  // Posterior update
  // Move toward observation proportionally to Kalman gain
  let posteriorMean = priorMean + kalmanGain * (observedIncrement - priorMean);
  
  // Reduce variance (uncertainty decreases with each observation)
  const posteriorVariance = (1 - kalmanGain) * priorVariance;
  
  // Create updated state
  let updatedState: BayesianState = {
    ...state,
    priorMean,
    priorVariance,
    observedRate: newObservedRate,
    posteriorMean,
    posteriorVariance
  };
  
  // Apply drift correction if needed
  updatedState = applyDriftCorrection(updatedState, idealRate);
  
  return updatedState;
}

/**
 * Apply drift correction toward ideal rate
 * 
 * If posterior mean drifts too far from ideal rate, apply correction:
 *   μ_corrected = μ + α(r̄ - μ)
 * 
 * where α is the correction rate (0-1)
 * 
 * @param state - Current state
 * @param idealRate - Target ideal rate
 * @returns State with drift correction applied
 */
export function applyDriftCorrection(
  state: BayesianState,
  idealRate: number
): BayesianState {
  const drift = state.posteriorMean - idealRate;
  
  // Only correct if drift exceeds threshold
  if (Math.abs(drift) <= DRIFT_THRESHOLD) {
    return state;
  }
  
  // Apply proportional correction toward ideal rate
  const correction = DRIFT_CORRECTION_ALPHA * drift;
  const correctedMean = state.posteriorMean - correction;
  
  return {
    ...state,
    posteriorMean: correctedMean
  };
}

/**
 * Predict future rate without observation
 * 
 * Used for forecasting: what will the rate be in N days if no assignment occurs?
 * 
 * @param state - Current state
 * @param daysAhead - Days to predict ahead
 * @returns Predicted mean and variance
 */
export function predictFutureState(
  state: BayesianState,
  daysAhead: number
): { predictedMean: number; predictedVariance: number } {
  const processVariance = SIGMA_PROCESS_SQ * (daysAhead / 7);
  
  return {
    predictedMean: state.posteriorMean,
    predictedVariance: state.posteriorVariance + processVariance
  };
}

/**
 * Calculate confidence interval for current rate estimate
 * 
 * @param state - Current state
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @returns Lower and upper bounds of confidence interval
 */
export function getConfidenceInterval(
  state: BayesianState,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // For normal distribution, 95% CI ≈ mean ± 1.96 * std
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.99 ? 2.576 : 
                 1.96; // default to 95%
  
  const std = Math.sqrt(state.posteriorVariance);
  
  return {
    lower: Math.max(0, state.posteriorMean - zScore * std),
    upper: state.posteriorMean + zScore * std
  };
}
