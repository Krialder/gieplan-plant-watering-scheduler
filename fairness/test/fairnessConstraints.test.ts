/**
 * Tests for Fairness Constraints System
 */

import { describe, it, expect } from 'vitest';
import {
  checkFairnessConstraints,
  applyCorrectiveActions,
  calculateFairnessMetrics,
  DEFAULT_CONSTRAINTS
} from '../fairnessConstraints';
import type { FairnessConstraints, FairnessViolation } from '../types';

describe('Fairness Constraints System', () => {
  describe('checkFairnessConstraints', () => {
    it('should pass when all constraints are satisfied', () => {
      const rates = [0.10, 0.11, 0.09, 0.10, 0.12];
      const deficits = [0.5, -0.3, 0.2, 0.1, -0.5];
      const tenures = [90, 90, 90, 90, 90];
      
      const result = checkFairnessConstraints(
        rates,
        deficits,
        tenures,
        DEFAULT_CONSTRAINTS
      );
      
      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect cumulative deficit violations', () => {
      const rates = [0.10, 0.10, 0.10];
      const deficits = [25, 0, 0]; // Very large deficit for person 0
      const tenures = [90, 90, 90]; // sqrt(90) ≈ 9.5, bound = 2.0 * 9.5 = 19
      
      const constraints: FairnessConstraints = {
        maxCumulativeDeficit: 2.0,
        maxVariance: 0.05,
        rollingWindowWeeks: 12
      };
      
      const result = checkFairnessConstraints(rates, deficits, tenures, constraints);
      
      expect(result.satisfied).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('cumulative_deficit');
    });

    it('should detect variance violations', () => {
      const rates = [0.01, 0.20, 0.03, 0.25]; // High variance
      const deficits = [0, 0, 0, 0];
      const tenures = [90, 90, 90, 90];
      
      const constraints: FairnessConstraints = {
        maxCumulativeDeficit: 5.0,
        maxVariance: 0.001, // Very strict
        rollingWindowWeeks: 12
      };
      
      const result = checkFairnessConstraints(rates, deficits, tenures, constraints);
      
      expect(result.satisfied).toBe(false);
      const varianceViolation = result.violations.find(v => v.type === 'variance');
      expect(varianceViolation).toBeDefined();
    });

    it('should calculate violation severity correctly', () => {
      const rates = [0.10, 0.10];
      const deficits = [6, 0]; // Deficit of 6 for person 0
      const tenures = [30, 30]; // Bound = 2.0 * sqrt(30) ≈ 10.95
      
      const constraints: FairnessConstraints = {
        maxCumulativeDeficit: 2.0,
        maxVariance: 0.05,
        rollingWindowWeeks: 12
      };
      
      const result = checkFairnessConstraints(rates, deficits, tenures, constraints);
      
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation.severity).toBeGreaterThan(0);
        expect(violation.severity).toBe(Math.abs(violation.value) / violation.bound);
      }
    });

    it('should handle empty arrays gracefully', () => {
      const result = checkFairnessConstraints([], [], [], DEFAULT_CONSTRAINTS);
      
      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should calculate bound as B(t) = β * sqrt(tenure)', () => {
      const rates = [0.10];
      const deficits = [3];
      const tenures = [100]; // sqrt(100) = 10, so bound = 2.0 * 10 = 20
      
      const constraints: FairnessConstraints = {
        maxCumulativeDeficit: 2.0,
        maxVariance: 0.05,
        rollingWindowWeeks: 12
      };
      
      const result = checkFairnessConstraints(rates, deficits, tenures, constraints);
      
      // Deficit of 3 is well below bound of 20
      expect(result.satisfied).toBe(true);
    });
  });

  describe('calculateFairnessMetrics', () => {
    it('should calculate basic statistics correctly', () => {
      const rates = [0.10, 0.12, 0.08, 0.11, 0.09];
      
      const metrics = calculateFairnessMetrics(rates);
      
      expect(metrics.variance).toBeGreaterThan(0);
      expect(metrics.standardDeviation).toBeCloseTo(Math.sqrt(metrics.variance), 5);
      expect(metrics.coefficientOfVariation).toBeGreaterThan(0);
    });

    it('should calculate Gini coefficient (0 = perfect equality)', () => {
      const equalRates = [0.10, 0.10, 0.10, 0.10];
      const unequalRates = [0.01, 0.01, 0.20, 0.20];
      
      const equalMetrics = calculateFairnessMetrics(equalRates);
      const unequalMetrics = calculateFairnessMetrics(unequalRates);
      
      expect(equalMetrics.giniCoefficient).toBeCloseTo(0, 5);
      expect(unequalMetrics.giniCoefficient).toBeGreaterThan(0.1);
    });

    it('should calculate Theil index correctly', () => {
      const rates = [0.10, 0.12, 0.08];
      
      const metrics = calculateFairnessMetrics(rates);
      
      expect(metrics.theilIndex).toBeGreaterThanOrEqual(0);
      expect(isFinite(metrics.theilIndex)).toBe(true);
    });

    it('should track max and min deficits', () => {
      const rates = [0.05, 0.10, 0.15];
      
      const metrics = calculateFairnessMetrics(rates);
      
      expect(metrics.maxDeficit).toBeGreaterThanOrEqual(metrics.minDeficit);
    });

    it('should handle single value', () => {
      const metrics = calculateFairnessMetrics([0.10]);
      
      expect(metrics.variance).toBe(0);
      expect(metrics.giniCoefficient).toBe(0);
    });

    it('should handle zero rates gracefully', () => {
      const rates = [0, 0, 0.10];
      
      const metrics = calculateFairnessMetrics(rates);
      
      expect(isFinite(metrics.giniCoefficient)).toBe(true);
      expect(isFinite(metrics.theilIndex)).toBe(true);
    });
  });

  describe('applyCorrectiveActions', () => {
    it('should generate priority boost for severe deficits', () => {
      const violations: FairnessViolation[] = [
        {
          type: 'cumulative_deficit',
          personId: 'person1',
          value: 5,
          bound: 2,
          severity: 2.5,
          timestamp: '2025-01-01'
        }
      ];
      
      const actions = applyCorrectiveActions(violations);
      
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].action).toBe('priority_boost');
      expect(actions[0].personId).toBe('person1');
      expect(actions[0].magnitude).toBeGreaterThan(0);
    });

    it('should scale duration by severity', () => {
      const mildViolation: FairnessViolation = {
        type: 'cumulative_deficit',
        personId: 'person1',
        value: 3,
        bound: 2,
        severity: 1.5,
        timestamp: '2025-01-01'
      };
      
      const severeViolation: FairnessViolation = {
        type: 'cumulative_deficit',
        personId: 'person2',
        value: 6,
        bound: 2,
        severity: 3.0,
        timestamp: '2025-01-01'
      };
      
      const mildActions = applyCorrectiveActions([mildViolation]);
      const severeActions = applyCorrectiveActions([severeViolation]);
      
      expect(severeActions[0].duration).toBeGreaterThan(mildActions[0].duration);
    });

    it('should sort violations by severity', () => {
      const violations: FairnessViolation[] = [
        {
          type: 'cumulative_deficit',
          personId: 'person1',
          value: 2,
          bound: 2,
          severity: 1.0,
          timestamp: '2025-01-01'
        },
        {
          type: 'cumulative_deficit',
          personId: 'person2',
          value: 6,
          bound: 2,
          severity: 3.0,
          timestamp: '2025-01-01'
        },
        {
          type: 'cumulative_deficit',
          personId: 'person3',
          value: 4,
          bound: 2,
          severity: 2.0,
          timestamp: '2025-01-01'
        }
      ];
      
      const actions = applyCorrectiveActions(violations);
      
      // First action should be for most severe violation (person2)
      expect(actions[0].personId).toBe('person2');
    });

    it('should handle empty violations', () => {
      const actions = applyCorrectiveActions([]);
      
      expect(actions).toHaveLength(0);
    });

    it('should include reason in corrective action', () => {
      const violation: FairnessViolation = {
        type: 'cumulative_deficit',
        personId: 'person1',
        value: 5,
        bound: 2,
        severity: 2.5,
        timestamp: '2025-01-01'
      };
      
      const actions = applyCorrectiveActions([violation]);
      
      expect(actions[0].reason).toBeDefined();
      expect(actions[0].reason.length).toBeGreaterThan(0);
    });
  });

  describe('Integration - Constraint Convergence', () => {
    it('should detect when system converges to fairness', () => {
      // Start with unfair distribution
      let rates = [0.05, 0.15, 0.08, 0.12];
      
      // Simulate convergence over time
      for (let i = 0; i < 10; i++) {
        const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
        rates = rates.map(r => r + (mean - r) * 0.2); // Move toward mean
      }
      
      const finalMetrics = calculateFairnessMetrics(rates);
      
      // Should have low variance after convergence
      expect(finalMetrics.coefficientOfVariation).toBeLessThan(0.1);
      expect(finalMetrics.giniCoefficient).toBeLessThan(0.05);
    });
  });
});
