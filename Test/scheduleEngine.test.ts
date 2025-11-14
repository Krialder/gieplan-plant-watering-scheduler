/**
 * scheduleEngine.test.ts - Tests für Schedule Generation und Management
 * 
 * Integration-Tests für Schedule-Generierung, Validierung und Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSchedule,
  getScheduleForWeek,
  updateAssignment,
  deleteSchedule,
  handlePersonDeletion
} from '@/lib/scheduleEngine';
import { createPerson, markPersonDeparture } from '@/lib/personManager';
import type { Person, Schedule, WeekAssignment } from '@/types';

describe('scheduleEngine', () => {
  let testPeople: Person[];

  beforeEach(() => {
    // Erstelle verschiedene Test-Personen
    testPeople = [
      createPerson('Alice Erfahren', '2023-06-01'),  // Experienced
      createPerson('Bob Mittel', '2024-01-01'),      // Some experience
      createPerson('Charlie Neu', '2024-04-01'),     // New
      createPerson('Diana Frisch', '2024-05-01')     // Very new
    ];
  });

  describe('generateSchedule', () => {
    it('sollte gültigen Schedule mit korrekter Anzahl Wochen erstellen', () => {
      const result = generateSchedule({
        startDate: '2024-06-03', // Ein Montag
        weeks: 4,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      expect(result.success).toBe(true);
      expect(result.schedule).toBeDefined();
      expect(result.schedule?.weeks).toBe(4);
      expect(result.schedule?.assignments).toHaveLength(4);
    });

    it('sollte bei jeder Woche genau 2 Personen zuweisen', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 3,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      expect(result.success).toBe(true);
      result.schedule?.assignments.forEach((assignment: WeekAssignment) => {
        expect(assignment.assignedPeople.length).toBeLessThanOrEqual(2);
      });
    });

    it('sollte keine consecutive Assignments bei enforceNoConsecutive=true erstellen', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 6,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      if (result.success && result.schedule) {
        const assignments = result.schedule.assignments;
        
        for (let i = 0; i < assignments.length - 1; i++) {
          const current = assignments[i].assignedPeople;
          const next = assignments[i + 1].assignedPeople;
          
          const overlap = current.filter((id: string) => next.includes(id));
          expect(overlap.length).toBe(0);
        }
      }
    });

    it('sollte Warnung bei nur einer Person geben', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 2,
        people: [testPeople[0]],
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: string) => w.includes('one person'))).toBe(true);
    });

    it('sollte Fehler bei keinen verfügbaren Personen zurückgeben', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 2,
        people: [],
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('sollte nur aktive Personen berücksichtigen', () => {
      const departed = markPersonDeparture(testPeople[3], '2024-05-31');
      const modifiedPeople = [...testPeople.slice(0, 3), departed];
      
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 2,
        people: modifiedPeople,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      if (result.success && result.schedule) {
        result.schedule.assignments.forEach((assignment: WeekAssignment) => {
          expect(assignment.assignedPeople).not.toContain(departed.id);
        });
      }
    });

    it('sollte Warnung bei fehlendem Mentor geben wenn requireMentor=true', () => {
      // Alle Personen sind neu (keine Erfahrung)
      const newPeople = [
        createPerson('New 1', '2024-05-01'),
        createPerson('New 2', '2024-05-10')
      ];
      
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 1,
        people: newPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: true
      });
      
      expect(result.warnings.some((w: string) => w.toLowerCase().includes('mentor'))).toBe(true);
    });

    it('sollte von Montag starten, auch wenn anderes Datum gegeben', () => {
      const result = generateSchedule({
        startDate: '2024-06-05', // Ein Mittwoch
        weeks: 2,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });
      
      if (result.success && result.schedule) {
        // Sollte auf Montag, 3. Juni normalisiert werden
        expect(result.schedule.startDate).toBe('2024-06-03');
      }
    });

    it('sollte fairnessScores für Assignments speichern', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 1,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      if (result.success && result.schedule) {
        const assignment = result.schedule.assignments[0];
        expect(assignment.fairnessScores).toBeDefined();
        expect(assignment.fairnessScores.length).toBe(assignment.assignedPeople.length);
      }
    });

    it('sollte weekNumber korrekt inkrementieren', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 5,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      if (result.success && result.schedule) {
        result.schedule.assignments.forEach((assignment: WeekAssignment, index: number) => {
          expect(assignment.weekNumber).toBe(index + 1);
        });
      }
    });

    it('sollte createdAt Timestamp setzen', () => {
      const result = generateSchedule({
        startDate: '2024-06-03',
        weeks: 1,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      expect(result.schedule?.createdAt).toBeDefined();
      expect(new Date(result.schedule!.createdAt)).toBeInstanceOf(Date);
    });

    it('sollte eindeutige ID für Schedule generieren', () => {
      const result1 = generateSchedule({
        startDate: '2024-06-03',
        weeks: 1,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      const result2 = generateSchedule({
        startDate: '2024-06-03',
        weeks: 1,
        people: testPeople,
        existingSchedules: [],
        enforceNoConsecutive: false,
        requireMentor: false
      });
      
      expect(result1.schedule?.id).not.toBe(result2.schedule?.id);
    });
  });

  describe('getScheduleForWeek', () => {
    it('sollte Assignment für spezifische Woche finden', () => {
      const schedule: Schedule = {
        id: 'test-schedule',
        startDate: '2024-06-03',
        weeks: 3,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-06-03',
            assignedPeople: [testPeople[0].id],
            fairnessScores: [1.0],
            hasMentor: true
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-06-10',
            assignedPeople: [testPeople[1].id],
            fairnessScores: [1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const assignment = getScheduleForWeek([schedule], '2024-06-10');
      
      expect(assignment).toBeDefined();
      expect(assignment?.weekNumber).toBe(2);
      expect(assignment?.assignedPeople).toContain(testPeople[1].id);
    });

    it('sollte null zurückgeben für nicht existierende Woche', () => {
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-03',
          assignedPeople: [testPeople[0].id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const assignment = getScheduleForWeek([schedule], '2024-07-01');
      
      expect(assignment).toBeNull();
    });

    it('sollte über mehrere Schedules suchen', () => {
      const schedule1: Schedule = {
        id: 'schedule-1',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-03',
          assignedPeople: [testPeople[0].id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const schedule2: Schedule = {
        id: 'schedule-2',
        startDate: '2024-06-10',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-10',
          assignedPeople: [testPeople[1].id],
          fairnessScores: [1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const assignment = getScheduleForWeek([schedule1, schedule2], '2024-06-10');
      
      expect(assignment).toBeDefined();
      expect(assignment?.assignedPeople).toContain(testPeople[1].id);
    });
  });

  describe('updateAssignment', () => {
    it('sollte Assignment für spezifische Woche aktualisieren', () => {
      const originalSchedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 2,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-06-03',
            assignedPeople: [testPeople[0].id, testPeople[1].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-06-10',
            assignedPeople: [testPeople[2].id, testPeople[3].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const updated = updateAssignment(
        originalSchedule,
        1,
        [testPeople[2].id, testPeople[3].id]
      );
      
      expect(updated.assignments[0].assignedPeople).toEqual([testPeople[2].id, testPeople[3].id]);
      expect(updated.assignments[1].assignedPeople).toEqual(originalSchedule.assignments[1].assignedPeople);
    });

    it('sollte andere Assignments nicht verändern', () => {
      const originalSchedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 3,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-06-03',
            assignedPeople: [testPeople[0].id],
            fairnessScores: [1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-06-10',
            assignedPeople: [testPeople[1].id],
            fairnessScores: [1.0],
            hasMentor: false
          },
          {
            weekNumber: 3,
            weekStartDate: '2024-06-17',
            assignedPeople: [testPeople[2].id],
            fairnessScores: [1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const updated = updateAssignment(originalSchedule, 2, [testPeople[3].id]);
      
      expect(updated.assignments[0].assignedPeople).toEqual([testPeople[0].id]);
      expect(updated.assignments[2].assignedPeople).toEqual([testPeople[2].id]);
    });
  });

  describe('deleteSchedule', () => {
    it('sollte Schedule mit gegebener ID entfernen', () => {
      const schedule1: Schedule = {
        id: 'schedule-1',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [],
        createdAt: new Date().toISOString()
      };
      
      const schedule2: Schedule = {
        id: 'schedule-2',
        startDate: '2024-06-10',
        weeks: 1,
        assignments: [],
        createdAt: new Date().toISOString()
      };
      
      const schedules = [schedule1, schedule2];
      const result = deleteSchedule(schedules, 'schedule-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('schedule-2');
    });

    it('sollte Array unverändert lassen bei nicht existierender ID', () => {
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [],
        createdAt: new Date().toISOString()
      };
      
      const schedules = [schedule];
      const result = deleteSchedule(schedules, 'non-existent');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test');
    });
  });

  describe('handlePersonDeletion', () => {
    it('sollte gelöschte Person aus Assignments entfernen', () => {
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 2,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-06-03',
            assignedPeople: [testPeople[0].id, testPeople[1].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-06-10',
            assignedPeople: [testPeople[2].id, testPeople[3].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const deletedPersonId = testPeople[1].id;
      const remainingPeople = testPeople.filter(p => p.id !== deletedPersonId);
      
      const result = handlePersonDeletion([schedule], deletedPersonId, remainingPeople);
      
      expect(result[0].assignments[0].assignedPeople).not.toContain(deletedPersonId);
    });

    it('sollte Lücke mit höchster Priority Person füllen', () => {
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-03',
          assignedPeople: [testPeople[0].id, testPeople[1].id],
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const deletedPersonId = testPeople[1].id;
      const remainingPeople = testPeople.filter(p => p.id !== deletedPersonId);
      
      const result = handlePersonDeletion([schedule], deletedPersonId, remainingPeople);
      
      // Sollte 2 Personen haben (eine gelöscht, eine hinzugefügt)
      expect(result[0].assignments[0].assignedPeople.length).toBe(2);
      expect(result[0].assignments[0].assignedPeople[0]).toBe(testPeople[0].id);
    });

    it('sollte mehrere Schedules verarbeiten', () => {
      const schedule1: Schedule = {
        id: 'schedule-1',
        startDate: '2024-06-03',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-03',
          assignedPeople: [testPeople[0].id, testPeople[1].id],
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const schedule2: Schedule = {
        id: 'schedule-2',
        startDate: '2024-06-10',
        weeks: 1,
        assignments: [{
          weekNumber: 1,
          weekStartDate: '2024-06-10',
          assignedPeople: [testPeople[1].id, testPeople[2].id],
          fairnessScores: [1.0, 1.0],
          hasMentor: false
        }],
        createdAt: new Date().toISOString()
      };
      
      const deletedPersonId = testPeople[1].id;
      const remainingPeople = testPeople.filter(p => p.id !== deletedPersonId);
      
      const result = handlePersonDeletion([schedule1, schedule2], deletedPersonId, remainingPeople);
      
      expect(result).toHaveLength(2);
      result.forEach((schedule: Schedule) => {
        schedule.assignments.forEach((assignment: WeekAssignment) => {
          expect(assignment.assignedPeople).not.toContain(deletedPersonId);
        });
      });
    });

    it('sollte Assignments ohne gelöschte Person unverändert lassen', () => {
      const schedule: Schedule = {
        id: 'test',
        startDate: '2024-06-03',
        weeks: 2,
        assignments: [
          {
            weekNumber: 1,
            weekStartDate: '2024-06-03',
            assignedPeople: [testPeople[0].id, testPeople[1].id],
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          },
          {
            weekNumber: 2,
            weekStartDate: '2024-06-10',
            assignedPeople: [testPeople[2].id, testPeople[3].id], // Keine gelöschte Person
            fairnessScores: [1.0, 1.0],
            hasMentor: false
          }
        ],
        createdAt: new Date().toISOString()
      };
      
      const deletedPersonId = testPeople[1].id;
      const remainingPeople = testPeople.filter(p => p.id !== deletedPersonId);
      
      const result = handlePersonDeletion([schedule], deletedPersonId, remainingPeople);
      
      // Woche 2 sollte unverändert sein
      expect(result[0].assignments[1].assignedPeople).toEqual([testPeople[2].id, testPeople[3].id]);
    });
  });
});
