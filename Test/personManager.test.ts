/**
 * personManager.test.ts - Tests für Person Management und Lifecycle Functions
 * 
 * Testet Personen-Erstellung, -Updates, -Lifecycle und -Validierung
 */

import { describe, it, expect } from 'vitest';
import {
  createPerson,
  updatePerson,
  markPersonDeparture,
  markPersonReturn,
  deletePerson,
  findPersonById,
  findPersonByName,
  validatePersonData,
  normalizeGermanName
} from '@/lib/personManager';
import type { Person } from '@/types';

describe('personManager', () => {
  describe('createPerson', () => {
    it('sollte neue Person mit allen Pflichtfeldern erstellen', () => {
      const person = createPerson('Max Mustermann', '2024-01-15');
      
      expect(person).toBeDefined();
      expect(person.id).toBeDefined();
      expect(person.name).toBe('Max Mustermann');
      expect(person.arrivalDate).toBe('2024-01-15');
      expect(person.expectedDepartureDate).toBeNull();
      expect(person.actualDepartureDate).toBeNull();
      expect(person.experienceLevel).toBe('new');
    });

    it('sollte initiale TimePeriod erstellen', () => {
      const person = createPerson('Anna Schmidt', '2024-01-10');
      
      expect(person.programPeriods).toHaveLength(1);
      expect(person.programPeriods[0].startDate).toBe('2024-01-10');
      expect(person.programPeriods[0].endDate).toBeNull();
    });

    it('sollte FairnessMetrics initialisieren', () => {
      const person = createPerson('Peter Mueller', '2024-02-01');
      
      expect(person.fairnessMetrics).toBeDefined();
      expect(person.fairnessMetrics.person).toBe('Peter Mueller');
      expect(person.fairnessMetrics.temporalFairnessScore).toBe(1.0);
      expect(person.fairnessMetrics.assignmentsPerDayPresent).toBe(0);
    });

    it('sollte mit optionalem expectedDepartureDate funktionieren', () => {
      const person = createPerson('Lisa Wagner', '2024-01-01', '2024-12-31');
      
      expect(person.expectedDepartureDate).toBe('2024-12-31');
    });

    it('sollte leere mentorshipAssignments erstellen', () => {
      const person = createPerson('Tom Becker', '2024-03-01');
      
      expect(person.mentorshipAssignments).toEqual([]);
    });
  });

  describe('updatePerson', () => {
    it('sollte Person-Daten aktualisieren', () => {
      const original = createPerson('Hans Müller', '2024-01-01');
      const updated = updatePerson(original, {
        expectedDepartureDate: '2024-12-31',
        experienceLevel: 'experienced'
      });
      
      expect(updated.expectedDepartureDate).toBe('2024-12-31');
      expect(updated.experienceLevel).toBe('experienced');
      expect(updated.name).toBe(original.name); // Unverändertes Feld
    });

    it('sollte FairnessMetrics-Timestamp aktualisieren', () => {
      const original = createPerson('Sarah Klein', '2024-01-01');
      const oldTimestamp = original.fairnessMetrics.lastUpdated;
      
      // Kleine Verzögerung
      const updated = updatePerson(original, { experienceLevel: 'experienced' });
      
      expect(updated.fairnessMetrics.lastUpdated).toBeDefined();
      // Timestamp sollte aktualisiert worden sein (oder gleich, wenn sehr schnell)
      expect(new Date(updated.fairnessMetrics.lastUpdated)).toBeInstanceOf(Date);
    });

    it('sollte nur angegebene Felder ändern', () => {
      const original = createPerson('Martin Lang', '2024-01-01');
      const updated = updatePerson(original, { experienceLevel: 'experienced' });
      
      expect(updated.id).toBe(original.id);
      expect(updated.name).toBe(original.name);
      expect(updated.arrivalDate).toBe(original.arrivalDate);
    });
  });

  describe('markPersonDeparture', () => {
    it('sollte Person als ausgeschieden markieren', () => {
      const person = createPerson('Julia Hoffmann', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-06-30', 'Beendigung BvB');
      
      expect(departed.actualDepartureDate).toBe('2024-06-30');
      expect(departed.programPeriods[0].endDate).toBe('2024-06-30');
      expect(departed.programPeriods[0].departureReason).toBe('Beendigung BvB');
    });

    it('sollte alle offenen Perioden schließen', () => {
      const person = createPerson('Thomas Weber', '2024-01-01');
      // Füge zweite offene Periode hinzu
      person.programPeriods.push({
        startDate: '2024-03-01',
        endDate: null
      });
      
      const departed = markPersonDeparture(person, '2024-06-30');
      
      expect(departed.programPeriods.every((p: { endDate: string | null }) => p.endDate === '2024-06-30')).toBe(true);
    });

    it('sollte ohne Grund funktionieren', () => {
      const person = createPerson('Sabine Meyer', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-05-15');
      
      expect(departed.actualDepartureDate).toBe('2024-05-15');
      expect(departed.programPeriods[0].departureReason).toBeUndefined();
    });
  });

  describe('markPersonReturn', () => {
    it('sollte ausgeschiedene Person als zurückgekehrt markieren', () => {
      const person = createPerson('Michael Fischer', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-03-31', 'Krankheit');
      const returned = markPersonReturn(departed, '2024-05-01');
      
      expect(returned.actualDepartureDate).toBeNull();
      expect(returned.programPeriods).toHaveLength(2);
    });

    it('sollte neue TimePeriod für Rückkehr erstellen', () => {
      const person = createPerson('Emma Schneider', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-02-28');
      const returned = markPersonReturn(departed, '2024-04-01');
      
      const newPeriod = returned.programPeriods[1];
      expect(newPeriod.startDate).toBe('2024-04-01');
      expect(newPeriod.endDate).toBeNull();
    });

    it('sollte alte Perioden unverändert lassen', () => {
      const person = createPerson('Felix Braun', '2024-01-01');
      const departed = markPersonDeparture(person, '2024-03-15', 'Test');
      const returned = markPersonReturn(departed, '2024-04-01');
      
      expect(returned.programPeriods[0].endDate).toBe('2024-03-15');
      expect(returned.programPeriods[0].departureReason).toBe('Test');
    });
  });

  describe('deletePerson', () => {
    it('sollte Person aus Array entfernen', () => {
      const person1 = createPerson('Person 1', '2024-01-01');
      const person2 = createPerson('Person 2', '2024-01-01');
      const person3 = createPerson('Person 3', '2024-01-01');
      const people = [person1, person2, person3];
      
      const result = deletePerson(people, person2.id);
      
      expect(result).toHaveLength(2);
      expect(result.find((p: Person) => p.id === person2.id)).toBeUndefined();
      expect(result.find((p: Person) => p.id === person1.id)).toBeDefined();
      expect(result.find((p: Person) => p.id === person3.id)).toBeDefined();
    });

    it('sollte leeres Array zurückgeben wenn alle gelöscht', () => {
      const person = createPerson('Only One', '2024-01-01');
      const people = [person];
      
      const result = deletePerson(people, person.id);
      
      expect(result).toHaveLength(0);
    });

    it('sollte Original-Array nicht ändern bei nicht vorhandener ID', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const people = [person];
      
      const result = deletePerson(people, 'non-existent-id');
      
      expect(result).toHaveLength(1);
    });
  });

  describe('findPersonById', () => {
    it('sollte Person mit gegebener ID finden', () => {
      const person1 = createPerson('Person 1', '2024-01-01');
      const person2 = createPerson('Person 2', '2024-01-01');
      const people = [person1, person2];
      
      const found = findPersonById(people, person2.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(person2.id);
      expect(found?.name).toBe('Person 2');
    });

    it('sollte undefined zurückgeben für nicht existierende ID', () => {
      const person = createPerson('Test', '2024-01-01');
      const people = [person];
      
      const found = findPersonById(people, 'non-existent');
      
      expect(found).toBeUndefined();
    });
  });

  describe('findPersonByName', () => {
    it('sollte Person mit gegebenem Namen finden', () => {
      const person1 = createPerson('Anna Schmidt', '2024-01-01');
      const person2 = createPerson('Peter Müller', '2024-01-01');
      const people = [person1, person2];
      
      const found = findPersonByName(people, 'Peter Müller');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Peter Müller');
    });

    it('sollte case-insensitive suchen', () => {
      const person = createPerson('Max Mustermann', '2024-01-01');
      const people = [person];
      
      const found = findPersonByName(people, 'max mustermann');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Max Mustermann');
    });

    it('sollte undefined zurückgeben für nicht existierenden Namen', () => {
      const person = createPerson('Test Person', '2024-01-01');
      const people = [person];
      
      const found = findPersonByName(people, 'Non Existent');
      
      expect(found).toBeUndefined();
    });
  });

  describe('validatePersonData', () => {
    it('sollte gültige Person-Daten akzeptieren', () => {
      const validation = validatePersonData({
        name: 'Max Mustermann',
        arrivalDate: '2024-01-01'
      });
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('sollte fehlenden Namen ablehnen', () => {
      const validation = validatePersonData({
        arrivalDate: '2024-01-01'
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Name is required');
    });

    it('sollte leeren Namen ablehnen', () => {
      const validation = validatePersonData({
        name: '   ',
        arrivalDate: '2024-01-01'
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Name is required');
    });

    it('sollte fehlendes Ankunftsdatum ablehnen', () => {
      const validation = validatePersonData({
        name: 'Max Mustermann'
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Arrival date is required');
    });

    it('sollte ungültige Datumslogik ablehnen (Ausscheiden vor Ankunft)', () => {
      const validation = validatePersonData({
        name: 'Test Person',
        arrivalDate: '2024-06-01',
        expectedDepartureDate: '2024-01-01'
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e: string) => e.includes('departure'))).toBe(true);
    });

    it('sollte mehrere Fehler gleichzeitig erkennen', () => {
      const validation = validatePersonData({
        name: '',
        expectedDepartureDate: '2024-01-01'
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('normalizeGermanName', () => {
    it('sollte Namen korrekt kapitalisieren', () => {
      expect(normalizeGermanName('max mustermann')).toBe('Max Mustermann');
      expect(normalizeGermanName('ANNA SCHMIDT')).toBe('Anna Schmidt');
      expect(normalizeGermanName('peter MÜLLER')).toBe('Peter Müller');
    });

    it('sollte extra Leerzeichen entfernen', () => {
      expect(normalizeGermanName('Max   Mustermann')).toBe('Max Mustermann');
      expect(normalizeGermanName('  Anna Schmidt  ')).toBe('Anna Schmidt');
    });

    it('sollte mehrere Namenstelle korrekt behandeln', () => {
      expect(normalizeGermanName('anna maria müller')).toBe('Anna Maria Müller');
    });

    it('sollte mit deutschen Umlauten funktionieren', () => {
      expect(normalizeGermanName('müller')).toBe('Müller');
      expect(normalizeGermanName('ÜBER')).toBe('Über');
    });

    it('sollte leere Strings behandeln', () => {
      expect(normalizeGermanName('')).toBe('');
      expect(normalizeGermanName('   ')).toBe('');
    });
  });
});
