/**
 * Tests for new person integration without catch-up behavior
 * 
 * Verifies that the rate-based fairness system prevents over-scheduling
 * of new people to "catch up" to existing members' cumulative totals.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicFairnessEngine, createFairnessEngine } from '../index';
import { initializeBayesianStateWithBaseline } from '../bayesianState';
import { calculatePenalizedPriority } from '../penalizedPriority';

describe('New Person Integration - No Catch-Up', () => {
  let engine: DynamicFairnessEngine;

  beforeEach(() => {
    engine = createFairnessEngine();
  });

  describe('Baseline Initialization', () => {
    it('should initialize new person with baseline rate from existing members', () => {
      // Simulate existing members with average rate of 0.1
      const existingRate = 0.1;
      
      const state = initializeBayesianStateWithBaseline(
        'newPerson',
        existingRate,
        '2025-06-01',
        true
      );
      
      expect(state.priorMean).toBe(existingRate);
      expect(state.posteriorMean).toBe(existingRate);
      expect(state.priorVariance).toBeGreaterThan(0);
    });
  });

  describe('Rate-Based Priority Calculation', () => {
    it('should use rate deficits, not cumulative deficits', () => {
      // Person A: 100 days, 10 assignments → rate = 0.1 per day
      const personA_rate = 10 / 100;
      const personA_days = 100;
      
      // Person B (new): 10 days, 1 assignment → rate = 0.1 per day
      const personB_rate = 1 / 10;
      const personB_days = 10;
      
      // Both have same rate (0.1), so deficits should be equal
      const avgRate = (personA_rate + personB_rate) / 2;
      
      const deficitA = avgRate - personA_rate;
      const deficitB = avgRate - personB_rate;
      
      expect(Math.abs(deficitA)).toBeCloseTo(0, 5);
      expect(Math.abs(deficitB)).toBeCloseTo(0, 5);
      
      // Priorities should be similar (no catch-up pressure)
      const priorityA = calculatePenalizedPriority(deficitA, personA_days);
      const priorityB = calculatePenalizedPriority(deficitB, personB_days);
      
      expect(Math.abs(priorityA.finalPriority - priorityB.finalPriority))
        .toBeLessThan(0.1);
    });

    it('should prioritize based on rate deficit, not total deficit', () => {
      // Person A: 100 days, 8 assignments → rate = 0.08 per day (below average)
      // Person B: 100 days, 12 assignments → rate = 0.12 per day (above average)
      // Person C (new): 10 days, 1 assignment → rate = 0.1 per day (average)
      
      const avgRate = (0.08 + 0.12 + 0.1) / 3; // = 0.1
      
      const deficitA = avgRate - 0.08; // +0.02 (needs assignments)
      const deficitB = avgRate - 0.12; // -0.02 (has too many)
      const deficitC = avgRate - 0.10; // 0 (perfectly average)
      
      const priorityA = calculatePenalizedPriority(deficitA, 100);
      const priorityB = calculatePenalizedPriority(deficitB, 100);
      const priorityC = calculatePenalizedPriority(deficitC, 10);
      
      // Person A should have highest priority (below average rate)
      expect(priorityA.finalPriority).toBeGreaterThan(priorityC.finalPriority);
      
      // Person B should have lowest priority (above average rate)
      expect(priorityB.finalPriority).toBeLessThan(priorityC.finalPriority);
      
      // Person C (new) should be in the middle despite low cumulative total
      expect(priorityC.finalPriority).toBeCloseTo(0, 2);
    });
  });

  describe('Integration Simulation', () => {
    it('should integrate new person without over-scheduling', () => {
      const existingPersonIds = ['alice', 'bob', 'carol'];
      
      // Initialize existing people who've been active for 14 weeks
      for (const id of existingPersonIds) {
        engine.initializePerson(id, 0.1, '2025-01-01');
      }
      
      // Simulate 14 weeks for existing people
      const assignmentsPerWeek = 2;
      const weeksBeforeNewPerson = 14;
      
      for (let week = 0; week < weeksBeforeNewPerson; week++) {
        const rates = existingPersonIds.map(id => {
          const state = engine.getAllBayesianStates().get(id);
          return state?.posteriorMean || 0.1;
        });
        
        const variance = calculateVariance(rates);
        const deficits = rates.map(r => 0.1 - r);
        
        const team = engine.selectTeam(
          existingPersonIds,
          deficits,
          variance,
          assignmentsPerWeek
        );
        
        for (const id of existingPersonIds) {
          const assigned = team.includes(id);
          engine.updateAfterAssignment(id, assigned, 7, 0.1);
        }
      }
      
      // Now add a new person
      const avgRate = 0.1; // Calculated from existing people
      engine.initializePerson('dave', avgRate, '2025-04-08');
      
      const allPersonIds = [...existingPersonIds, 'dave'];
      
      // Track assignments for next 10 weeks
      const assignmentCounts = new Map<string, number>();
      for (const id of allPersonIds) {
        assignmentCounts.set(id, 0);
      }
      
      for (let week = 0; week < 10; week++) {
        const rates = allPersonIds.map(id => {
          const state = engine.getAllBayesianStates().get(id);
          return state?.posteriorMean || 0.1;
        });
        
        const variance = calculateVariance(rates);
        const deficits = rates.map(r => 0.1 - r);
        
        const team = engine.selectTeam(
          allPersonIds,
          deficits,
          variance,
          assignmentsPerWeek
        );
        
        // Count assignments
        for (const id of team) {
          const current = assignmentCounts.get(id) || 0;
          assignmentCounts.set(id, current + 1);
        }
        
        // Update states
        for (const id of allPersonIds) {
          const assigned = team.includes(id);
          engine.updateAfterAssignment(id, assigned, 7, 0.1);
        }
      }
      
      // Check that Dave (new person) got fair share
      // In 10 weeks with 2 assignments per week = 20 total assignments
      // 4 people should get ~5 each
      const daveCount = assignmentCounts.get('dave') || 0;
      const expectedCount = (10 * assignmentsPerWeek) / allPersonIds.length;
      
      console.log('New person integration results:');
      for (const [id, count] of assignmentCounts.entries()) {
        console.log(`  ${id}: ${count} assignments`);
      }
      
      // Dave should get close to expected
      // Allow for randomness (softmax selection introduces variance)
      // The key is that over many iterations, it converges
      // For this short simulation, wider bounds are allowed (within 60% deviation)
      expect(daveCount).toBeGreaterThan(expectedCount * 0.4);
      expect(daveCount).toBeLessThan(expectedCount * 1.6);
      
      // Variance across all should be reasonable
      const counts = Array.from(assignmentCounts.values());
      const countVariance = calculateVariance(counts);
      const countMean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const cv = Math.sqrt(countVariance) / countMean;
      
      // Allow higher CV for short simulation (randomness plays bigger role)
      expect(cv).toBeLessThan(0.6); // CV < 60%
    });
  });

  describe('Edge Cases', () => {
    it('should handle new person when all existing people have zero assignments', () => {
      // Everyone is new - no one has been assigned yet
      const personIds = ['p1', 'p2', 'p3', 'p4'];
      
      for (const id of personIds) {
        engine.initializePerson(id, 0, '2025-01-01');
      }
      
      const rates = [0, 0, 0, 0];
      const deficits = [0, 0, 0, 0];
      const variance = 0;
      
      const team = engine.selectTeam(personIds, deficits, variance, 2);
      
      expect(team).toHaveLength(2);
      expect(personIds).toContain(team[0]);
      expect(personIds).toContain(team[1]);
    });

    it('should handle new person joining when system has high variance', () => {
      // Existing people with very different rates
      const existingIds = ['p1', 'p2', 'p3'];
      
      engine.initializePerson('p1', 0.05, '2025-01-01'); // Low rate
      engine.initializePerson('p2', 0.15, '2025-01-01'); // High rate
      engine.initializePerson('p3', 0.10, '2025-01-01'); // Medium rate
      
      // New person joins with average rate
      const avgRate = (0.05 + 0.15 + 0.10) / 3;
      engine.initializePerson('p4', avgRate, '2025-01-01');
      
      const allIds = [...existingIds, 'p4'];
      const rates = [0.05, 0.15, 0.10, avgRate];
      const variance = calculateVariance(rates);
      
      expect(variance).toBeGreaterThan(0.001); // High variance
      
      const deficits = rates.map(r => avgRate - r);
      
      // Should still select fairly
      const team = engine.selectTeam(allIds, deficits, variance, 2);
      
      expect(team).toHaveLength(2);
    });
  });
});

/**
 * Helper: Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}
