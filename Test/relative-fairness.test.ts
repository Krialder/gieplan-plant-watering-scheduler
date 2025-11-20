/**
 * Relative Fairness System Test
 * 
 * Verifies that the fairness system is RELATIVE to when each person entered the pool:
 * - New people should get assignments at the SAME RATE as existing people
 * - New people should NOT catch up to existing people's total assignments
 * - Everyone should have similar assignments-per-week-in-pool regardless of join date
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getPersonAssignmentCount } from '@/lib/fairnessEngine';
import { createPerson } from '@/lib/personManager';
import type { Person, Schedule } from '@/types';

describe('Relative Fairness System', () => {
  it('should give new people same RATE, not same TOTAL (no catch-up)', () => {
    // Create 3 existing people
    const existing: Person[] = [
      createPerson('Alice', '2025-01-01'),
      createPerson('Bob', '2025-01-01'),
      createPerson('Charlie', '2025-01-01')
    ];

    // Generate 20 weeks for existing people
    const result1 = generateSchedule({
      startDate: '2025-01-06',
      weeks: 20,
      people: existing,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result1.success).toBe(true);
    const existingSchedules = result1.schedule ? [result1.schedule] : [];

    console.log('\n=== AFTER 20 WEEKS (3 existing people) ===');
    const existingAssignments = existing.map(p => {
      const count = getPersonAssignmentCount(p, existingSchedules);
      console.log(`${p.name}: ${count} assignments in 20 weeks = ${(count / 20).toFixed(2)} per week`);
      return count;
    });

    const avgExisting = existingAssignments.reduce((a, b) => a + b, 0) / existing.length;

    // Now add NEW person after 20 weeks
    const newPerson = createPerson('David', '2025-05-26'); // Joins at week 21
    const allPeople = [...existing, newPerson];

    console.log('\n=== NEW PERSON JOINS (week 21) ===');
    console.log(`David: 0 assignments (just joined)`);

    // Generate 20 MORE weeks with new person
    const result2 = generateSchedule({
      startDate: '2025-05-26',
      weeks: 20,
      people: allPeople,
      existingSchedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result2.success).toBe(true);
    const allSchedules = result2.schedule 
      ? [...existingSchedules, result2.schedule] 
      : existingSchedules;

    console.log('\n=== AFTER 20 MORE WEEKS (weeks 21-40) ===');
    
    // Existing people stats
    console.log('\nExisting people (40 weeks total):');
    const existingFinalAssignments = existing.map(p => {
      const totalAssignments = getPersonAssignmentCount(p, allSchedules);
      const rate = totalAssignments / 40;
      console.log(`${p.name}: ${totalAssignments} assignments in 40 weeks = ${rate.toFixed(2)} per week`);
      return totalAssignments;
    });

    const avgExistingFinal = existingFinalAssignments.reduce((a, b) => a + b, 0) / existing.length;

    // New person stats
    const newPersonAssignments = getPersonAssignmentCount(newPerson, allSchedules);
    const newPersonRate = newPersonAssignments / 20; // Only in pool for 20 weeks
    console.log(`\nNew person (20 weeks in pool):`);
    console.log(`David: ${newPersonAssignments} assignments in 20 weeks = ${newPersonRate.toFixed(2)} per week`);

    // Calculate assignments in second period only
    const secondPeriodSchedules = result2.schedule ? [result2.schedule] : [];
    console.log(`\n=== SECOND PERIOD ONLY (weeks 21-40) ===`);
    
    const secondPeriodAssignments = existing.map(p => {
      const count = getPersonAssignmentCount(p, secondPeriodSchedules);
      console.log(`${p.name}: ${count} assignments`);
      return count;
    });

    const newPersonSecondPeriod = getPersonAssignmentCount(newPerson, secondPeriodSchedules);
    console.log(`David: ${newPersonSecondPeriod} assignments`);

    // VERIFICATION: New person should get similar assignments in second period
    const avgSecondPeriod = secondPeriodAssignments.reduce((a, b) => a + b, 0) / existing.length;
    const difference = Math.abs(newPersonSecondPeriod - avgSecondPeriod);
    
    console.log(`\nAverage assignments in second period: ${avgSecondPeriod.toFixed(1)}`);
    console.log(`Difference (David vs average): ${difference.toFixed(1)}`);

    // New person should get approximately same assignments as others in the SAME period
    // Allow some variation (≤3 assignments difference)
    expect(difference).toBeLessThanOrEqual(3);

    // CRITICAL: New person should NOT have caught up to existing people's totals
    console.log(`\n=== TOTAL ASSIGNMENTS ===`);
    console.log(`Existing people average: ${avgExistingFinal.toFixed(1)}`);
    console.log(`New person: ${newPersonAssignments}`);
    console.log(`Gap: ${(avgExistingFinal - newPersonAssignments).toFixed(1)} assignments`);
    
    // New person should have LESS than existing people (they joined late)
    expect(newPersonAssignments).toBeLessThan(avgExistingFinal);
    
    // But the gap should be approximately 1 period worth (they missed 20 weeks)
    // Existing people got ~avgExisting in first 20 weeks
    const expectedGap = avgExisting;
    const actualGap = avgExistingFinal - newPersonAssignments;
    const gapDifference = Math.abs(actualGap - expectedGap);
    
    console.log(`Expected gap (from missed period): ~${expectedGap.toFixed(1)}`);
    console.log(`Actual gap: ${actualGap.toFixed(1)}`);
    console.log(`Gap difference: ${gapDifference.toFixed(1)}`);
    
    // Gap should match the missed period (within reason)
    expect(gapDifference).toBeLessThanOrEqual(5);
  });

  it('should maintain same rate for multiple new people joining at different times', () => {
    // Create 3 initial people (need at least 3 for team of 2)
    const initial: Person[] = [
      createPerson('Alice', '2025-01-01'),
      createPerson('Bob', '2025-01-01'),
      createPerson('Eve', '2025-01-01')
    ];

    // Generate 10 weeks
    const result1 = generateSchedule({
      startDate: '2025-01-06',
      weeks: 10,
      people: initial,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result1.success).toBe(true);
    let schedules = result1.schedule ? [result1.schedule] : [];

    // Add Charlie at week 11
    const charlie = createPerson('Charlie', '2025-03-17');
    let allPeople = [...initial, charlie];

    const result2 = generateSchedule({
      startDate: '2025-03-17',
      weeks: 10,
      people: allPeople,
      existingSchedules: schedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result2.success).toBe(true);
    schedules = result2.schedule ? [...schedules, result2.schedule] : schedules;

    // Add David at week 21
    const david = createPerson('David', '2025-05-26');
    allPeople = [...allPeople, david];

    const result3 = generateSchedule({
      startDate: '2025-05-26',
      weeks: 10,
      people: allPeople,
      existingSchedules: schedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result3.success).toBe(true);
    schedules = result3.schedule ? [...schedules, result3.schedule] : schedules;

    console.log('\n=== FINAL STATE (30 weeks total) ===');
    
    const rates = allPeople.map(p => {
      const assignments = getPersonAssignmentCount(p, schedules);
      let weeksInPool = 0;
      
      if (p.name === 'Alice' || p.name === 'Bob' || p.name === 'Eve') {
        weeksInPool = 30; // Full time
      } else if (p.name === 'Charlie') {
        weeksInPool = 20; // Joined at week 11
      } else if (p.name === 'David') {
        weeksInPool = 10; // Joined at week 21
      }
      
      const rate = weeksInPool > 0 ? assignments / weeksInPool : 0;
      console.log(`${p.name}: ${assignments} assignments / ${weeksInPool} weeks = ${rate.toFixed(3)} per week`);
      return rate;
    });

    // Calculate variance in rates
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgRate > 0 ? stdDev / avgRate : 0;

    console.log(`\nAverage rate: ${avgRate.toFixed(3)}`);
    console.log(`Standard deviation: ${stdDev.toFixed(3)}`);
    console.log(`Coefficient of variation: ${(cv * 100).toFixed(1)}%`);

    // All rates should be similar (CV < 25%)
    expect(cv).toBeLessThan(0.25);
  });
});
