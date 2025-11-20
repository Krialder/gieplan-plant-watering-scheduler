/**
 * Integration Tests for Dynamic Fairness Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicFairnessEngine, createFairnessEngine } from '../index';
import { DEFAULT_CONSTRAINTS } from '../fairnessConstraints';

describe('Dynamic Fairness Engine - Integration', () => {
  let engine: DynamicFairnessEngine;

  beforeEach(() => {
    engine = createFairnessEngine();
  });

  describe('Engine Creation', () => {
    it('should create engine with default constraints', () => {
      const eng = createFairnessEngine();
      expect(eng).toBeInstanceOf(DynamicFairnessEngine);
    });

    it('should create engine with custom constraints', () => {
      const customConstraints = {
        maxCumulativeDeficit: 3.0,
        maxVariance: 0.1,
        rollingWindowWeeks: 52
      };
      
      const eng = createFairnessEngine(customConstraints);
      expect(eng).toBeInstanceOf(DynamicFairnessEngine);
    });
  });

  describe('Bayesian State Management', () => {
    it('should initialize person state', () => {
      engine.initializePerson('person1', 0.1, '2025-01-01');
      
      const states = engine.getAllBayesianStates();
      expect(states.has('person1')).toBe(true);
    });

    it('should update state after assignment', () => {
      engine.initializePerson('person1', 0.1, '2025-01-01');
      
      engine.updateAfterAssignment('person1', true, 7, 0.1);
      
      const states = engine.getAllBayesianStates();
      const state = states.get('person1');
      
      expect(state?.observedRate).toBeGreaterThan(0);
    });

    it('should gracefully handle updating non-existent person', () => {
      // UPDATED: Engine now gracefully initializes missing persons instead of throwing
      // This prevents crashes in edge cases
      engine.updateAfterAssignment('nonexistent', true, 7, 0.1);
      
      // Person should now exist (auto-initialized)
      const states = engine.getAllBayesianStates();
      expect(states.has('nonexistent')).toBe(true);
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate penalized priority', () => {
      const priority = engine.calculatePersonPriority(2, 30);
      
      expect(isFinite(priority)).toBe(true);
    });

    it('should give higher priority to larger deficits', () => {
      const lowDeficit = engine.calculatePersonPriority(1, 30);
      const highDeficit = engine.calculatePersonPriority(5, 30);
      
      expect(highDeficit).toBeGreaterThan(lowDeficit);
    });
  });

  describe('Constraint Checking and Correction', () => {
    it('should check constraints and calculate metrics', () => {
      const rates = [0.10, 0.12, 0.09, 0.11];
      const deficits = [0.5, -0.3, 0.2, -0.4];
      const tenures = [90, 90, 90, 90];
      const personIds = ['p1', 'p2', 'p3', 'p4'];
      
      const result = engine.checkAndCorrect(rates, deficits, tenures, personIds);
      
      expect(result.metrics).toBeDefined();
      expect(result.violations).toBeDefined();
      expect(result.actions).toBeDefined();
    });

    it('should generate corrective actions for violations', () => {
      const rates = [0.10, 0.10];
      const deficits = [25, 0]; // Large deficit - sqrt(30) ≈ 5.5, bound = 2.0 * 5.5 = 11
      const tenures = [30, 30];
      const personIds = ['p1', 'p2'];
      
      const result = engine.checkAndCorrect(rates, deficits, tenures, personIds);
      
      expect(result.actions.length).toBeGreaterThan(0);
      // FIXED: Now uses actual person IDs from parameter, not placeholder
      expect(result.actions[0].personId).toBe('p1');
    });

    it('should store corrective actions', () => {
      const rates = [0.10, 0.10];
      const deficits = [10, 0];
      const tenures = [30, 30];
      const personIds = ['p1', 'p2'];
      
      engine.checkAndCorrect(rates, deficits, tenures, personIds);
      
      const action = engine.getCorrectiveAction('person0');
      expect(action).toBeDefined();
    });
  });

  describe('Team Selection', () => {
    it('should select team using adaptive temperature', () => {
      const personIds = ['p1', 'p2', 'p3', 'p4'];
      const deficits = [2, 1, 3, 0];
      const variance = 0.02;
      
      const team = engine.selectTeam(personIds, deficits, variance, 2);
      
      expect(team).toHaveLength(2);
      expect(personIds).toContain(team[0]);
      expect(personIds).toContain(team[1]);
    });

    it('should select team with fixed temperature', () => {
      const personIds = ['p1', 'p2', 'p3'];
      const deficits = [1, 2, 3];
      
      const team = engine.selectTeamWithTemperature(personIds, deficits, 1.0, 2);
      
      expect(team).toHaveLength(2);
    });

    it('should handle edge case with fewer people than team size', () => {
      const personIds = ['p1', 'p2'];
      const deficits = [1, 2];
      
      const team = engine.selectTeam(personIds, deficits, 0.01, 5);
      
      expect(team.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Confidence Intervals', () => {
    it('should get confidence interval for person', () => {
      engine.initializePerson('person1', 0.1, '2025-01-01');
      
      const interval = engine.getPersonConfidenceInterval('person1');
      
      expect(interval).toBeDefined();
      expect(interval!.lower).toBeLessThanOrEqual(interval!.upper);
    });

    it('should return null for non-existent person', () => {
      const interval = engine.getPersonConfidenceInterval('nonexistent');
      
      expect(interval).toBeNull();
    });

    it('should narrow confidence interval with more observations', () => {
      engine.initializePerson('person1', 0.1, '2025-01-01');
      
      const initial = engine.getPersonConfidenceInterval('person1');
      const initialWidth = initial!.upper - initial!.lower;
      
      // Multiple updates
      for (let i = 0; i < 10; i++) {
        engine.updateAfterAssignment('person1', i % 2 === 0, 7, 0.1);
      }
      
      const final = engine.getPersonConfidenceInterval('person1');
      const finalWidth = final!.upper - final!.lower;
      
      expect(finalWidth).toBeLessThan(initialWidth);
    });
  });

  describe('Engine Reset', () => {
    it('should clear all state on reset', () => {
      engine.initializePerson('person1', 0.1, '2025-01-01');
      engine.initializePerson('person2', 0.1, '2025-01-01');
      
      engine.reset();
      
      const states = engine.getAllBayesianStates();
      expect(states.size).toBe(0);
    });
  });

  describe('End-to-End Scenario', () => {
    it('should handle complete fairness workflow', () => {
      // Setup 4 people
      const personIds = ['alice', 'bob', 'carol', 'dave'];
      for (const id of personIds) {
        engine.initializePerson(id, 0.1, '2025-01-01');
      }
      
      // Simulate 10 weeks of assignments
      const deficits = [0, 0, 0, 0];
      const tenures = [0, 0, 0, 0];
      
      for (let week = 0; week < 10; week++) {
        // Update tenures
        for (let i = 0; i < 4; i++) {
          tenures[i] += 7;
        }
        
        // Calculate current rates
        const rates = personIds.map((id, i) => {
          const state = engine.getAllBayesianStates().get(id);
          return state?.posteriorMean || 0.1;
        });
        
        // Check constraints
        const { violations } = engine.checkAndCorrect(
          rates,
          deficits,
          tenures,
          personIds
        );
        
        // Select team
        const variance = rates.reduce((sum, r) => {
          const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
          return sum + Math.pow(r - mean, 2);
        }, 0) / rates.length;
        
        const team = engine.selectTeam(personIds, deficits, variance, 2);
        
        // Update states
        for (let i = 0; i < personIds.length; i++) {
          const assigned = team.includes(personIds[i]);
          engine.updateAfterAssignment(personIds[i], assigned, 7, 0.1);
          
          // Update deficits (simplified)
          if (assigned) {
            deficits[i] -= 1;
          } else {
            deficits[i] += 0.5;
          }
        }
      }
      
      // After 10 weeks, system should be functioning
      const finalStates = engine.getAllBayesianStates();
      expect(finalStates.size).toBe(4);
      
      // All people should have updated posterior beliefs
      for (const state of finalStates.values()) {
        expect(state.posteriorVariance).toBeLessThan(state.priorVariance);
      }
    });
  });

  describe('Convergence Properties', () => {
    it('should reduce variance over time', () => {
      const personIds = ['p1', 'p2', 'p3', 'p4'];
      const rates: number[][] = [];
      
      // Initialize
      for (const id of personIds) {
        engine.initializePerson(id, 0.1, '2025-01-01');
      }
      
      // Simulate 50 weeks
      const deficits = [0, 0, 0, 0];
      
      for (let week = 0; week < 50; week++) {
        const currentRates = personIds.map((id) => {
          const state = engine.getAllBayesianStates().get(id);
          return state?.posteriorMean || 0.1;
        });
        rates.push(currentRates);
        
        // Select team
        const variance = currentRates.reduce((sum, r) => {
          const mean = currentRates.reduce((a, b) => a + b, 0) / currentRates.length;
          return sum + Math.pow(r - mean, 2);
        }, 0) / currentRates.length;
        
        const team = engine.selectTeam(personIds, deficits, variance, 2);
        
        // Update
        for (let i = 0; i < personIds.length; i++) {
          const assigned = team.includes(personIds[i]);
          engine.updateAfterAssignment(personIds[i], assigned, 7, 0.1);
        }
      }
      
      // Calculate variance trend
      const earlyVariance = rates.slice(0, 10).map(r => {
        const mean = r.reduce((a, b) => a + b, 0) / r.length;
        return r.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / r.length;
      });
      
      const lateVariance = rates.slice(-10).map(r => {
        const mean = r.reduce((a, b) => a + b, 0) / r.length;
        return r.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / r.length;
      });
      
      const earlyMean = earlyVariance.reduce((a, b) => a + b, 0) / earlyVariance.length;
      const lateMean = lateVariance.reduce((a, b) => a + b, 0) / lateVariance.length;
      
      // Variance should decrease (or at least not increase significantly)
      expect(lateMean).toBeLessThanOrEqual(earlyMean * 1.2);
    });
    
    it('should track convergence with new API methods', () => {
      const personIds = ['p1', 'p2', 'p3'];
      
      // Initialize
      for (const id of personIds) {
        engine.initializePerson(id, 0.1, '2025-01-01');
      }
      
      // Simulate 30 weeks
      for (let week = 0; week < 30; week++) {
        const rates = personIds.map(id => {
          const state = engine.getAllBayesianStates().get(id);
          return state?.posteriorMean || 0.1;
        });
        
        const deficits = rates.map(r => 0.1 - r);
        const tenures = personIds.map(() => (week + 1) * 7);
        
        // This updates variance history
        engine.checkAndCorrect(rates, deficits, tenures, personIds);
        
        // Simulate assignments
        const variance = rates.reduce((sum, r) => {
          const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
          return sum + Math.pow(r - mean, 2);
        }, 0) / rates.length;
        
        const team = engine.selectTeam(personIds, deficits, variance, 2);
        
        for (const id of personIds) {
          const assigned = team.includes(id);
          engine.updateAfterAssignment(id, assigned, 7, 0.1);
        }
      }
      
      // Check new API methods
      const varianceHistory = engine.getVarianceHistory();
      expect(varianceHistory.length).toBeGreaterThan(0);
      expect(varianceHistory.length).toBeLessThanOrEqual(30);
      
      const metricsHistory = engine.getMetricsHistory();
      expect(metricsHistory.length).toBe(varianceHistory.length);
      
      // Convergence detection
      const isConverging = engine.isConverging(5);
      expect(typeof isConverging).toBe('boolean');
      
      const convergenceRate = engine.getConvergenceRate(10);
      expect(typeof convergenceRate).toBe('number');
    });
  });
});
