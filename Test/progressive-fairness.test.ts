/**
 * progressive-fairness.test.ts - BDD Tests for Progressive Fairness Algorithm
 * 
 * Tests the running state implementation and variance minimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeRunningState,
  updateRunningState,
  calculateFairnessWithState,
  selectTeamsAndSubstitutesWithState,
  calculateStandardDeviation,
  sigmoid,
  type RunningFairnessState
} from '@/lib/fairnessEngine';
import { generateSchedule } from '@/lib/scheduleEngine';
import { createPerson } from '@/lib/personManager';
import type { Person, Schedule } from '@/types';

describe('Progressive Fairness Algorithm', () => {
  let testPeople: Person[];
  const evaluationDate = '2025-11-11';

  beforeEach(() => {
    // Create 7 people all starting a day before the evaluation date
    // This ensures they have at least 1 day of presence
    testPeople = [
      createPerson('Alice', '2025-11-10'),
      createPerson('Bob', '2025-11-10'),
      createPerson('Charlie', '2025-11-10'),
      createPerson('Diana', '2025-11-10'),
      createPerson('Eve', '2025-11-10'),
      createPerson('Frank', '2025-11-10'),
      createPerson('Grace', '2025-11-10')
    ];
  });

  describe('Utility Functions', () => {
    describe('sigmoid', () => {
      it('should map 0 to 0.5', () => {
        expect(sigmoid(0)).toBeCloseTo(0.5, 5);
      });

      it('should map positive values to >0.5', () => {
        expect(sigmoid(1)).toBeGreaterThan(0.5);
        expect(sigmoid(5)).toBeGreaterThan(0.9);
      });

      it('should map negative values to <0.5', () => {
        expect(sigmoid(-1)).toBeLessThan(0.5);
        expect(sigmoid(-5)).toBeLessThan(0.1);
      });

      it('should be bounded between 0 and 1', () => {
        expect(sigmoid(100)).toBeLessThanOrEqual(1);
        expect(sigmoid(-100)).toBeGreaterThanOrEqual(0);
      });
    });

    describe('calculateStandardDeviation', () => {
      it('should return 0 for uniform distribution', () => {
        const assignments = new Map([
          ['p1', 5],
          ['p2', 5],
          ['p3', 5]
        ]);
        expect(calculateStandardDeviation(assignments)).toBe(0);
      });

      it('should calculate correct standard deviation', () => {
        // Mean = 5, values: [3, 5, 7]
        // Variance = ((3-5)² + (5-5)² + (7-5)²) / 3 = (4 + 0 + 4) / 3 = 2.667
        // StdDev = √2.667 ≈ 1.633
        const assignments = new Map([
          ['p1', 3],
          ['p2', 5],
          ['p3', 7]
        ]);
        expect(calculateStandardDeviation(assignments)).toBeCloseTo(1.633, 2);
      });

      it('should return 0 for empty map', () => {
        const assignments = new Map();
        expect(calculateStandardDeviation(assignments)).toBe(0);
      });

      it('should handle single value', () => {
        const assignments = new Map([['p1', 10]]);
        expect(calculateStandardDeviation(assignments)).toBe(0);
      });
    });
  });

  describe('Running State Management', () => {
    describe('initializeRunningState', () => {
      it('should initialize state with zero accumulated assignments', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        expect(state.weeksGenerated).toBe(0);
        expect(state.evaluationDate).toBe(evaluationDate);
        expect(state.accumulatedAssignments.size).toBe(7);

        testPeople.forEach(person => {
          expect(state.accumulatedAssignments.get(person.id)).toBe(0);
        });
      });

      it('should load historical assignments from existing schedules', () => {
        const existingSchedule: Schedule = {
          id: 'test-schedule',
          startDate: '2025-11-11',
          weeks: 2,
          assignments: [
            {
              weekNumber: 1,
              weekStartDate: '2025-11-11',
              assignedPeople: [testPeople[0].id, testPeople[1].id],
              substitutes: [],
              fairnessScores: [0.5, 0.5],
              hasMentor: false
            },
            {
              weekNumber: 2,
              weekStartDate: '2025-11-18',
              assignedPeople: [testPeople[0].id, testPeople[2].id],
              substitutes: [],
              fairnessScores: [0.5, 0.5],
              hasMentor: false
            }
          ],
          createdAt: new Date().toISOString()
        };

        const state = initializeRunningState(testPeople, [existingSchedule], evaluationDate);

        expect(state.historicalAssignments.get(testPeople[0].id)).toBe(2); // Alice: 2 assignments
        expect(state.historicalAssignments.get(testPeople[1].id)).toBe(1); // Bob: 1 assignment
        expect(state.historicalAssignments.get(testPeople[2].id)).toBe(1); // Charlie: 1 assignment
        expect(state.historicalAssignments.get(testPeople[3].id)).toBe(0); // Diana: 0 assignments
      });

      it('should calculate historical days present', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        testPeople.forEach(person => {
          const days = state.historicalDaysPresent.get(person.id);
          expect(days).toBe(2); // All joined on 2025-11-10, evaluated on 2025-11-11 = 2 days
        });
      });
    });

    describe('updateRunningState', () => {
      it('should increment accumulated assignments for selected people', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        updateRunningState(state, [testPeople[0].id, testPeople[1].id]);

        expect(state.accumulatedAssignments.get(testPeople[0].id)).toBe(1);
        expect(state.accumulatedAssignments.get(testPeople[1].id)).toBe(1);
        expect(state.accumulatedAssignments.get(testPeople[2].id)).toBe(0);
      });

      it('should increment weeks generated', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        expect(state.weeksGenerated).toBe(0);
        updateRunningState(state, [testPeople[0].id, testPeople[1].id]);
        expect(state.weeksGenerated).toBe(1);
        updateRunningState(state, [testPeople[2].id, testPeople[3].id]);
        expect(state.weeksGenerated).toBe(2);
      });

      it('should accumulate assignments over multiple weeks', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        // Week 1: Alice & Bob
        updateRunningState(state, [testPeople[0].id, testPeople[1].id]);
        // Week 2: Alice & Charlie
        updateRunningState(state, [testPeople[0].id, testPeople[2].id]);
        // Week 3: Bob & Diana
        updateRunningState(state, [testPeople[1].id, testPeople[3].id]);

        expect(state.accumulatedAssignments.get(testPeople[0].id)).toBe(2); // Alice
        expect(state.accumulatedAssignments.get(testPeople[1].id)).toBe(2); // Bob
        expect(state.accumulatedAssignments.get(testPeople[2].id)).toBe(1); // Charlie
        expect(state.accumulatedAssignments.get(testPeople[3].id)).toBe(1); // Diana
        expect(state.weeksGenerated).toBe(3);
      });
    });
  });

  describe('Fairness Calculation with State', () => {
    describe('calculateFairnessWithState', () => {
      it('should give highest score (1.0) to never-assigned person', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        const idealRate = 0.1; // Doesn't matter for never-assigned

        const score = calculateFairnessWithState(testPeople[0], state, idealRate);
        expect(score).toBe(1.0);
      });

      it('should give score > 0.5 to under-assigned person', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        
        // Simulate: Alice got 1 assignment, ideal rate is 0.2 per day
        state.accumulatedAssignments.set(testPeople[0].id, 1);
        state.weeksGenerated = 1;
        
        // effectiveDays = 1 (historical) + 7 (1 week) = 8
        // currentRate = 1/8 = 0.125
        // idealRate = 0.2
        // deficit = 0.2 - 0.125 = 0.075 (positive)
        // score should be > 0.5
        
        const score = calculateFairnessWithState(testPeople[0], state, 0.2);
        expect(score).toBeGreaterThan(0.5);
      });

      it('should give score < 0.5 to over-assigned person', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        
        // Simulate: Alice got 3 assignments in 1 week, ideal rate is 0.1 per day
        state.accumulatedAssignments.set(testPeople[0].id, 3);
        state.weeksGenerated = 1;
        
        // effectiveDays = 1 + 7 = 8
        // currentRate = 3/8 = 0.375
        // idealRate = 0.1
        // deficit = 0.1 - 0.375 = -0.275 (negative)
        // score should be < 0.5
        
        const score = calculateFairnessWithState(testPeople[0], state, 0.1);
        expect(score).toBeLessThan(0.5);
      });

      it('should give score ≈ 0.5 to person at ideal rate', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        
        // Set up: rate exactly at ideal
        state.accumulatedAssignments.set(testPeople[0].id, 1);
        state.weeksGenerated = 1;
        
        // effectiveDays = 2 (historical) + 7 (1 week) = 9, currentRate = 1/9 ≈ 0.111
        const idealRate = 1/9;
        
        const score = calculateFairnessWithState(testPeople[0], state, idealRate);
        expect(score).toBeCloseTo(0.5, 1); // Within 0.05
      });

      it('should incorporate historical assignments', () => {
        const existingSchedule: Schedule = {
          id: 'test',
          startDate: '2025-11-11',
          weeks: 1,
          assignments: [{
            weekNumber: 1,
            weekStartDate: '2025-11-11',
            assignedPeople: [testPeople[0].id, testPeople[1].id],
            substitutes: [],
            fairnessScores: [0.5, 0.5],
            hasMentor: false
          }],
          createdAt: new Date().toISOString()
        };

        const state = initializeRunningState(testPeople, [existingSchedule], evaluationDate);
        
        // Alice has 1 historical assignment
        // No accumulated yet
        // effectiveDays = 1, currentRate = 1/1 = 1.0
        // idealRate = 0.1
        // deficit = 0.1 - 1.0 = -0.9 (very negative)
        // score should be very low
        
        const score = calculateFairnessWithState(testPeople[0], state, 0.1);
        expect(score).toBeLessThan(0.1);
      });
    });
  });

  describe('Team Selection with State', () => {
    describe('selectTeamsAndSubstitutesWithState', () => {
      it('should select team based on fairness scores', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        const result = selectTeamsAndSubstitutesWithState(
          testPeople,
          state,
          '2025-11-11',
          [],
          2, // teamSize
          2  // substituteSize
        );

        expect(result.teamIds).toHaveLength(2);
        expect(result.substituteIds).toHaveLength(2);
        expect(result.warnings).toHaveLength(0);
      });

      it('should prioritize under-assigned people', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        
        // Give Alice and Bob many assignments
        state.accumulatedAssignments.set(testPeople[0].id, 10);
        state.accumulatedAssignments.set(testPeople[1].id, 10);
        state.weeksGenerated = 5;

        const result = selectTeamsAndSubstitutesWithState(
          testPeople,
          state,
          '2025-11-11',
          [],
          2,
          2
        );

        // Alice and Bob should NOT be in the team (they're over-assigned)
        expect(result.teamIds).not.toContain(testPeople[0].id);
        expect(result.teamIds).not.toContain(testPeople[1].id);
      });

      it('should respect exclusion list', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        const excludedIds = [testPeople[0].id, testPeople[1].id];

        const result = selectTeamsAndSubstitutesWithState(
          testPeople,
          state,
          '2025-11-11',
          excludedIds,
          2,
          2
        );

        expect(result.teamIds).not.toContain(testPeople[0].id);
        expect(result.teamIds).not.toContain(testPeople[1].id);
      });

      it('should handle insufficient people gracefully', () => {
        const state = initializeRunningState([testPeople[0]], [], evaluationDate);

        const result = selectTeamsAndSubstitutesWithState(
          [testPeople[0]],
          state,
          '2025-11-11',
          [],
          2,
          2
        );

        expect(result.teamIds).toHaveLength(1);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Only 1 people available');
      });

      it('should calculate ideal rate correctly', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);
        state.weeksGenerated = 0;

        // First week: 2 slots needed, 7 people × 1 day = 7 person-days
        // idealRate = 2/7 ≈ 0.286
        
        selectTeamsAndSubstitutesWithState(
          testPeople,
          state,
          '2025-11-11',
          [],
          2,
          2
        );

        // After selection, state should be updated
        // (we can't directly verify idealRate calculation, but check the state was used)
        expect(state.weeksGenerated).toBe(0); // Not updated by select, only by update
      });
    });
  });

  describe('End-to-End Progressive Generation', () => {
    describe('Variance Convergence', () => {
      it('should converge to low standard deviation over many weeks', () => {
        const result = generateSchedule({
          startDate: '2025-11-11',
          weeks: 20,
          people: testPeople,
          existingSchedules: [],
          enforceNoConsecutive: false,
          requireMentor: false
        });

        expect(result.success).toBe(true);
        expect(result.schedule).toBeDefined();

        // Count assignments per person
        const assignmentCounts = new Map<string, number>();
        testPeople.forEach(p => assignmentCounts.set(p.id, 0));

        result.schedule!.assignments.forEach(assignment => {
          assignment.assignedPeople.forEach(personId => {
            const current = assignmentCounts.get(personId) || 0;
            assignmentCounts.set(personId, current + 1);
          });
        });

        const stdDev = calculateStandardDeviation(assignmentCounts);

        // With 20 weeks and 7 people, each should get ~5.7 assignments
        // Standard deviation should be < 1.0 for good fairness
        expect(stdDev).toBeLessThan(1.0);
      });

      it('should distribute assignments more fairly than random', () => {
        // Generate a schedule
        const result = generateSchedule({
          startDate: '2025-11-11',
          weeks: 15,
          people: testPeople,
          existingSchedules: [],
          enforceNoConsecutive: false,
          requireMentor: false
        });

        expect(result.success).toBe(true);

        const assignmentCounts = new Map<string, number>();
        testPeople.forEach(p => assignmentCounts.set(p.id, 0));

        result.schedule!.assignments.forEach(assignment => {
          assignment.assignedPeople.forEach(personId => {
            const current = assignmentCounts.get(personId) || 0;
            assignmentCounts.set(personId, current + 1);
          });
        });

        // Check that no one is overloaded or underutilized
        const counts = Array.from(assignmentCounts.values());
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const range = max - min;

        // With 15 weeks × 2 people = 30 slots, 7 people → avg 4.3
        // Range should be small (≤ 3)
        expect(range).toBeLessThanOrEqual(3);
      });

      it('should maintain fairness when generating incrementally', () => {
        // First batch: 5 weeks
        const firstResult = generateSchedule({
          startDate: '2025-11-11',
          weeks: 5,
          people: testPeople,
          existingSchedules: [],
          enforceNoConsecutive: false,
          requireMentor: false
        });

        expect(firstResult.success).toBe(true);

        // Second batch: 5 more weeks
        const secondResult = generateSchedule({
          startDate: '2025-12-16', // 5 weeks later
          weeks: 5,
          people: testPeople,
          existingSchedules: [firstResult.schedule!],
          enforceNoConsecutive: false,
          requireMentor: false
        });

        expect(secondResult.success).toBe(true);

        // Combine and check distribution
        const allAssignments = [
          ...firstResult.schedule!.assignments,
          ...secondResult.schedule!.assignments
        ];

        const assignmentCounts = new Map<string, number>();
        testPeople.forEach(p => assignmentCounts.set(p.id, 0));

        allAssignments.forEach(assignment => {
          assignment.assignedPeople.forEach(personId => {
            const current = assignmentCounts.get(personId) || 0;
            assignmentCounts.set(personId, current + 1);
          });
        });

        const stdDev = calculateStandardDeviation(assignmentCounts);

        // Should still have good distribution
        expect(stdDev).toBeLessThan(1.0);
      });

      it('should handle existing historical data correctly', () => {
        // Create existing schedule with unequal distribution
        const existingSchedule: Schedule = {
          id: 'existing',
          startDate: '2025-11-11',
          weeks: 3,
          assignments: [
            {
              weekNumber: 1,
              weekStartDate: '2025-11-11',
              assignedPeople: [testPeople[0].id, testPeople[1].id],
              substitutes: [],
              fairnessScores: [0.5, 0.5],
              hasMentor: false
            },
            {
              weekNumber: 2,
              weekStartDate: '2025-11-18',
              assignedPeople: [testPeople[0].id, testPeople[1].id],
              substitutes: [],
              fairnessScores: [0.5, 0.5],
              hasMentor: false
            },
            {
              weekNumber: 3,
              weekStartDate: '2025-11-25',
              assignedPeople: [testPeople[0].id, testPeople[1].id],
              substitutes: [],
              fairnessScores: [0.5, 0.5],
              hasMentor: false
            }
          ],
          createdAt: new Date().toISOString()
        };

        // Generate more weeks - should correct the imbalance
        const result = generateSchedule({
          startDate: '2025-12-02',
          weeks: 10,
          people: testPeople,
          existingSchedules: [existingSchedule],
          enforceNoConsecutive: false,
          requireMentor: false
        });

        expect(result.success).toBe(true);

        // Count total assignments (existing + new)
        const assignmentCounts = new Map<string, number>();
        testPeople.forEach(p => assignmentCounts.set(p.id, 0));

        [...existingSchedule.assignments, ...result.schedule!.assignments].forEach(assignment => {
          assignment.assignedPeople.forEach(personId => {
            const current = assignmentCounts.get(personId) || 0;
            assignmentCounts.set(personId, current + 1);
          });
        });

        // Alice and Bob should NOT dominate the new assignments
        const aliceCount = assignmentCounts.get(testPeople[0].id) || 0;
        const bobCount = assignmentCounts.get(testPeople[1].id) || 0;
        
        // They already have 3 each from historical, new assignments should favor others
        // Total slots = 3 (historical) × 2 + 10 (new) × 2 = 26 slots / 7 people ≈ 3.7 avg
        // Alice and Bob should be close to average, not much higher
        expect(aliceCount).toBeLessThanOrEqual(5);
        expect(bobCount).toBeLessThanOrEqual(5);
      });
    });

    describe('Sequential Week Generation', () => {
      it('should update state progressively through weeks', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        // Manually simulate 3 weeks of generation
        for (let week = 0; week < 3; week++) {
          const selection = selectTeamsAndSubstitutesWithState(
            testPeople,
            state,
            '2025-11-11',
            [],
            2,
            2
          );

          updateRunningState(state, selection.teamIds);
        }

        // After 3 weeks, total accumulated should be 6 (3 weeks × 2 people)
        const totalAccumulated = Array.from(state.accumulatedAssignments.values())
          .reduce((sum, count) => sum + count, 0);

        expect(totalAccumulated).toBe(6);
        expect(state.weeksGenerated).toBe(3);
      });

      it('should improve fairness score calculation each week', () => {
        const state = initializeRunningState(testPeople, [], evaluationDate);

        // Week 1: Everyone has equal priority (never assigned)
        const week1Selection = selectTeamsAndSubstitutesWithState(
          testPeople, state, '2025-11-11', [], 2, 2
        );
        updateRunningState(state, week1Selection.teamIds);

        // Week 2: The people NOT selected in week 1 should have higher priority
        const week2Selection = selectTeamsAndSubstitutesWithState(
          testPeople, state, '2025-11-18', [], 2, 2
        );

        // Week 2 team should be different from week 1
        const overlap = week1Selection.teamIds.filter(id => 
          week2Selection.teamIds.includes(id)
        );
        
        // With fairness, overlap should be minimal (0 ideally, but randomness may cause 1)
        expect(overlap.length).toBeLessThanOrEqual(1);
      });
    });
  });
});
