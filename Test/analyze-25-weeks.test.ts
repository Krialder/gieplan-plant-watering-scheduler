/**
 * Analysis test for 25-week generation fairness issue
 * This test reproduces the scenario where generating 25 weeks at once
 * results in uneven "Zuweisung" (assignment) distribution
 */

import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getPersonAssignmentCount } from '@/lib/fairnessEngine';
import type { Person, Schedule } from '@/types';

describe('25-Week Generation Fairness Analysis', () => {
  // Create test people similar to what you have
  const createTestPeople = (count: number): Person[] => {
    const people: Person[] = [];
    const baseDate = '2025-11-18';
    
      for (let i = 0; i < count; i++) {
      people.push({
        id: `person-${i}`,
        name: `Person ${i + 1}`,
        arrivalDate: '2025-01-01', // Start earlier to ensure they have tenure
        expectedDepartureDate: null,
        actualDepartureDate: null,
        programPeriods: [
          {
            startDate: '2025-01-01',
            endDate: null
          }
        ],
        experienceLevel: 'new',
        mentorshipAssignments: [],
        fairnessMetrics: {
          person: `Person ${i + 1}`,
          temporalFairnessScore: 1.0,
          assignmentsPerDayPresent: 0,
          crossYearFairnessDebt: 0,
          mentorshipBurdenScore: 0,
          recentAssignmentBalance: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    return people;
  };

  it('should analyze assignment distribution for 25 weeks with 7 people', () => {
    const people = createTestPeople(7);
    const existingSchedules: Schedule[] = [];
    
    console.log('\n=== 25-Week Generation Analysis (7 people) ===\n');
    
    const result = generateSchedule({
      startDate: '2025-11-18',
      weeks: 25,
      people,
      existingSchedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    console.log('Generation result:', {
      success: result.success,
      errors: result.errors,
      warnings: result.warnings
    });
    
    if (result.schedule) {
      // Count assignments per person
      const assignments = new Map<string, number>();
      const weekDetails = new Map<string, string[]>();
      
      for (const person of people) {
        const count = getPersonAssignmentCount(person, [result.schedule]);
        assignments.set(person.name, count);
      }
      
      // Track which weeks each person got
      for (const assignment of result.schedule.assignments) {
        for (const personId of assignment.assignedPeople) {
          const person = people.find(p => p.id === personId);
          if (person) {
            const weeks = weekDetails.get(person.name) || [];
            weeks.push(`W${assignment.weekNumber}`);
            weekDetails.set(person.name, weeks);
          }
        }
      }
      
      // Calculate statistics
      const counts = Array.from(assignments.values());
      const total = counts.reduce((a, b) => a + b, 0);
      const mean = total / counts.length;
      const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
      const stdDev = Math.sqrt(variance);
      const min = Math.min(...counts);
      const max = Math.max(...counts);
      const range = max - min;
      
      // Expected assignments per person (for 25 weeks, 2 people per week = 50 slots / 7 people)
      const expected = (25 * 2) / 7; // ~7.14 assignments per person
      
      console.log('Assignment Distribution:');
      const sorted = Array.from(assignments.entries()).sort((a, b) => a[1] - b[1]);
      sorted.forEach(([name, count]) => {
        const diff = count - expected;
        const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        console.log(`  ${name}: ${count} assignments (${diffStr} from expected ${expected.toFixed(1)})`);
        console.log(`    Weeks: ${weekDetails.get(name)?.join(', ')}`);
      });
      
      console.log('\nStatistics:');
      console.log(`  Total slots: ${total} (expected: ${25 * 2})`);
      console.log(`  Mean: ${mean.toFixed(2)}`);
      console.log(`  Expected per person: ${expected.toFixed(2)}`);
      console.log(`  Std Dev: ${stdDev.toFixed(2)}`);
      console.log(`  Min: ${min}, Max: ${max}`);
      console.log(`  Range: ${range}`);
      console.log(`  Coefficient of Variation: ${(stdDev / mean * 100).toFixed(1)}%`);
      
      // Analyze fairness
      console.log('\nFairness Analysis:');
      if (range <= 2) {
        console.log('  ✅ EXCELLENT: Range ≤ 2 (very fair distribution)');
      } else if (range <= 4) {
        console.log('  ⚠️  ACCEPTABLE: Range ≤ 4 (reasonably fair)');
      } else {
        console.log(`  ❌ POOR: Range = ${range} (unfair distribution)`);
      }
      
      const cvThreshold = 15; // 15% coefficient of variation is acceptable
      const cv = (stdDev / mean * 100);
      if (cv <= cvThreshold) {
        console.log(`  ✅ CV = ${cv.toFixed(1)}% (acceptable variability)`);
      } else {
        console.log(`  ❌ CV = ${cv.toFixed(1)}% (too much variability, target < ${cvThreshold}%)`);
      }
      
      // Identify the issue
      console.log('\n📊 ISSUE IDENTIFICATION:');
      if (range > 4 || cv > cvThreshold) {
        console.log('PROBLEM DETECTED: Assignments are not evenly distributed!');
        console.log('\nPotential causes:');
        console.log('1. Randomization is creating patterns instead of breaking them');
        console.log('2. Priority calculation not converging to equal rates');
        console.log('3. Weighted score mixing (70% priority + 30% random) may be off');
        console.log('4. Group-based selection creating bias toward certain people');
      }
    }
  });

  it('should test with different scenarios', () => {
    const scenarios = [
      { people: 6, weeks: 25, name: '6 people, 25 weeks' },
      { people: 7, weeks: 25, name: '7 people, 25 weeks' },
      { people: 8, weeks: 25, name: '8 people, 25 weeks' },
      { people: 10, weeks: 25, name: '10 people, 25 weeks' }
    ];

    console.log('\n=== MULTI-SCENARIO COMPARISON ===\n');

    for (const scenario of scenarios) {
      const people = createTestPeople(scenario.people);
      const result = generateSchedule({
        startDate: '2025-11-18',
        weeks: scenario.weeks,
        people,
        existingSchedules: [],
        enforceNoConsecutive: true,
        requireMentor: false
      });

      if (result.schedule) {
        const assignments = new Map<string, number>();
        for (const person of people) {
          const count = getPersonAssignmentCount(person, [result.schedule]);
          assignments.set(person.name, count);
        }

        const counts = Array.from(assignments.values());
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const range = max - min;
        const cv = (stdDev / mean * 100);

        console.log(`${scenario.name}:`);
        console.log(`  Distribution: ${counts.sort((a, b) => a - b).join(', ')}`);
        console.log(`  Range: ${range}, StdDev: ${stdDev.toFixed(2)}, CV: ${cv.toFixed(1)}%`);
        console.log(`  Status: ${range <= 2 ? '✅ Good' : range <= 4 ? '⚠️ OK' : '❌ Poor'}\n`);
      }
    }
  });
});
