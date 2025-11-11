/**
 * fairnessEngine.test.ts - Tests für Mathematische Fairness-Algorithmen
 * 
 * Testet den mathematisch rigorosen Fairness-Algorithmus aus SCHEDULING_ALGORITHM.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTenure,
  calculateTotalDaysPresent,
  isPersonActive,
  getPersonAssignmentCount,
  isExperienced,
  calculatePriority,
  calculateFairnessScore,
  calculateAllFairnessScores,
  selectTeamsAndSubstitutes,
  pairWithExperienceMixing,
  suggestNextAssignments,
  fillGapAfterDeletion,
  validateScheduleConstraints
} from '@/lib/fairnessEngine';
import { createPerson, markPersonDeparture } from '@/lib/personManager';
import type { Person, Schedule, WeekAssignment } from '@/types';

describe('fairnessEngine', () => {
  let testPeople: Person[];
  let testSchedules: Schedule[];

  beforeEach(() => {
    // Erstelle Test-Personen mit verschiedenen Szenarien
    testPeople = [
      createPerson('Alice Lang', '2024-01-01'), // Längste Tenure
      createPerson('Bob Kurz', '2024-03-01'),   // Mittlere Tenure
      createPerson('Charlie Neu', '2024-05-01') // Kürzeste Tenure
    ];

    // Erstelle Test-Schedule
    testSchedules = [];
  });

  describe('calculateTenure', () => {
    it('sollte korrekte Tenure in Tagen berechnen', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const tenure = calculateTenure(person, '2024-01-31');
      
      expect(tenure).toBe(30);
    });

    it('sollte 0 für gleiches Datum zurückgeben', () => {
      const person = createPerson('Test Person', '2024-01-15');
      const tenure = calculateTenure(person, '2024-01-15');
      
      expect(tenure).toBe(0);
    });

    it('sollte mit heutigem Datum funktionieren', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const tenure = calculateTenure(person);
      
      expect(tenure).toBeGreaterThan(0);
    });

    it('sollte für ältere Personen höhere Tenure haben', () => {
      const tenure1 = calculateTenure(testPeople[0], '2024-06-01'); // Jan Start
      const tenure2 = calculateTenure(testPeople[1], '2024-06-01'); // März Start
      const tenure3 = calculateTenure(testPeople[2], '2024-06-01'); // Mai Start
      
      expect(tenure1).toBeGreaterThan(tenure2);
      expect(tenure2).toBeGreaterThan(tenure3);
    });
  });

  describe('calculateTotalDaysPresent', () => {
    it('sollte Tage für einzelne Periode berechnen', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const days = calculateTotalDaysPresent(person, '2024-01-31');
      
      expect(days).toBe(30);
    });

    it('sollte Tage über mehrere Perioden summieren', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-02-01');
      departed.programPeriods.push({
        startDate: '2024-03-01',
        endDate: null
      });
      
      const days = calculateTotalDaysPresent(departed, '2024-03-31');
      
      // 31 Tage Jan + 30 Tage März = 61
      expect(days).toBeGreaterThan(50);
    });

    it('sollte negative Tage auf 0 setzen', () => {
      const person = createPerson('Test Person', '2024-06-01');
      const days = calculateTotalDaysPresent(person, '2024-01-01');
      
      expect(days).toBe(0);
    });
  });

  describe('isPersonActive', () => {
    it('sollte true für aktive Person zurückgeben', () => {
      const person = createPerson('Active Person', '2024-01-01');
      
      expect(isPersonActive(person, '2024-06-01')).toBe(true);
    });

    it('sollte false für ausgeschiedene Person zurückgeben', () => {
      const person = createPerson('Departed Person', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-03-31');
      
      expect(isPersonActive(departed, '2024-06-01')).toBe(false);
    });

    it('sollte true am letzten aktiven Tag zurückgeben', () => {
      const person = createPerson('Test', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-03-31');
      
      expect(isPersonActive(departed, '2024-03-31')).toBe(true);
    });

    it('sollte false am Tag nach Ausscheiden zurückgeben', () => {
      const person = createPerson('Test', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-03-31');
      
      expect(isPersonActive(departed, '2024-04-01')).toBe(false);
    });
  });

  describe('getPersonAssignmentCount', () => {
    it('sollte 0 für Person ohne Assignments zurückgeben', () => {
      const person = testPeople[0];
      const count = getPersonAssignmentCount(person, []);
      
      expect(count).toBe(0);
    });

    it('sollte korrekte Anzahl Assignments zählen', () => {
      const person = testPeople[0];
      const schedule: Schedule = {
        id: 'test-schedule',
        startDate: '2024-01-01',
        weeks: 3,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-01-01',
            assignedPeople: [person.id, testPeople[1].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-01-08',
            assignedPeople: [testPeople[1].id, testPeople[2].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          },
          {
            weekNumber: 3,
            weekStartDate: '2024-01-15',
            assignedPeople: [person.id, testPeople[2].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const count = getPersonAssignmentCount(person, [schedule]);
      expect(count).toBe(2); // Woche 1 und 3
    });

    it('sollte Assignments über mehrere Schedules zählen', () => {
      const person = testPeople[0];
      const schedule1: Schedule = {
        id: 'schedule-1',
        startDate: '2024-01-01',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-01-01',
          assignedPeople: [person.id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const schedule2: Schedule = {
        id: 'schedule-2',
        startDate: '2024-02-01',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-02-01',
          assignedPeople: [person.id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const count = getPersonAssignmentCount(person, [schedule1, schedule2]);
      expect(count).toBe(2);
    });

    it('sollte Zeitraum-Filter respektieren', () => {
      const person = testPeople[0];
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-01-01',
        weeks: 3,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-01-01',
            assignedPeople: [person.id],
            fairnessScores: [1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-02-01',
            assignedPeople: [person.id],
            fairnessScores: [1.0],
            hasMentor: false
          },
          {
            weekNumber: 3,
            weekStartDate: '2024-03-01',
            assignedPeople: [person.id],
            fairnessScores: [1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const count = getPersonAssignmentCount(person, [schedule], '2024-02-01', '2024-02-28');
      expect(count).toBe(1); // Nur Feb Assignment
    });
  });

  describe('isExperienced', () => {
    it('sollte false für neue Person ohne Assignments zurückgeben', () => {
      const person = createPerson('New Person', '2024-05-01');
      
      // Evaluate shortly after arrival (only 10 days, < 90 day threshold)
      expect(isExperienced(person, [], '2024-05-10')).toBe(false);
    });

    it('sollte true für Person mit 90+ Tagen zurückgeben', () => {
      const person = createPerson('Old Person', '2024-01-01');
      const days = calculateTotalDaysPresent(person, '2024-04-15');
      
      expect(days).toBeGreaterThan(90);
      expect(isExperienced(person, [])).toBe(true);
    });

    it('sollte true für Person mit 4+ Assignments zurückgeben', () => {
      const person = testPeople[0];
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-01-01',
        weeks: 4,
        assignments: [1, 2, 3, 4].map(i => ({
          weekNumber: i,
          weekStartDate: `2024-0${i}-01`,
          assignedPeople: [person.id],
          fairnessScores: [1.0],
          hasMentor: false
        })),
        createdAt: new Date().toISOString()
      };
      
      expect(isExperienced(person, [schedule])).toBe(true);
    });
  });

  describe('calculatePriority', () => {
    it('sollte höhere Priority für unterselektierte Personen haben', () => {
      const person1 = testPeople[0];
      const person2 = testPeople[1];
      
      // Person1 hat ein Assignment, Person2 hat keins
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-01-01',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-01-01',
          assignedPeople: [person1.id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const priority1 = calculatePriority(person1, testPeople, [schedule], '2024-06-01');
      const priority2 = calculatePriority(person2, testPeople, [schedule], '2024-06-01');
      
      // Person2 sollte höhere Priority haben (wurde weniger ausgewählt)
      expect(priority2).toBeGreaterThan(priority1);
    });

    it('sollte für neue Personen ohne Assignments hohe Priority haben', () => {
      const person = createPerson('Brand New', '2024-05-01');
      const priority = calculatePriority(person, [person, ...testPeople], [], '2024-06-01');
      
      expect(priority).toBeGreaterThan(0);
    });
  });

  describe('selectTeamsAndSubstitutes', () => {
    it('sollte Team mit höchster Priority auswählen', () => {
      const result = selectTeamsAndSubstitutes(
        testPeople,
        [],
        '2024-06-01',
        [],
        2,
        1
      );
      
      expect(result.teamIds).toHaveLength(2);
      expect(result.substituteIds).toHaveLength(1);
      // Alice (153 days) and Bob (93 days) are both experienced, so no warning expected
      expect(result.warnings).toHaveLength(0);
    });

    it('sollte excludedIds respektieren', () => {
      const excludedId = testPeople[0].id;
      const result = selectTeamsAndSubstitutes(
        testPeople,
        [],
        '2024-06-01',
        [excludedId],
        2,
        0
      );
      
      expect(result.teamIds).not.toContain(excludedId);
    });

    it('sollte Warnung für zu wenig Personen geben', () => {
      const singlePerson = [testPeople[0]];
      const result = selectTeamsAndSubstitutes(
        singlePerson,
        [],
        '2024-06-01',
        [],
        2,
        2
      );
      
      expect(result.teamIds).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('sollte leeres Resultat für keine verfügbaren Personen geben', () => {
      const result = selectTeamsAndSubstitutes(
        [],
        [],
        '2024-06-01',
        [],
        2,
        2
      );
      
      expect(result.teamIds).toHaveLength(0);
      expect(result.warnings).toContain('No people available for assignment');
    });
  });

  describe('fillGapAfterDeletion', () => {
    it('sollte höchste Priority Person als Ersatz wählen', () => {
      const currentAssignment = [testPeople[0].id, testPeople[1].id];
      const deletedId = testPeople[1].id;
      
      const replacement = fillGapAfterDeletion(
        deletedId,
        currentAssignment,
        testPeople,
        [],
        '2024-06-01'
      );
      
      expect(replacement).toBe(testPeople[2].id); // Charlie ist noch verfügbar
    });

    it('sollte null zurückgeben wenn keine Person verfügbar', () => {
      const allAssigned = testPeople.map(p => p.id);
      const deletedId = testPeople[0].id;
      
      const replacement = fillGapAfterDeletion(
        deletedId,
        allAssigned,
        testPeople,
        [],
        '2024-06-01'
      );
      
      expect(replacement).toBeNull();
    });

    it('sollte inaktive Personen nicht auswählen', () => {
      const departed = markPersonDeparture(testPeople[2], '2024-05-31');
      const modifiedPeople = [...testPeople.slice(0, 2), departed];
      
      const currentAssignment = [testPeople[0].id];
      const deletedId = testPeople[1].id;
      
      const replacement = fillGapAfterDeletion(
        deletedId,
        currentAssignment,
        modifiedPeople,
        [],
        '2024-06-01'
      );
      
      // Sollte null sein, da Charlie ausgeschieden ist
      expect(replacement).toBeNull();
    });
  });

  describe('validateScheduleConstraints', () => {
    it('sollte gültigen Schedule ohne consecutive Assignments akzeptieren', () => {
      const assignments: WeekAssignment[] = [
        {
          weekNumber: 1,
          weekStartDate: '2024-01-01',
          assignedPeople: [testPeople[0].id, testPeople[1].id],
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        },
        {
          weekNumber: 2,
          weekStartDate: '2024-01-08',
          assignedPeople: [testPeople[2].id],
          fairnessScores: [1.0],
          hasMentor: false
        }
      ];
      
      const result = validateScheduleConstraints(assignments);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('sollte consecutive Assignments erkennen', () => {
      const assignments: WeekAssignment[] = [
        {
          weekNumber: 1,
          weekStartDate: '2024-01-01',
          assignedPeople: [testPeople[0].id, testPeople[1].id],
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        },
        {
          weekNumber: 2,
          weekStartDate: '2024-01-08',
          assignedPeople: [testPeople[0].id, testPeople[2].id], // Alice wieder
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        }
      ];
      
      const result = validateScheduleConstraints(assignments);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Consecutive week assignment');
    });

    it('sollte mehrere consecutive Violations erkennen', () => {
      const assignments: WeekAssignment[] = [
        {
          weekNumber: 1,
          weekStartDate: '2024-01-01',
          assignedPeople: [testPeople[0].id],
          fairnessScores: [1.0],
          hasMentor: false
        },
        {
          weekNumber: 2,
          weekStartDate: '2024-01-08',
          assignedPeople: [testPeople[0].id], // Consecutive
          fairnessScores: [1.0],
          hasMentor: false
        },
        {
          weekNumber: 3,
          weekStartDate: '2024-01-15',
          assignedPeople: [testPeople[0].id], // Consecutive
          fairnessScores: [1.0],
          hasMentor: false
        }
      ];
      
      const result = validateScheduleConstraints(assignments);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2); // Zwei Violations
    });
  });

  describe('calculateFairnessScore', () => {
    it('sollte FairnessCalculation mit allen Feldern erstellen', () => {
      const person = testPeople[0];
      const calc = calculateFairnessScore(person, [], '2024-06-01');
      
      expect(calc.personId).toBe(person.id);
      expect(calc.personName).toBe(person.name);
      expect(calc.daysPresent).toBeGreaterThan(0);
      expect(calc.totalAssignments).toBe(0);
      expect(calc.fairnessScore).toBeGreaterThan(0);
    });
  });

  describe('calculateAllFairnessScores', () => {
    it('sollte Scores für alle Personen berechnen', () => {
      const scores = calculateAllFairnessScores(testPeople, []);
      
      expect(scores).toHaveLength(3);
      expect(scores.every((s: { fairnessScore: number }) => s.fairnessScore > 0)).toBe(true);
    });

    it('sollte nur aktive Personen berücksichtigen wenn activeOnly=true', () => {
      const departed = markPersonDeparture(testPeople[2], '2024-05-31');
      const modifiedPeople = [...testPeople.slice(0, 2), departed];
      
      const scores = calculateAllFairnessScores(modifiedPeople, [], true);
      
      expect(scores.length).toBeLessThan(3);
    });
  });
});
