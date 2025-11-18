/**
 * Virtual History System Test
 * 
 * Demonstrates how the one-time virtual history works:
 * 1. New people get virtual assignments based on average rate of existing people
 * 2. Virtual assignments are a permanent baseline set at creation
 * 3. Real assignments accumulate on top of the virtual baseline
 * 4. This ensures new people start at the average, not at zero
 */

import { describe, it, expect } from 'vitest';
import { createPerson } from '../src/lib/personManager';
import { generateSchedule } from '../src/lib/scheduleEngine';
import type { Person, Schedule } from '../src/types';

describe('Virtual History System', () => {
  it('should give new person virtual history when people already have assignments', () => {
    // Create initial people starting on day 1
    const person1 = createPerson('Alice', '2025-01-01');
    const person2 = createPerson('Bob', '2025-01-01');
    const person3 = createPerson('Charlie', '2025-01-01');
    
    const initialPeople = [person1, person2, person3];
    
    // Generate 10 weeks of schedules (they accumulate assignments)
    const result = generateSchedule({
      startDate: '2025-01-06', // Monday of first week
      weeks: 10,
      people: initialPeople,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    expect(result.success).toBe(true);
    const schedule = result.schedule!;
    
    // Now a new person joins on day 71 (after 10 weeks)
    const newPerson = createPerson(
      'David',
      '2025-03-17',
      null,
      initialPeople,
      [schedule]
    );
    
    // New person should have virtual history
    expect(newPerson.virtualHistory).toBeDefined();
    
    if (newPerson.virtualHistory) {
      console.log('\n📊 Virtual History Analysis:');
      console.log(`Virtual Assignments: ${newPerson.virtualHistory.virtualAssignments.toFixed(2)}`);
      console.log(`Average Rate at Creation: ${newPerson.virtualHistory.averageRateAtCreation.toFixed(4)}`);
      console.log(`Baseline Date: ${newPerson.virtualHistory.baselineDate}`);
      
      // Virtual assignments should be positive (they missed some scheduling rounds)
      expect(newPerson.virtualHistory.virtualAssignments).toBeGreaterThan(0);
      
      // Average rate should be > 0 (existing people have assignments)
      expect(newPerson.virtualHistory.averageRateAtCreation).toBeGreaterThan(0);
    }
  });
  
  it('should NOT give virtual history when no schedules exist yet (everyone starts fresh)', () => {
    const person1 = createPerson('Alice', '2025-01-01');
    const person2 = createPerson('Bob', '2025-01-01');
    
    // Create new person when no schedules exist
    const newPerson = createPerson(
      'Charlie',
      '2025-01-15',
      null,
      [person1, person2],
      [] // No schedules
    );
    
    // No virtual history needed - everyone starts at zero
    expect(newPerson.virtualHistory).toBeUndefined();
  });
  
  it('should NOT give virtual history when no one has assignments yet', () => {
    const person1 = createPerson('Alice', '2025-01-01');
    const person2 = createPerson('Bob', '2025-01-01');
    
    // Create a schedule but haven't generated assignments yet (edge case)
    // In practice this shouldn't happen, but we handle it gracefully
    const emptySchedule: Schedule = {
      id: 'test-schedule',
      startDate: '2025-01-06',
      weeks: 0,
      assignments: [],
      createdAt: new Date().toISOString()
    };
    
    const newPerson = createPerson(
      'Charlie',
      '2025-01-15',
      null,
      [person1, person2],
      [emptySchedule]
    );
    
    // No virtual history - no one has been assigned yet
    expect(newPerson.virtualHistory).toBeUndefined();
  });
  
  it('virtual history should be permanent and work with real assignments', () => {
    // Setup: Create people and generate some schedules
    const person1 = createPerson('Alice', '2025-01-01');
    const person2 = createPerson('Bob', '2025-01-01');
    const person3 = createPerson('Charlie', '2025-01-01');
    
    const initialPeople = [person1, person2, person3];
    
    // Generate first batch of schedules
    const result1 = generateSchedule({
      startDate: '2025-01-06',
      weeks: 5,
      people: initialPeople,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    expect(result1.success).toBe(true);
    const schedule1 = result1.schedule!;
    
    // New person joins with virtual history
    const newPerson = createPerson(
      'David',
      '2025-02-10',
      null,
      initialPeople,
      [schedule1]
    );
    
    const virtualAssignments = newPerson.virtualHistory?.virtualAssignments || 0;
    
    // Generate more schedules with the new person
    const allPeople = [...initialPeople, newPerson];
    const result2 = generateSchedule({
      startDate: '2025-02-10',
      weeks: 5,
      people: allPeople,
      existingSchedules: [schedule1],
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    expect(result2.success).toBe(true);
    const schedule2 = result2.schedule!;
    
    // Count real assignments for new person
    let realAssignments = 0;
    for (const assignment of schedule2.assignments) {
      if (assignment.assignedPeople.includes(newPerson.id)) {
        realAssignments++;
      }
    }
    
    console.log('\n📈 Virtual + Real Assignments:');
    console.log(`Virtual Assignments (baseline): ${virtualAssignments.toFixed(2)}`);
    console.log(`Real Assignments (earned): ${realAssignments}`);
    console.log(`Total Effective Assignments: ${(virtualAssignments + realAssignments).toFixed(2)}`);
    
    // Virtual history is permanent - it doesn't change
    // Real assignments accumulate on top
    expect(newPerson.virtualHistory?.virtualAssignments).toBe(virtualAssignments);
  });
});
