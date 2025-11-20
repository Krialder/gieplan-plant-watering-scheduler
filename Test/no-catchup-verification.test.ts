/**
 * Verification that catch-up logic is COMPLETELY removed
 * 
 * This test specifically checks the scenario from the user's screenshots:
 * - Existing people with 10+ weeks of history
 * - New people joining late
 * - New people should NOT get 13 assignments to "catch up"
 * - Everyone should have similar rates, NOT similar totals
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getPersonAssignmentCount } from '@/lib/fairnessEngine';
import { createPerson } from '@/lib/personManager';
import type { Person } from '@/types';

describe('No Catch-Up Verification', () => {
  it('new people should NOT catch up to 13 assignments like in screenshots', () => {
    // Recreate the scenario: 6 existing people
    const existing: Person[] = [
      createPerson('Max', '2025-01-01'),
      createPerson('Jefferson', '2025-01-01'),
      createPerson('Ann', '2025-01-01'),
      createPerson('The Great', '2025-01-01'),
      createPerson('Jefferson2', '2025-01-01'),
      createPerson('Another', '2025-01-01')
    ];

    // Generate 27 weeks (matching user's "Start: 24.11.2025, 27 Wochen")
    const result1 = generateSchedule({
      startDate: '2025-11-24',
      weeks: 27,
      people: existing,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result1.success).toBe(true);
    let schedules = result1.schedule ? [result1.schedule] : [];

    console.log('\n=== AFTER 27 WEEKS (existing people) ===');
    const existingAssignments = existing.map(p => {
      const count = getPersonAssignmentCount(p, schedules);
      const rate = count / 27;
      console.log(`${p.name}: ${count} assignments (${rate.toFixed(3)} per week)`);
      return count;
    });

    const avgExisting = existingAssignments.reduce((a, b) => a + b, 0) / existing.length;
    console.log(`Average existing: ${avgExisting.toFixed(1)} assignments`);

    // Add new people late (matching "Du Nix", "Kai' Ser", "Test", "Neu" from screenshots)
    // These people arrive late and should NOT get 13 assignments
    const duNix = createPerson('Du Nix', '2025-11-20');  // Arrived week 0 (before start)
    const kaiSer = createPerson("Kai' Ser", '2025-11-20');
    const test = createPerson('Test', '2025-11-27');  // Arrived week 1
    const neu = createPerson('Neu', '2025-12-31');  // Arrived much later

    const allPeople = [...existing, duNix, kaiSer, test, neu];

    // Generate more weeks with new people included
    const result2 = generateSchedule({
      startDate: '2026-06-01', // Continue from week 28
      weeks: 15,
      people: allPeople,
      existingSchedules: schedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    expect(result2.success).toBe(true);
    schedules = result2.schedule ? [...schedules, result2.schedule] : schedules;

    console.log('\n=== AFTER ADDITIONAL 15 WEEKS ===');
    
    // Check existing people
    console.log('\nExisting people (42 weeks total):');
    const existingFinal = existing.map(p => {
      const total = getPersonAssignmentCount(p, schedules);
      const rate = total / 42;
      console.log(`${p.name}: ${total} assignments (${rate.toFixed(3)} per week)`);
      return total;
    });

    // Check new people
    console.log('\nNew people (varying weeks in pool):');
    
    const duNixAssignments = getPersonAssignmentCount(duNix, schedules);
    const duNixWeeks = 42; // Joined before start
    console.log(`Du Nix: ${duNixAssignments} assignments / ${duNixWeeks} weeks = ${(duNixAssignments/duNixWeeks).toFixed(3)} per week`);

    const kaiSerAssignments = getPersonAssignmentCount(kaiSer, schedules);
    const kaiSerWeeks = 42;
    console.log(`Kai' Ser: ${kaiSerAssignments} assignments / ${kaiSerWeeks} weeks = ${(kaiSerAssignments/kaiSerWeeks).toFixed(3)} per week`);

    const testAssignments = getPersonAssignmentCount(test, schedules);
    const testWeeks = 41; // Joined week 1
    console.log(`Test: ${testAssignments} assignments / ${testWeeks} weeks = ${(testAssignments/testWeeks).toFixed(3)} per week`);

    const neuAssignments = getPersonAssignmentCount(neu, schedules);
    const neuWeeks = 36; // Joined ~week 6
    console.log(`Neu: ${neuAssignments} assignments / ${neuWeeks} weeks = ${(neuAssignments/neuWeeks).toFixed(3)} per week`);

    // VERIFICATION: New people should NOT have ~13 assignments (catch-up behavior)
    console.log('\n=== VERIFICATION ===');
    
    // Calculate expected vs actual for new people
    const avgExistingFinal = existingFinal.reduce((a, b) => a + b, 0) / existing.length;
    const avgRate = avgExistingFinal / 42;

    console.log(`Average rate: ${avgRate.toFixed(3)} per week`);
    
    // Du Nix and Kai' Ser joined early - should have similar totals to existing
    console.log(`\nDu Nix expected: ~${(avgRate * duNixWeeks).toFixed(1)}, actual: ${duNixAssignments}`);
    expect(Math.abs(duNixAssignments - avgRate * duNixWeeks)).toBeLessThan(5);

    console.log(`Kai' Ser expected: ~${(avgRate * kaiSerWeeks).toFixed(1)}, actual: ${kaiSerAssignments}`);
    expect(Math.abs(kaiSerAssignments - avgRate * kaiSerWeeks)).toBeLessThan(5);

    // Test joined 1 week late - should have slightly less
    console.log(`Test expected: ~${(avgRate * testWeeks).toFixed(1)}, actual: ${testAssignments}`);
    expect(Math.abs(testAssignments - avgRate * testWeeks)).toBeLessThan(5);

    // Neu joined much later - should have MUCH LESS (proportional to time in pool)
    console.log(`Neu expected: ~${(avgRate * neuWeeks).toFixed(1)}, actual: ${neuAssignments}`);
    expect(Math.abs(neuAssignments - avgRate * neuWeeks)).toBeLessThan(5);

    // CRITICAL: New people should NOT all have ~13 assignments (that's catch-up!)
    // If they all have 13, something is wrong
    const newPeopleAssignments = [duNixAssignments, kaiSerAssignments, testAssignments, neuAssignments];
    const allAroundThirteen = newPeopleAssignments.every(a => a >= 12 && a <= 14);
    
    if (allAroundThirteen) {
      console.log('\n❌ CATCH-UP DETECTED: All new people have 12-14 assignments!');
      console.log('This means they are catching up to existing people instead of getting proportional assignments.');
    } else {
      console.log('\n✅ NO CATCH-UP: New people have assignments proportional to their time in pool.');
    }

    expect(allAroundThirteen).toBe(false);
  });
});
