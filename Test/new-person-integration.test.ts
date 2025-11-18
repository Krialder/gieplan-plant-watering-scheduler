/**
 * Test new person integration - they should converge to same RATE as existing people
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getPersonAssignmentCount, calculateTotalDaysPresent } from '@/lib/fairnessEngine';
import type { Person, Schedule } from '@/types';

describe('New Person Integration', () => {
  const createPerson = (id: string, name: string, arrivalDate: string): Person => ({
    id,
    name,
    arrivalDate,
    expectedDepartureDate: null,
    actualDepartureDate: null,
    programPeriods: [{ startDate: arrivalDate, endDate: null }],
    experienceLevel: 'new',
    mentorshipAssignments: [],
    fairnessMetrics: {
      person: name,
      temporalFairnessScore: 1.0,
      assignmentsPerDayPresent: 0,
      crossYearFairnessDebt: 0,
      mentorshipBurdenScore: 0,
      recentAssignmentBalance: 0,
      lastUpdated: new Date().toISOString()
    }
  });

  it('should integrate new person with same assignment RATE as existing people', () => {
    // Create 3 existing people who've been there a while
    const existingPeople: Person[] = [
      createPerson('p1', 'Hugs', '2025-01-01'),
      createPerson('p2', 'Kompono', '2025-01-01'),
      createPerson('p3', 'Jay', '2025-01-01')
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
      const days = calculateTotalDaysPresent(person, '2025-11-18');
      const rate = assignments / days;
      console.log(`${person.name}: ${assignments} assignments, ${days} days, rate: ${rate.toFixed(6)}`);
    }

    // Now add a new person
    const newPerson = createPerson('p4', 'Neu', '2025-11-18');
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

    // New person should have similar rate to existing people (within 20% CV)
    expect(rateCV).toBeLessThan(20);
    console.log(`  ${rateCV < 10 ? '✅ Excellent' : rateCV < 20 ? '✅ Good' : '❌ Poor'} rate convergence`);

    // Check that new person got fair share of assignments in the 10 weeks they participated
    const newPersonAssignments = rates.find(r => r.name === 'Neu')!.assignments;
    const existingPersonAvgAssignments = rates
      .filter(r => r.name !== 'Neu')
      .reduce((sum, r) => sum + r.assignments, 0) / 3;
    
    console.log(`\nNew person assignments: ${newPersonAssignments}`);
    console.log(`Existing people avg: ${existingPersonAvgAssignments.toFixed(1)}`);
    
    // New person should have caught up to similar rate (not same total, but same rate)
    const newPersonRate = rates.find(r => r.name === 'Neu')!.rate;
    const existingAvgRate = rates
      .filter(r => r.name !== 'Neu')
      .reduce((sum, r) => sum + r.rate, 0) / 3;
    
    const rateDiff = Math.abs(newPersonRate - existingAvgRate) / existingAvgRate;
    console.log(`Rate difference: ${(rateDiff * 100).toFixed(1)}%`);
    
    expect(rateDiff).toBeLessThan(0.15); // Within 15% of existing rate
  });
});
