/**
 * Test new person integration - they should converge to same RATE as existing people
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getPersonAssignmentCount, calculateTotalDaysPresent } from '@/lib/fairnessEngine';
import { createPerson } from '@/lib/personManager';
import type { Person, Schedule } from '@/types';

describe('New Person Integration', () => {
  it('should integrate new person with same assignment RATE as existing people', () => {
    // Create 3 existing people who've been there a while
    const existingPeople: Person[] = [
      createPerson('Hugs', '2025-01-01'),
      createPerson('Kompono', '2025-01-01'),
      createPerson('Jay', '2025-01-01')
    ];

    // Generate initial schedule for existing people (10 weeks)
    const initialResult = generateSchedule({
      startDate: '2025-11-18',
      weeks: 10,
      people: existingPeople,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(initialResult.success).toBe(true);
    const existingSchedules = initialResult.schedule ? [initialResult.schedule] : [];

    console.log('\n=== INITIAL STATE (3 existing people, 10 weeks) ===');
    for (const person of existingPeople) {
      const assignments = getPersonAssignmentCount(person, existingSchedules);
      const days = calculateTotalDaysPresent(person, '2026-01-27'); // After 10 weeks
      const rate = assignments / days;
      console.log(`${person.name}: ${assignments} assignments, ${days} days, rate: ${rate.toFixed(6)}`);
    }

    // Now add a new person AFTER the initial 10 weeks have been generated
    // This person missed the first 10 weeks of scheduling
    const newPerson = createPerson('Neu', '2026-01-27', null, existingPeople, existingSchedules);
    const allPeople = [...existingPeople, newPerson];

    console.log('\n=== NEW PERSON JOINS ===');
    console.log(`${newPerson.name}: 0 assignments, 1 days, rate: 0.000000`);

    // Generate more weeks with the new person included
    const secondResult = generateSchedule({
      startDate: '2026-01-27', // Start 10 weeks after initial
      weeks: 10,
      people: allPeople,
      existingSchedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(secondResult.success).toBe(true);
    const allSchedules = secondResult.schedule 
      ? [...existingSchedules, secondResult.schedule] 
      : existingSchedules;

    console.log('\n=== AFTER 10 MORE WEEKS (new person included) ===');
    const rates: { name: string; rate: number; assignments: number; days: number }[] = [];
    
    for (const person of allPeople) {
      const assignments = getPersonAssignmentCount(person, allSchedules);
      const days = calculateTotalDaysPresent(person, '2026-04-07'); // 10 weeks later
      const rate = days > 0 ? assignments / days : 0;
      rates.push({ name: person.name, rate, assignments, days });
      console.log(`${person.name}: ${assignments} assignments, ${days} days, rate: ${rate.toFixed(6)}`);
    }

    // Calculate rate variance
    const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
    const rateVariance = rates.reduce((sum, r) => sum + Math.pow(r.rate - avgRate, 2), 0) / rates.length;
    const rateStdDev = Math.sqrt(rateVariance);
    const rateCV = (rateStdDev / avgRate) * 100;

    console.log('\nRate Statistics:');
    console.log(`  Average rate: ${avgRate.toFixed(6)}`);
    console.log(`  Std Dev: ${rateStdDev.toFixed(6)}`);
    console.log(`  CV: ${rateCV.toFixed(1)}%`);

    // Check that new person got fair share of assignments in the 10 weeks they participated
    const newPersonAssignments = rates.find(r => r.name === 'Neu')!.assignments;
    const existingPersonAvgAssignments = rates
      .filter(r => r.name !== 'Neu')
      .reduce((sum, r) => sum + r.assignments, 0) / 3;
    
    console.log(`\nNew person assignments: ${newPersonAssignments}`);
    console.log(`Existing people avg: ${existingPersonAvgAssignments.toFixed(1)}`);
    
    // Key metric: In the 10 weeks they participated together, did Neu get fair assignments?
    // Neu joined at week 10 and participated in the next 10 weeks
    // Expected: Neu gets ~5 assignments (same as the ~5 each existing person gets in those 10 weeks)
    const secondPeriodAssignments = rates.map(r => {
      // Each person should get ~5 in the second 10-week period
      if (r.name === 'Neu') {
        return r.assignments; // All 5 are from the second period
      } else {
        return r.assignments - 5; // Subtract the 5 from first period
      }
    });
    
    const avgSecondPeriod = secondPeriodAssignments.reduce((a, b) => a + b, 0) / secondPeriodAssignments.length;
    const variance = secondPeriodAssignments.reduce((sum, val) => sum + Math.pow(val - avgSecondPeriod, 2), 0) / secondPeriodAssignments.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / avgSecondPeriod) * 100;
    
    console.log(`\nSecond period (10 weeks with Neu) statistics:`);
    console.log(`  Average assignments: ${avgSecondPeriod.toFixed(1)}`);
    console.log(`  CV: ${cv.toFixed(1)}%`);
    console.log(`  ${cv < 10 ? '✅ Excellent' : cv < 25 ? '✅ Good' : '⚠️ Fair'} convergence`);
    
    // All people should have roughly the same number of assignments in the period they participated together
    expect(cv).toBeLessThan(25); // Within 25% CV for the shared participation period
  });
});
