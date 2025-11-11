/**
 * Debug test to verify behavior with 8 people (less than 10)
 * Should only exclude the assigned pair (2 people), NOT the substitutes
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { createPerson } from '@/lib/personManager';

describe('Debug - 8 People Scenario (<10)', () => {
  it('sollte Schedule mit 8 Personen generieren und nur Team (nicht Ersatz) ausschließen', () => {
    // Create 8 people all starting Jan 1, 2025
    const people = [];
    for (let i = 0; i < 8; i++) {
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

    console.log('Result with 8 people:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    if (result.schedule) {
      expect(result.schedule.assignments.length).toBe(6);
      
      // Verify that substitutes from previous week CAN be assigned in next week
      // (only the assigned pair should be excluded)
      const week1Assigned = result.schedule.assignments[0].assignedPeople;
      const week1Substitutes = result.schedule.assignments[0].substitutes;
      const week2Assigned = result.schedule.assignments[1].assignedPeople;
      
      // Week 1 assigned pair should NOT appear in week 2
      const week1AssignedInWeek2 = week1Assigned.some(id => week2Assigned.includes(id));
      expect(week1AssignedInWeek2).toBe(false);
      
      // But week 1 substitutes CAN appear in week 2 (they're not excluded with <10 people)
      console.log('\nWeek 1 Assigned:', week1Assigned);
      console.log('Week 1 Substitutes:', week1Substitutes);
      console.log('Week 2 Assigned:', week2Assigned);
    }
  });
});
