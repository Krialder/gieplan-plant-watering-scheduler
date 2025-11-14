/**
 * simple.test.ts - Einfacher Test zum Verifizieren der Test-Setup
 */

import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('sollte 1 + 1 = 2 berechnen', () => {
    expect(1 + 1).toBe(2);
  });

  it('sollte Strings vergleichen können', () => {
    expect('hello').toBe('hello');
  });

  it('sollte Arrays vergleichen können', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('sollte Objects vergleichen können', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toEqual({ name: 'Test', value: 42 });
  });

  it('sollte Boolean-Werte prüfen können', () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
  });

  it('sollte Zahlen-Vergleiche durchführen können', () => {
    expect(10).toBeGreaterThan(5);
    expect(5).toBeLessThan(10);
    expect(Math.PI).toBeCloseTo(3.14, 2);
  });

  it('sollte String-Matching durchführen können', () => {
    expect('Hello World').toContain('World');
    expect('Test123').toMatch(/Test\d+/);
  });
});
