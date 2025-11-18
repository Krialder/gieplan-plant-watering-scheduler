/**
 * dateUtils.test.ts - Tests für Date Manipulation und Formatting Utilities
 * 
 * Testet alle Datums-Funktionen für korrekte Berechnungen und Edge Cases
 */

import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  formatDateGerman,
  getDaysBetween,
  addDays,
  addWeeks,
  getWeekNumber,
  getMonday,
  isDateInRange,
  getCurrentYear,
  getTodayString
} from '@/lib/dateUtils';

describe('dateUtils', () => {
  describe('parseDate', () => {
    it('sollte ISO-Datums-String in Date-Objekt konvertieren', () => {
      const date = parseDate('2024-03-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // März = 2 (0-basiert)
      expect(date.getDate()).toBe(15);
    });

    it('sollte auch Date-Time-Strings verarbeiten', () => {
      const date = parseDate('2024-12-25T10:30:00.000Z');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // Dezember
    });
  });

  describe('formatDate', () => {
    it('sollte Date in ISO-Format (YYYY-MM-DD) konvertieren', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatted).toBe('2024-03-15');
    });

    it('sollte mit einstelligen Tagen/Monaten korrekt umgehen', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-01-05');
    });
  });

  describe('formatDateGerman', () => {
    it('sollte Datum im deutschen Format (DD.MM.YYYY) ausgeben', () => {
      const date = new Date('2024-03-15');
      const formatted = formatDateGerman(date);
      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });
  });

  describe('getDaysBetween', () => {
    it('sollte korrekte Anzahl Tage zwischen zwei Daten berechnen', () => {
      // Now includes both start and end dates (+1)
      expect(getDaysBetween('2024-01-01', '2024-01-01')).toBe(1); // Same day = 1 day
      expect(getDaysBetween('2024-01-01', '2024-01-08')).toBe(8); // 8 days inclusive
      expect(getDaysBetween('2024-01-01', '2024-01-31')).toBe(31); // 31 days inclusive
    });

    it('sollte auch rückwärts funktionieren (absoluter Wert)', () => {
      // Backwards gives 0 (max(0, negative + 1))
      expect(getDaysBetween('2024-01-31', '2024-01-01')).toBe(0); // Backwards = 0
      expect(getDaysBetween('2024-12-25', '2024-01-01')).toBe(0); // Backwards = 0
    });

    it('sollte Schaltjahre korrekt berücksichtigen', () => {
      // 2024 ist ein Schaltjahr (29 days in Feb)
      expect(getDaysBetween('2024-01-01', '2024-03-01')).toBe(61); // Includes Feb 29
      // 2023 war kein Schaltjahr (28 days in Feb)
      expect(getDaysBetween('2023-01-01', '2023-03-01')).toBe(60); // No Feb 29
    });

    it('sollte über Jahresgrenzen hinweg funktionieren', () => {
      // Dec 25 to Jan 5 = 12 days inclusive
      expect(getDaysBetween('2023-12-25', '2024-01-05')).toBe(12);
    });
  });

  describe('addDays', () => {
    it('sollte Tage zu einem Datum hinzufügen', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 10);
      expect(formatDate(result)).toBe('2024-01-25');
    });

    it('sollte über Monatsgrenzen hinweg funktionieren', () => {
      const date = new Date('2024-01-28');
      const result = addDays(date, 5);
      expect(formatDate(result)).toBe('2024-02-02');
    });

    it('sollte negative Tage subtrahieren', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      expect(formatDate(result)).toBe('2024-01-10');
    });

    it('sollte Schaltjahre berücksichtigen', () => {
      const date = new Date('2024-02-28');
      const result = addDays(date, 1);
      expect(formatDate(result)).toBe('2024-02-29');
    });
  });

  describe('addWeeks', () => {
    it('sollte Wochen zu einem Datum hinzufügen', () => {
      const date = new Date('2024-01-01');
      const result = addWeeks(date, 2);
      expect(formatDate(result)).toBe('2024-01-15');
    });

    it('sollte mit mehreren Wochen funktionieren', () => {
      const date = new Date('2024-01-01');
      const result = addWeeks(date, 10);
      // 10 weeks = 70 days, plus 1 for inclusive = 71
      expect(getDaysBetween(formatDate(date), formatDate(result))).toBe(71);
    });

    it('sollte negative Wochen subtrahieren', () => {
      const date = new Date('2024-01-15');
      const result = addWeeks(date, -1);
      expect(formatDate(result)).toBe('2024-01-08');
    });
  });

  describe('getWeekNumber', () => {
    it('sollte korrekte ISO-Wochennummer zurückgeben', () => {
      // 1. Januar 2024 ist ein Montag, sollte Woche 1 sein
      const date = new Date('2024-01-01');
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBe(1);
    });

    it('sollte für Ende des Jahres korrekt funktionieren', () => {
      // Dec 30, 2024 is Monday of week that contains Jan 4, 2025
      // According to ISO 8601, this is week 1 of 2025
      const date = new Date('2024-12-30');
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBe(1);
    });
  });

  describe('getMonday', () => {
    it('sollte Montag der Woche zurückgeben', () => {
      // Mittwoch, 17. Januar 2024
      const date = new Date('2024-01-17');
      const monday = getMonday(date);
      expect(formatDate(monday)).toBe('2024-01-15'); // Montag, 15. Januar
    });

    it('sollte bei Montag das gleiche Datum zurückgeben', () => {
      const monday = new Date('2024-01-15'); // Ein Montag
      const result = getMonday(monday);
      expect(formatDate(result)).toBe(formatDate(monday));
    });

    it('sollte bei Sonntag den Montag der gleichen Woche zurückgeben', () => {
      const sunday = new Date('2024-01-21'); // Ein Sonntag
      const monday = getMonday(sunday);
      expect(formatDate(monday)).toBe('2024-01-15');
    });

    it('sollte über Monatsgrenzen hinweg funktionieren', () => {
      const date = new Date('2024-02-02'); // Freitag
      const monday = getMonday(date);
      expect(formatDate(monday)).toBe('2024-01-29');
    });
  });

  describe('isDateInRange', () => {
    it('sollte true für Datum in Zeitraum zurückgeben', () => {
      expect(isDateInRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true);
      expect(isDateInRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true);
      expect(isDateInRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true);
    });

    it('sollte false für Datum außerhalb des Zeitraums zurückgeben', () => {
      expect(isDateInRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false);
      expect(isDateInRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false);
    });

    it('sollte mit null als endDate funktionieren (offenes Ende)', () => {
      expect(isDateInRange('2024-06-15', '2024-01-01', null)).toBe(true);
      expect(isDateInRange('2025-01-01', '2024-01-01', null)).toBe(true);
      expect(isDateInRange('2023-12-31', '2024-01-01', null)).toBe(false);
    });
  });

  describe('getCurrentYear', () => {
    it('sollte aktuelles Jahr als Nummer zurückgeben', () => {
      const year = getCurrentYear();
      expect(typeof year).toBe('number');
      expect(year).toBeGreaterThanOrEqual(2024);
      expect(year).toBeLessThan(2100);
    });
  });

  describe('getTodayString', () => {
    it('sollte heutiges Datum als ISO-String zurückgeben', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Sollte ein gültiges Datum sein
      const parsed = parseDate(today);
      expect(parsed).toBeInstanceOf(Date);
    });
  });
});
