/**
 * Debug test to reproduce the 10 people, 6 weeks scenario
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { createPerson } from '@/lib/personManager';

describe('Debug - 10 People, 6 Weeks Scenario', () => {
  it('sollte Schedule mit 10 Personen und 6 Wochen generieren', () => {
    // Create 10 people all starting Jan 1, 2025
    const people = [];
    for (let i = 0; i < 10; i++) {
      people.push(createPerson(`Person ${i + 1}`, '2025-01-01'));
    }

    const result = generateSchedule({
      startDate: '2025-11-11',
      weeks: 6,
      people,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    if (result.schedule) {
      expect(result.schedule.assignments.length).toBe(6);
    }
  });
});
