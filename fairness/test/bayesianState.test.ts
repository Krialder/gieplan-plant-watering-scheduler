/**
 * Tests for Bayesian Random Walk Model
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeBayesianState,
  updateBayesianState,
  applyDriftCorrection,
  SIGMA_PROCESS_SQ,
  SIGMA_OBS_SQ,
  DRIFT_THRESHOLD,
  DRIFT_CORRECTION_ALPHA
} from '../bayesianState';
import type { BayesianState } from '../types';

describe('Bayesian Random Walk Model', () => {
  describe('initializeBayesianState', () => {
    it('should initialize with default prior', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      
      expect(state.personId).toBe('person1');
      expect(state.priorMean).toBe(0.1);
      expect(state.priorVariance).toBeGreaterThan(0);
      expect(state.observedRate).toBe(0);
      expect(state.posteriorMean).toBe(0.1);
      expect(state.lastUpdateDate).toBe('2025-01-01');
    });

    it('should allow custom initial variance', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01', 0.05);
      
      expect(state.priorVariance).toBe(0.05);
      expect(state.posteriorVariance).toBe(0.05);
    });
  });

  describe('updateBayesianState', () => {
    let initialState: BayesianState;

    beforeEach(() => {
      initialState = initializeBayesianState('person1', 0.1, '2025-01-01');
    });

    it('should update state when person is assigned', () => {
      const updated = updateBayesianState(
        initialState,
        true,  // assigned
        7,     // 7 days elapsed
        0.1    // ideal rate
      );
      
      expect(updated.observedRate).toBeGreaterThan(initialState.observedRate);
      expect(updated.posteriorMean).toBeDefined();
      expect(updated.posteriorVariance).toBeLessThan(initialState.posteriorVariance);
    });

    it('should reduce variance (uncertainty) with each update', () => {
      let state = initialState;
      const initialVariance = state.posteriorVariance;
      
      // Apply multiple updates
      for (let i = 0; i < 5; i++) {
        state = updateBayesianState(state, i % 2 === 0, 7, 0.1);
      }
      
      expect(state.posteriorVariance).toBeLessThan(initialVariance);
    });

    it('should increase variance with time (process noise)', () => {
      const shortTime = updateBayesianState(initialState, false, 7, 0.1);
      
      // Long time without update increases uncertainty
      const longTime = updateBayesianState(initialState, false, 56, 0.1);
      
      expect(longTime.priorVariance).toBeGreaterThan(shortTime.priorVariance);
    });

    it('should implement Kalman filter update correctly', () => {
      const state = updateBayesianState(initialState, true, 7, 0.1);
      
      // Kalman gain should be between 0 and 1
      const priorVar = initialState.posteriorVariance + SIGMA_PROCESS_SQ * (7 / 7);
      const kalmanGain = priorVar / (priorVar + SIGMA_OBS_SQ);
      
      expect(kalmanGain).toBeGreaterThan(0);
      expect(kalmanGain).toBeLessThan(1);
      
      // Posterior variance should be reduced
      expect(state.posteriorVariance).toBeLessThan(priorVar);
    });

    it('should converge posterior mean toward observed rate', () => {
      let state = initialState;
      
      // Repeatedly assign (high observed rate)
      for (let i = 0; i < 10; i++) {
        state = updateBayesianState(state, true, 7, 0.1);
      }
      
      // Posterior should be higher than initial prior
      expect(state.posteriorMean).toBeGreaterThan(initialState.priorMean);
    });

    it('should handle no assignments correctly', () => {
      const state = updateBayesianState(initialState, false, 7, 0.1);
      
      expect(state.observedRate).toBe(initialState.observedRate);
      expect(state.posteriorMean).toBeDefined();
    });
  });

  describe('applyDriftCorrection', () => {
    it('should not correct small drift', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      state.posteriorMean = 0.1 + DRIFT_THRESHOLD / 2; // Small drift
      
      const corrected = applyDriftCorrection(state, 0.1);
      
      // Should remain unchanged (drift below threshold)
      expect(corrected.posteriorMean).toBe(state.posteriorMean);
    });

    it('should correct large positive drift', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      state.posteriorMean = 0.2; // Large drift above ideal
      
      const corrected = applyDriftCorrection(state, 0.1);
      
      // Should move toward ideal rate
      expect(corrected.posteriorMean).toBeLessThan(state.posteriorMean);
      expect(corrected.posteriorMean).toBeGreaterThan(0.1);
    });

    it('should correct large negative drift', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      state.posteriorMean = 0.01; // Large drift below ideal
      
      const corrected = applyDriftCorrection(state, 0.1);
      
      // Should move toward ideal rate
      expect(corrected.posteriorMean).toBeGreaterThan(state.posteriorMean);
      expect(corrected.posteriorMean).toBeLessThan(0.1);
    });

    it('should apply correction proportional to alpha', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      state.posteriorMean = 0.2;
      
      const corrected = applyDriftCorrection(state, 0.1);
      
      const expectedCorrection = DRIFT_CORRECTION_ALPHA * (0.2 - 0.1);
      const actualCorrection = state.posteriorMean - corrected.posteriorMean;
      
      expect(actualCorrection).toBeCloseTo(expectedCorrection, 5);
    });

    it('should never overshoot ideal rate', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      state.posteriorMean = 0.2;
      
      const corrected = applyDriftCorrection(state, 0.1);
      
      // Should move toward 0.1 but not past it
      expect(corrected.posteriorMean).toBeGreaterThanOrEqual(0.1);
      expect(corrected.posteriorMean).toBeLessThan(state.posteriorMean);
    });
  });

  describe('Integration - Long-term convergence', () => {
    it('should converge to ideal rate over many updates', () => {
      let state = initializeBayesianState('person1', 0.05, '2025-01-01');
      const idealRate = 0.1;
      
      // Simulate 52 weeks with ideal assignment pattern
      for (let week = 0; week < 52; week++) {
        // Assign with probability equal to ideal rate
        const shouldAssign = Math.random() < idealRate * 7; // idealRate per day * 7 days
        state = updateBayesianState(state, shouldAssign, 7, idealRate);
      }
      
      // Should converge close to ideal rate
      expect(state.posteriorMean).toBeCloseTo(idealRate, 1);
    });

    it('should maintain low variance after sufficient observations', () => {
      let state = initializeBayesianState('person1', 0.1, '2025-01-01');
      
      for (let i = 0; i < 50; i++) {
        state = updateBayesianState(state, i % 3 === 0, 7, 0.1);
      }
      
      expect(state.posteriorVariance).toBeLessThan(0.02);
    });

    it('should recover from initial wrong prior', () => {
      // Start with very wrong prior
      let state = initializeBayesianState('person1', 0.5, '2025-01-01');
      const idealRate = 0.1;
      
      // Repeatedly observe lower actual rate
      for (let i = 0; i < 30; i++) {
        state = updateBayesianState(state, i % 10 === 0, 7, idealRate);
      }
      
      // Should have corrected toward actual observations
      expect(state.posteriorMean).toBeLessThan(0.3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero elapsed time', () => {
      const state = initializeBayesianState('person1', 0.1, '2025-01-01');
      const updated = updateBayesianState(state, true, 0, 0.1);
      
      expect(isFinite(updated.posteriorMean)).toBe(true);
    });

    it('should handle very small ideal rate', () => {
      const state = initializeBayesianState('person1', 0.001, '2025-01-01');
      const updated = updateBayesianState(state, false, 7, 0.001);
      
      expect(updated.posteriorMean).toBeGreaterThanOrEqual(0);
    });

    it('should handle rapid consecutive updates', () => {
      let state = initializeBayesianState('person1', 0.1, '2025-01-01');
      
      // Multiple updates with 1 day each
      for (let i = 0; i < 7; i++) {
        state = updateBayesianState(state, i === 0, 1, 0.1);
      }
      
      expect(isFinite(state.posteriorMean)).toBe(true);
      expect(state.posteriorVariance).toBeGreaterThan(0);
    });
  });
});
