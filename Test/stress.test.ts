/**
 * stress.test.ts - Comprehensive Stress Tests for GießPlan System
 * 
 * This file contains stress tests designed to push the system to its limits:
 * - Large datasets (100+ people)
 * - Extended time periods (multi-year schedules)
 * - High-turnover scenarios (frequent arrivals/departures)
 * - Edge case combinations
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateSchedule, handlePersonDeletion } from '@/lib/scheduleEngine';
import { createPerson, markPersonDeparture, markPersonReturn } from '@/lib/personManager';
import {
  calculatePriority,
  selectTeamsAndSubstitutes,
  isPersonActive,
  getPersonAssignmentCount,
  calculateTenure,
  fillGapAfterDeletion,
  validateScheduleConstraints
} from '@/lib/fairnessEngine';
import { addWeeks, formatDate, parseDate } from '@/lib/dateUtils';
import type { Person, Schedule } from '@/types';

describe('Stress Tests - Large Datasets', () => {
  describe('100+ people scenarios', () => {
    it('sollte Schedule mit 100 aktiven Personen generieren', () => {
      // Create 100 people with staggered join dates
      const people: Person[] = [];
      for (let i = 0; i < 100; i++) {
        const daysOffset = Math.floor(i / 10) * 30; // Groups of 10 every 30 days
        const joinDate = formatDate(addWeeks(parseDate('2023-01-01'), daysOffset / 7));
        people.push(createPerson(`Person ${i + 1}`, joinDate));
      }

      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 26, // Half a year
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      expect(result.schedule).toBeDefined();
      expect(result.schedule?.weeks).toBe(26);
      
      // Verify all assignments have correct structure
      result.schedule?.assignments.forEach(assignment => {
        expect(assignment.assignedPeople.length).toBeGreaterThanOrEqual(2);
        expect(assignment.assignedPeople.length).toBeLessThanOrEqual(2);
      });
    });

    it('sollte faire Verteilung über 100 Personen sicherstellen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 100; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Generate 50 weeks worth of schedules
      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 50,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);

      // Count assignments per person
      const assignmentCounts = new Map<string, number>();
      result.schedule?.assignments.forEach(assignment => {
        assignment.assignedPeople.forEach(personId => {
          assignmentCounts.set(personId, (assignmentCounts.get(personId) || 0) + 1);
        });
      });

      // Expected assignments per person: 50 weeks * 2 people per week / 100 people = 1
      const counts = Array.from(assignmentCounts.values());
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
      
      // Verify reasonable distribution (low variance)
      expect(avg).toBeGreaterThan(0.5);
      expect(avg).toBeLessThan(2);
      expect(variance).toBeLessThan(5); // Should be fairly distributed
    });

    it('sollte Priority-Berechnung für 100 Personen unter 100ms durchführen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 100; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      const startTime = performance.now();
      
      // Calculate priority for all 100 people
      people.forEach(person => {
        calculatePriority(person, people, [], '2024-06-01');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('sollte 200 Personen in der Datenbank verwalten können', () => {
      const people: Person[] = [];
      
      // Create 200 people
      for (let i = 0; i < 200; i++) {
        const joinDate = formatDate(addWeeks(parseDate('2020-01-01'), i));
        people.push(createPerson(`Person ${i + 1}`, joinDate));
      }

      // Half of them departed
      for (let i = 0; i < 100; i++) {
        const departDate = formatDate(addWeeks(parseDate('2023-06-01'), i / 10));
        people[i] = markPersonDeparture(people[i], departDate, 'Finished program');
      }

      // Filter active people
      const activePeople = people.filter(p => isPersonActive(p, '2024-06-01'));
      
      expect(activePeople.length).toBe(100);
      expect(people.length).toBe(200);
    });
  });
});

describe('Stress Tests - Extended Time Periods', () => {
  describe('Multi-year schedules', () => {
    it('sollte Schedule für ganzes Jahr (52 Wochen) generieren', () => {
      const people: Person[] = [];
      for (let i = 0; i < 20; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 52,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      expect(result.schedule?.weeks).toBe(52);
      expect(result.schedule?.assignments).toHaveLength(52);

      // Verify no consecutive assignments
      const validation = validateScheduleConstraints(result.schedule!.assignments);
      expect(validation.valid).toBe(true);
    });

    it('sollte Schedule für 2 Jahre (104 Wochen) generieren', () => {
      const people: Person[] = [];
      for (let i = 0; i < 30; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2022-01-01'));
      }

      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 104,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      expect(result.schedule?.weeks).toBe(104);
      expect(result.schedule?.assignments).toHaveLength(104);
    });

    it('sollte Fairness über mehrere Jahre hinweg beibehalten', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2020-01-01'));
      }

      // Generate first year
      const result1 = generateSchedule({
        startDate: '2023-01-01',
        weeks: 52,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result1.success).toBe(true);

      // Generate second year with previous schedule
      const result2 = generateSchedule({
        startDate: '2024-01-01',
        weeks: 52,
        people,
        existingSchedules: result1.schedule ? [result1.schedule] : [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result2.success).toBe(true);

      // Count total assignments across both years
      const totalAssignments = new Map<string, number>();
      [result1.schedule, result2.schedule].forEach(schedule => {
        schedule?.assignments.forEach(assignment => {
          assignment.assignedPeople.forEach(personId => {
            totalAssignments.set(personId, (totalAssignments.get(personId) || 0) + 1);
          });
        });
      });

      // Verify fairness across 2 years
      const counts = Array.from(totalAssignments.values());
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      const maxDeviation = Math.max(...counts.map(c => Math.abs(c - avg)));

      // Expected: 104 weeks * 2 people / 10 = ~20.8 assignments per person
      expect(avg).toBeGreaterThan(15);
      expect(avg).toBeLessThan(25);
      expect(maxDeviation).toBeLessThan(10); // Reasonable deviation
    });

    it('sollte Tenure über mehrere Jahre korrekt berechnen', () => {
      const person = createPerson('Long Timer', '2020-01-01');
      
      const tenure2023 = calculateTenure(person, '2023-01-01');
      const tenure2024 = calculateTenure(person, '2024-01-01');
      
      // 3 years = ~1095 days (accounting for leap year)
      expect(tenure2023).toBeGreaterThan(1090);
      expect(tenure2023).toBeLessThan(1100);
      
      // 4 years = ~1461 days (with leap year)
      expect(tenure2024).toBeGreaterThan(1455);
      expect(tenure2024).toBeLessThan(1466);
    });
  });
});

describe('Stress Tests - High Turnover Scenarios', () => {
  describe('Frequent arrivals and departures', () => {
    it('sollte mit monatlichen Arrivals umgehen können', () => {
      const people: Person[] = [];
      
      // Create 12 people, each joining a different month in 2023
      for (let month = 0; month < 12; month++) {
        const joinDate = formatDate(parseDate(`2023-${String(month + 1).padStart(2, '0')}-01`));
        people.push(createPerson(`Person Month ${month + 1}`, joinDate));
      }

      // Generate schedule for mid-2024
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 12,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      
      // All should be active by this time
      const activePeople = people.filter(p => isPersonActive(p, '2024-06-03'));
      expect(activePeople.length).toBe(12);
    });

    it('sollte Schedule anpassen wenn Personen während Laufzeit ausscheiden', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2024-01-01'));
      }

      // Generate initial schedule
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 12,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);

      // Mark 3 people as departed in week 6
      const departDate = formatDate(addWeeks(parseDate('2024-06-03'), 6));
      people[0] = markPersonDeparture(people[0], departDate, 'Left early');
      people[1] = markPersonDeparture(people[1], departDate, 'Left early');
      people[2] = markPersonDeparture(people[2], departDate, 'Left early');

      // System should still function with 7 people
      const activePeople = people.filter(p => isPersonActive(p, formatDate(addWeeks(parseDate(departDate), 1))));
      expect(activePeople.length).toBe(7);
    });

    it('sollte mit Personen umgehen die mehrfach kommen und gehen', () => {
      let person = createPerson('Boomerang Person', '2023-01-01');
      
      // First departure
      person = markPersonDeparture(person, '2023-06-01', 'Temporary leave');
      expect(person.programPeriods.length).toBe(1);
      expect(person.programPeriods[0].endDate).toBe('2023-06-01');
      
      // Return
      person = markPersonReturn(person, '2023-09-01');
      expect(person.programPeriods.length).toBe(2);
      
      // Second departure
      person = markPersonDeparture(person, '2024-03-01', 'Another break');
      expect(person.programPeriods.length).toBe(2);
      expect(person.programPeriods[1].endDate).toBe('2024-03-01');
      
      // Second return
      person = markPersonReturn(person, '2024-06-01');
      expect(person.programPeriods.length).toBe(3);
      
      // Should be active now
      expect(isPersonActive(person, '2024-06-15')).toBe(true);
    });

    it('sollte 50 Arrivals in einem Jahr verarbeiten', () => {
      const people: Person[] = [];
      
      // 50 people joining throughout the year (weekly arrivals)
      for (let week = 0; week < 50; week++) {
        const joinDate = formatDate(addWeeks(parseDate('2023-01-01'), week));
        people.push(createPerson(`New Person Week ${week + 1}`, joinDate));
      }

      // By end of year, all should be active
      const activeAtYearEnd = people.filter(p => isPersonActive(p, '2023-12-31'));
      expect(activeAtYearEnd.length).toBe(50);

      // Generate schedule for next year
      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 26,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
    });

    it('sollte Gap-Filling nach Deletion unter Stress testen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 20; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Generate schedule
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 10,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      
      // Delete 5 people who have assignments
      const schedule = result.schedule!;
      let updatedSchedules = [schedule];
      
      for (let i = 0; i < 5; i++) {
        updatedSchedules = handlePersonDeletion(updatedSchedules, people[i].id, people);
      }

      // Verify all assignments still have 2 people (or less if not enough available)
      updatedSchedules[0].assignments.forEach(assignment => {
        expect(assignment.assignedPeople.length).toBeGreaterThanOrEqual(1);
        expect(assignment.assignedPeople.length).toBeLessThanOrEqual(2);
      });
    });
  });
});

describe('Stress Tests - Edge Case Combinations', () => {
  describe('Extreme scenarios', () => {
    it('sollte mit nur 2 aktiven Personen für 52 Wochen umgehen', () => {
      const people = [
        createPerson('Person A', '2023-01-01'),
        createPerson('Person B', '2023-01-01')
      ];

      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 52,
        people,
        existingSchedules: [],
        enforceNoConsecutive: false, // Can't enforce with only 2 people
        requireMentor: false
      });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0); // Should warn about consecutive assignments
      
      // Both should be assigned every week
      result.schedule?.assignments.forEach(assignment => {
        expect(assignment.assignedPeople.length).toBe(2);
      });
    });

    it('sollte mit 1 Person umgehen (Notfall-Szenario)', () => {
      const people = [createPerson('Only Person', '2023-01-01')];

      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 4,
        people,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      result.schedule?.assignments.forEach(assignment => {
        expect(assignment.assignedPeople).toContain(people[0].id);
      });
    });

    it('sollte alle Personen excluded scenario handhaben', () => {
      const people: Person[] = [];
      for (let i = 0; i < 5; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Try to select team with all people excluded
      const allIds = people.map(p => p.id);
      const result = selectTeamsAndSubstitutes(
        people,
        [],
        '2024-06-03',
        allIds, // Exclude everyone
        2,
        2
      );

      expect(result.teamIds.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('sollte mit allen inaktiven Personen umgehen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 5; i++) {
        const person = createPerson(`Person ${i + 1}`, '2023-01-01');
        people.push(markPersonDeparture(person, '2023-12-31', 'All left'));
      }

      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 4,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Keine aktiven Personen');
    });

    it('sollte mit extremer Ungleichverteilung umgehen', () => {
      const people: Person[] = [];
      
      // Create one person with lots of assignments
      const overworked = createPerson('Overworked', '2020-01-01');
      people.push(overworked);
      
      // Create 9 brand new people
      for (let i = 0; i < 9; i++) {
        people.push(createPerson(`New Person ${i + 1}`, '2024-05-01'));
      }

      // Create fake schedule where overworked person was assigned 50 times
      const fakeSchedule: Schedule = {
        id: 'fake-schedule',
        startDate: '2023-01-01',
        weeks: 25,
        createdAt: new Date().toISOString(),
        assignments: []
      };

      for (let i = 0; i < 25; i++) {
        fakeSchedule.assignments.push({
          weekNumber: i + 1,
          weekStartDate: formatDate(addWeeks(parseDate('2023-01-01'), i)),
          assignedPeople: [overworked.id, overworked.id], // Assigned twice per week
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        });
      }

      // Now generate new schedule - overworked should have lowest priority
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 10,
        people,
        existingSchedules: [fakeSchedule],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);

      // Count assignments in new schedule
      const newAssignments = new Map<string, number>();
      result.schedule?.assignments.forEach(assignment => {
        assignment.assignedPeople.forEach(personId => {
          newAssignments.set(personId, (newAssignments.get(personId) || 0) + 1);
        });
      });

      // Overworked person should have few or no assignments
      const overworkedCount = newAssignments.get(overworked.id) || 0;
      const newPersonCounts = Array.from(newAssignments.entries())
        .filter(([id]) => id !== overworked.id)
        .map(([_, count]) => count);

      const avgNewPerson = newPersonCounts.reduce((a, b) => a + b, 0) / newPersonCounts.length;

      expect(overworkedCount).toBeLessThan(avgNewPerson);
    });

    it('sollte mit allen Personen am selben Tag joined umgehen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 20; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2024-01-01'));
      }

      // Everyone has same tenure, so priority should be equal initially
      const priorities = people.map(p => calculatePriority(p, people, [], '2024-06-01'));
      
      // All priorities should be equal (or very close due to floating point)
      const firstPriority = priorities[0];
      priorities.forEach(priority => {
        expect(Math.abs(priority - firstPriority)).toBeLessThan(0.01);
      });

      // Should still generate valid schedule
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 10,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);
    });
  });
});

describe('Stress Tests - Performance Benchmarks', () => {
  describe('Execution time measurements', () => {
    it('sollte Schedule-Generierung für 50 Personen, 52 Wochen unter 1 Sekunde schaffen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 50; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      const startTime = performance.now();
      
      const result = generateSchedule({
        startDate: '2024-01-01',
        weeks: 52,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('sollte selectTeamsAndSubstitutes für 100 Personen unter 50ms schaffen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 100; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      const startTime = performance.now();
      
      selectTeamsAndSubstitutes(people, [], '2024-06-03', [], 2, 2);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('sollte 1000 Priority-Berechnungen unter 500ms schaffen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 20; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      const startTime = performance.now();
      
      // Calculate priority 1000 times
      for (let i = 0; i < 1000; i++) {
        const person = people[i % 20];
        calculatePriority(person, people, [], '2024-06-03');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('sollte Schedule-Validierung für 200 Wochen unter 100ms schaffen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Generate large schedule
      const result = generateSchedule({
        startDate: '2020-01-01',
        weeks: 200,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result.success).toBe(true);

      const startTime = performance.now();
      
      validateScheduleConstraints(result.schedule!.assignments);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('sollte Person-Deletion-Handling für 50 Schedules unter 200ms schaffen', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Generate 50 small schedules
      const schedules: Schedule[] = [];
      for (let i = 0; i < 50; i++) {
        const startDate = formatDate(addWeeks(parseDate('2020-01-01'), i * 4));
        const result = generateSchedule({
          startDate,
          weeks: 4,
          people,
          existingSchedules: schedules,
          enforceNoConsecutive: false,
          requireMentor: false
        });
        if (result.schedule) {
          schedules.push(result.schedule);
        }
      }

      const startTime = performance.now();
      
      handlePersonDeletion(schedules, people[0].id, people);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory stress tests', () => {
    it('sollte große Datenmengen ohne Crash verarbeiten', { timeout: 30000 }, () => {
      const people: Person[] = [];
      
      // Create 500 people
      for (let i = 0; i < 500; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2020-01-01'));
      }

      // This should not crash or throw
      expect(() => {
        const result = generateSchedule({
          startDate: '2024-01-01',
          weeks: 12,
          people,
          existingSchedules: [],
          enforceNoConsecutive: true,
          requireMentor: false
        });
        expect(result.success).toBe(true);
      }).not.toThrow();
    });

    it('sollte 100 Schedules in Speicher halten können', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2020-01-01'));
      }

      const schedules: Schedule[] = [];

      // Generate 100 schedules
      expect(() => {
        for (let i = 0; i < 100; i++) {
          const startDate = formatDate(addWeeks(parseDate('2020-01-01'), i * 4));
          const result = generateSchedule({
            startDate,
            weeks: 4,
            people,
            existingSchedules: [],
            enforceNoConsecutive: true,
            requireMentor: false
          });
          if (result.schedule) {
            schedules.push(result.schedule);
          }
        }
      }).not.toThrow();

      // Allow for edge case where one schedule might fail due to week overlap
      expect(schedules.length).toBeGreaterThanOrEqual(99);
    });
  });
});

describe('Stress Tests - Concurrent Modifications', () => {
  describe('Rapid sequential changes', () => {
    it('sollte 100 schnelle Person-Updates verarbeiten', () => {
      let person = createPerson('Rapidly Changing', '2024-01-01');

      expect(() => {
        for (let i = 0; i < 100; i++) {
          if (i % 2 === 0) {
            person = markPersonDeparture(person, formatDate(addWeeks(parseDate('2024-01-01'), i)), 'Leave');
          } else {
            person = markPersonReturn(person, formatDate(addWeeks(parseDate('2024-01-01'), i)));
          }
        }
      }).not.toThrow();

      // Should have many program periods
      expect(person.programPeriods.length).toBeGreaterThan(40);
    });

    it('sollte Schedule mit sich ändernden Personendaten generieren', () => {
      const people: Person[] = [];
      for (let i = 0; i < 10; i++) {
        people.push(createPerson(`Person ${i + 1}`, '2023-01-01'));
      }

      // Generate initial schedule
      const result1 = generateSchedule({
        startDate: '2024-01-01',
        weeks: 12,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result1.success).toBe(true);

      // Modify people
      people[0] = markPersonDeparture(people[0], '2024-02-01', 'Left');
      people.push(createPerson('New Person', '2024-02-15'));

      // Generate another schedule with modified data
      const result2 = generateSchedule({
        startDate: '2024-04-01',
        weeks: 12,
        people,
        existingSchedules: result1.schedule ? [result1.schedule] : [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      expect(result2.success).toBe(true);
    });
  });
});
