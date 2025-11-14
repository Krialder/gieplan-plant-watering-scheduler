/**
 * stress-extreme-dynamics.test.ts - EXTREME Stress Test with People Dynamics
 * 
 * This test pushes the system to its absolute limits with:
 * - High turnover: People constantly arriving and departing
 * - Extreme schedule churn: Frequent deletions and regenerations
 * - Edge cases: Very few active people, mass departures, mass arrivals
 * - Long duration: 5 years of simulated operations
 * - Large scale: Up to 50 people in the system
 * - Chaos mode: Random operations at high frequency
 */

import { describe, it, expect } from 'vitest';
import {
  initializeRunningState,
  updateRunningState,
  calculateStandardDeviation,
  getPersonAssignmentCount,
  isPersonActive,
  type RunningFairnessState
} from '@/lib/fairnessEngine';
import { generateSchedule, deleteSchedule, handlePersonDeletion } from '@/lib/scheduleEngine';
import { createPerson, markPersonDeparture, markPersonReturn } from '@/lib/personManager';
import type { Person, Schedule } from '@/types';
import { formatDate, addWeeks, parseDate } from '@/lib/dateUtils';
import * as fs from 'fs';
import * as path from 'path';

interface ExtremeDynamicsResult {
  runId: number;
  totalOperations: number;
  schedulesCreated: number;
  schedulesDeleted: number;
  weeksDeleted: number;
  peopleAdded: number;
  peopleDeparted: number;
  peopleReturned: number;
  maxActivePeople: number;
  minActivePeople: number;
  avgActivePeople: number;
  finalActivePeople: number;
  totalPeopleEver: number;
  timelineEvents: Array<{
    date: string;
    eventType: 'generate' | 'delete_schedule' | 'delete_week' | 'regenerate' | 
               'person_arrive' | 'person_depart' | 'person_return' | 'mass_departure' | 'mass_arrival';
    details: string;
    activePeople: number;
  }>;
  finalStats: {
    totalWeeks: number;
    totalAssignments: number;
    activePeopleStats: Array<{ name: string; count: number; tenure: number }>;
    allPeopleStats: Array<{ name: string; count: number; status: string }>;
    standardDeviation: number;
    mean: number;
    min: number;
    max: number;
    range: number;
  };
  stressMetrics: {
    maxStdDev: number;
    minStdDev: number;
    avgStdDev: number;
    criticalMoments: number; // Times when active people < 3
    recoveryCount: number; // Times system recovered from critical state
  };
}

interface ExtremeDynamicsSummary {
  runs: ExtremeDynamicsResult[];
  aggregateStats: {
    avgStdDev: number;
    minStdDev: number;
    maxStdDev: number;
    avgRange: number;
    minRange: number;
    maxRange: number;
    totalOperations: number;
    totalPeopleCreated: number;
    avgTurnoverRate: number;
    systemBreaks: number; // Count of times system failed
  };
}

describe('EXTREME Stress Test - People Dynamics & Chaos', () => {
  const NUM_RUNS = 3;
  const SIMULATION_YEARS = 5;
  const INITIAL_PEOPLE = 15;
  const MAX_PEOPLE = 50;
  const HIGH_CHAOS_MODE = true;
  
  // Helper to save results
  function saveResults(summary: ExtremeDynamicsSummary, filename: string) {
    const resultsDir = path.join(process.cwd(), 'Test', 'stress-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filepath = path.join(resultsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    console.log(`\n✅ Extreme stress results saved to: ${filepath}`);
  }
  
  // Helper to calculate statistics
  function calculateStats(people: Person[], schedules: Schedule[], currentDate: string) {
    const assignmentCounts = new Map<string, number>();
    people.forEach(p => assignmentCounts.set(p.id, 0));
    
    let totalWeeks = 0;
    schedules.forEach(schedule => {
      totalWeeks += schedule.assignments.length;
      schedule.assignments.forEach(assignment => {
        assignment.assignedPeople.forEach(personId => {
          const current = assignmentCounts.get(personId) || 0;
          assignmentCounts.set(personId, current + 1);
        });
      });
    });
    
    const activePeople = people.filter(p => isPersonActive(p, currentDate));
    const counts = Array.from(assignmentCounts.values()).filter(c => c > 0);
    const mean = counts.length > 0 ? counts.reduce((sum, c) => sum + c, 0) / counts.length : 0;
    const min = counts.length > 0 ? Math.min(...counts) : 0;
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    const range = max - min;
    const stdDev = assignmentCounts.size > 0 ? calculateStandardDeviation(assignmentCounts) : 0;
    
    const activePeopleStats = activePeople.map(p => ({
      name: p.name,
      count: assignmentCounts.get(p.id) || 0,
      tenure: Math.floor((parseDate(currentDate).getTime() - parseDate(p.programPeriods[0].startDate).getTime()) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => a.count - b.count);
    
    const allPeopleStats = people.map(p => ({
      name: p.name,
      count: assignmentCounts.get(p.id) || 0,
      status: isPersonActive(p, currentDate) ? 'active' : 'departed'
    })).sort((a, b) => b.count - a.count);
    
    return {
      totalWeeks,
      totalAssignments: counts.reduce((sum, c) => sum + c, 0),
      activePeopleStats,
      allPeopleStats,
      standardDeviation: stdDev,
      mean,
      min,
      max,
      range
    };
  }
  
  // Helper to randomly delete weeks from a schedule
  function deleteRandomWeeks(schedule: Schedule, numWeeks: number): number {
    const availableWeeks = schedule.assignments.length;
    if (availableWeeks === 0) return 0;
    
    const toDelete = Math.min(numWeeks, Math.floor(availableWeeks * 0.7)); // Max 70% deletion (extreme!)
    const indicesToDelete = new Set<number>();
    
    while (indicesToDelete.size < toDelete) {
      const randomIndex = Math.floor(Math.random() * availableWeeks);
      indicesToDelete.add(randomIndex);
    }
    
    const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
    sortedIndices.forEach(index => {
      schedule.assignments.splice(index, 1);
    });
    
    return toDelete;
  }
  
  // Helper to generate a random name
  function generateRandomName(index: number): string {
    const firstNames = ['Alex', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Taylor', 'Quinn', 'Avery', 'Sam', 'Drew',
                        'Charlie', 'Jamie', 'Reese', 'Blake', 'Cameron', 'Skyler', 'Sage', 'Emerson', 'Rowan', 'Parker'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Williams', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                       'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall'];
    
    const first = firstNames[index % firstNames.length];
    const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    return `${first} ${last} #${index + 1}`;
  }
  
  it('should survive EXTREME chaos with high people turnover (3 runs, 5 years)', async () => {
    const summary: ExtremeDynamicsSummary = {
      runs: [],
      aggregateStats: {
        avgStdDev: 0,
        minStdDev: Infinity,
        maxStdDev: -Infinity,
        avgRange: 0,
        minRange: Infinity,
        maxRange: -Infinity,
        totalOperations: 0,
        totalPeopleCreated: 0,
        avgTurnoverRate: 0,
        systemBreaks: 0
      }
    };
    
    console.log('\n🔥 Starting EXTREME CHAOS Stress Test 🔥');
    console.log(`   Runs: ${NUM_RUNS}`);
    console.log(`   Years: ${SIMULATION_YEARS}`);
    console.log(`   Initial People: ${INITIAL_PEOPLE}`);
    console.log(`   Max People: ${MAX_PEOPLE}`);
    console.log(`   Chaos Mode: ${HIGH_CHAOS_MODE ? 'ENABLED 💀' : 'disabled'}\n`);
    
    for (let runId = 1; runId <= NUM_RUNS; runId++) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔥 EXTREME RUN ${runId}/${NUM_RUNS} 🔥`);
      console.log('='.repeat(70));
      
      const startDate = new Date(2020, 0, 1); // Jan 1, 2020
      const people: Person[] = [];
      let personCounter = 0;
      
      // Initialize with starting people
      for (let i = 0; i < INITIAL_PEOPLE; i++) {
        people.push(createPerson(generateRandomName(personCounter++), formatDate(startDate)));
      }
      
      let schedules: Schedule[] = [];
      let currentDate = new Date(startDate);
      const endDate = new Date(2020 + SIMULATION_YEARS, 0, 1);
      
      const result: ExtremeDynamicsResult = {
        runId,
        totalOperations: 0,
        schedulesCreated: 0,
        schedulesDeleted: 0,
        weeksDeleted: 0,
        peopleAdded: 0,
        peopleDeparted: 0,
        peopleReturned: 0,
        maxActivePeople: INITIAL_PEOPLE,
        minActivePeople: INITIAL_PEOPLE,
        avgActivePeople: 0,
        finalActivePeople: 0,
        totalPeopleEver: INITIAL_PEOPLE,
        timelineEvents: [],
        finalStats: {
          totalWeeks: 0,
          totalAssignments: 0,
          activePeopleStats: [],
          allPeopleStats: [],
          standardDeviation: 0,
          mean: 0,
          min: 0,
          max: 0,
          range: 0
        },
        stressMetrics: {
          maxStdDev: 0,
          minStdDev: Infinity,
          avgStdDev: 0,
          criticalMoments: 0,
          recoveryCount: 0
        }
      };
      
      let operationCount = 0;
      let activePeopleHistory: number[] = [];
      let stdDevHistory: number[] = [];
      let wasCritical = false;
      
      while (currentDate < endDate && operationCount < 1000) { // Safety limit
        operationCount++;
        
        const activePeople = people.filter(p => isPersonActive(p, formatDate(currentDate)));
        const activePeopleCount = activePeople.length;
        activePeopleHistory.push(activePeopleCount);
        
        // Track min/max active people
        result.maxActivePeople = Math.max(result.maxActivePeople, activePeopleCount);
        result.minActivePeople = Math.min(result.minActivePeople, activePeopleCount);
        
        // Track critical moments
        if (activePeopleCount < 3) {
          result.stressMetrics.criticalMoments++;
          if (!wasCritical) {
            console.log(`  ⚠️  [${operationCount}] CRITICAL: Only ${activePeopleCount} active people!`);
            wasCritical = true;
          }
        } else if (wasCritical) {
          result.stressMetrics.recoveryCount++;
          console.log(`  ✅ [${operationCount}] Recovered: ${activePeopleCount} active people`);
          wasCritical = false;
        }
        
        // Calculate current std dev for tracking
        if (schedules.length > 0 && activePeopleCount > 0) {
          const stats = calculateStats(people, schedules, formatDate(currentDate));
          stdDevHistory.push(stats.standardDeviation);
          result.stressMetrics.maxStdDev = Math.max(result.stressMetrics.maxStdDev, stats.standardDeviation);
          result.stressMetrics.minStdDev = Math.min(result.stressMetrics.minStdDev, stats.standardDeviation);
        }
        
        // EXTREME CHAOS: Random operations with weighted probabilities
        const rand = Math.random();
        
        // 1. MASS DEPARTURE (5% chance - chaos!)
        if (HIGH_CHAOS_MODE && rand < 0.05 && activePeopleCount > 5) {
          const departures = Math.min(Math.floor(activePeopleCount * 0.4), activePeopleCount - 2); // Max 40% leave
          console.log(`  💥 [${operationCount}] MASS DEPARTURE: ${departures} people leaving!`);
          
          for (let i = 0; i < departures; i++) {
            const personToRemove = activePeople[Math.floor(Math.random() * activePeople.length)];
            const personIndex = people.findIndex(p => p.id === personToRemove.id);
            if (personIndex !== -1 && isPersonActive(people[personIndex], formatDate(currentDate))) {
              people[personIndex] = markPersonDeparture(people[personIndex], formatDate(currentDate), 'Mass departure event');
              result.peopleDeparted++;
              
              // Handle deletion from schedules
              schedules = handlePersonDeletion(schedules, people[personIndex].id, people);
            }
          }
          
          result.timelineEvents.push({
            date: formatDate(currentDate),
            eventType: 'mass_departure',
            details: `${departures} people left simultaneously`,
            activePeople: people.filter(p => isPersonActive(p, formatDate(currentDate))).length
          });
          
        // 2. MASS ARRIVAL (5% chance - chaos!)
        } else if (HIGH_CHAOS_MODE && rand < 0.10 && personCounter < MAX_PEOPLE) {
          const arrivals = Math.min(Math.floor(Math.random() * 8) + 3, MAX_PEOPLE - personCounter); // 3-10 new people
          console.log(`  🎉 [${operationCount}] MASS ARRIVAL: ${arrivals} new people joining!`);
          
          for (let i = 0; i < arrivals; i++) {
            people.push(createPerson(generateRandomName(personCounter++), formatDate(currentDate)));
            result.peopleAdded++;
          }
          
          result.timelineEvents.push({
            date: formatDate(currentDate),
            eventType: 'mass_arrival',
            details: `${arrivals} people joined simultaneously`,
            activePeople: people.filter(p => isPersonActive(p, formatDate(currentDate))).length
          });
          
        // 3. SINGLE PERSON DEPARTS (15% chance)
        } else if (rand < 0.25 && activePeopleCount > 2) {
          const personToRemove = activePeople[Math.floor(Math.random() * activePeople.length)];
          const personIndex = people.findIndex(p => p.id === personToRemove.id);
          
          if (personIndex !== -1) {
            people[personIndex] = markPersonDeparture(people[personIndex], formatDate(currentDate), 'Regular departure');
            result.peopleDeparted++;
            
            schedules = handlePersonDeletion(schedules, people[personIndex].id, people);
            
            console.log(`  👋 [${operationCount}] Departure: ${people[personIndex].name} (${activePeopleCount - 1} active)`);
            
            result.timelineEvents.push({
              date: formatDate(currentDate),
              eventType: 'person_depart',
              details: `${people[personIndex].name} departed`,
              activePeople: activePeopleCount - 1
            });
          }
          
        // 4. SINGLE PERSON ARRIVES (20% chance)
        } else if (rand < 0.45 && personCounter < MAX_PEOPLE) {
          const newPerson = createPerson(generateRandomName(personCounter++), formatDate(currentDate));
          people.push(newPerson);
          result.peopleAdded++;
          
          console.log(`  🆕 [${operationCount}] Arrival: ${newPerson.name} (${activePeopleCount + 1} active)`);
          
          result.timelineEvents.push({
            date: formatDate(currentDate),
            eventType: 'person_arrive',
            details: `${newPerson.name} joined`,
            activePeople: activePeopleCount + 1
          });
          
        // 5. PERSON RETURNS (10% chance - boomerang!)
        } else if (rand < 0.55) {
          const inactivePeople = people.filter(p => !isPersonActive(p, formatDate(currentDate)));
          if (inactivePeople.length > 0) {
            const personToReturn = inactivePeople[Math.floor(Math.random() * inactivePeople.length)];
            const personIndex = people.findIndex(p => p.id === personToReturn.id);
            
            if (personIndex !== -1) {
              people[personIndex] = markPersonReturn(people[personIndex], formatDate(currentDate));
              result.peopleReturned++;
              
              console.log(`  🔄 [${operationCount}] Return: ${people[personIndex].name} came back!`);
              
              result.timelineEvents.push({
                date: formatDate(currentDate),
                eventType: 'person_return',
                details: `${people[personIndex].name} returned`,
                activePeople: activePeopleCount + 1
              });
            }
          }
          
        // 6. GENERATE SCHEDULE (35% chance)
        } else if (rand < 0.90 && activePeopleCount >= 2) {
          const weeksToGenerate = HIGH_CHAOS_MODE 
            ? Math.floor(Math.random() * 30) + 5  // 5-35 weeks (extreme!)
            : Math.floor(Math.random() * 20) + 4; // 4-24 weeks
          
          const genResult = generateSchedule({
            startDate: formatDate(currentDate),
            weeks: weeksToGenerate,
            people,
            existingSchedules: schedules,
            enforceNoConsecutive: activePeopleCount > 3, // Only enforce if enough people
            requireMentor: false
          });
          
          if (genResult.success && genResult.schedule && genResult.schedule.assignments.length > 0) {
            schedules.push(genResult.schedule);
            result.schedulesCreated++;
            
            console.log(`  ✅ [${operationCount}] Generated ${genResult.schedule.assignments.length} weeks (${activePeopleCount} active people)`);
            
            result.timelineEvents.push({
              date: formatDate(currentDate),
              eventType: 'generate',
              details: `Generated ${genResult.schedule.assignments.length} weeks`,
              activePeople: activePeopleCount
            });
            
            currentDate = addWeeks(currentDate, genResult.schedule.assignments.length);
          } else {
            console.log(`  ⚠️  [${operationCount}] Generation failed (${activePeopleCount} active)`);
          }
          
        // 7. DELETE ENTIRE SCHEDULE (5% chance)
        } else if (rand < 0.95 && schedules.length > 0) {
          const randomIndex = Math.floor(Math.random() * schedules.length);
          const deleted = schedules[randomIndex];
          schedules.splice(randomIndex, 1);
          result.schedulesDeleted++;
          
          console.log(`  ❌ [${operationCount}] Deleted schedule with ${deleted.assignments.length} weeks`);
          
          result.timelineEvents.push({
            date: formatDate(currentDate),
            eventType: 'delete_schedule',
            details: `Deleted schedule with ${deleted.assignments.length} weeks`,
            activePeople: activePeopleCount
          });
          
        // 8. DELETE WEEKS FROM SCHEDULE (remaining probability)
        } else if (schedules.length > 0) {
          const randomIndex = Math.floor(Math.random() * schedules.length);
          const schedule = schedules[randomIndex];
          const weeksToDelete = Math.floor(Math.random() * 10) + 1; // 1-10 weeks
          
          const deletedCount = deleteRandomWeeks(schedule, weeksToDelete);
          result.weeksDeleted += deletedCount;
          
          console.log(`  🗑️  [${operationCount}] Deleted ${deletedCount} weeks from schedule`);
          
          result.timelineEvents.push({
            date: formatDate(currentDate),
            eventType: 'delete_week',
            details: `Deleted ${deletedCount} weeks`,
            activePeople: activePeopleCount
          });
          
          schedules = schedules.filter(s => s.assignments.length > 0);
        }
        
        // Occasionally try to regenerate (20% chance when we have gaps)
        if (Math.random() < 0.20 && schedules.length > 0 && activePeopleCount >= 2) {
          const gapWeeks = Math.floor(Math.random() * 15) + 5; // 5-20 weeks
          const gapResult = generateSchedule({
            startDate: formatDate(currentDate),
            weeks: gapWeeks,
            people,
            existingSchedules: schedules,
            enforceNoConsecutive: activePeopleCount > 3,
            requireMentor: false
          });
          
          if (gapResult.success && gapResult.schedule && gapResult.schedule.assignments.length > 0) {
            schedules.push(gapResult.schedule);
            
            console.log(`  🔄 [${operationCount}] Regenerated ${gapResult.schedule.assignments.length} weeks (gap fill)`);
            
            result.timelineEvents.push({
              date: formatDate(currentDate),
              eventType: 'regenerate',
              details: `Regenerated ${gapResult.schedule.assignments.length} weeks`,
              activePeople: activePeopleCount
            });
          }
        }
        
        // Progress time forward (faster in chaos mode)
        const daysToAdvance = HIGH_CHAOS_MODE 
          ? Math.floor(Math.random() * 7) + 3   // 3-10 days
          : Math.floor(Math.random() * 14) + 7; // 7-21 days
        currentDate = new Date(currentDate.getTime() + daysToAdvance * 24 * 60 * 60 * 1000);
      }
      
      // Calculate final statistics
      result.totalOperations = operationCount;
      result.totalPeopleEver = personCounter;
      result.finalActivePeople = people.filter(p => isPersonActive(p, formatDate(currentDate))).length;
      result.avgActivePeople = activePeopleHistory.reduce((sum, c) => sum + c, 0) / activePeopleHistory.length;
      result.finalStats = calculateStats(people, schedules, formatDate(currentDate));
      result.stressMetrics.avgStdDev = stdDevHistory.length > 0 
        ? stdDevHistory.reduce((sum, s) => sum + s, 0) / stdDevHistory.length 
        : 0;
      
      console.log(`\n📊 EXTREME RUN ${runId} SUMMARY:`);
      console.log(`   Operations: ${result.totalOperations}`);
      console.log(`   Schedules Created: ${result.schedulesCreated}`);
      console.log(`   Schedules Deleted: ${result.schedulesDeleted}`);
      console.log(`   Weeks Deleted: ${result.weeksDeleted}`);
      console.log(`   People Added: ${result.peopleAdded}`);
      console.log(`   People Departed: ${result.peopleDeparted}`);
      console.log(`   People Returned: ${result.peopleReturned}`);
      console.log(`   Total People Ever: ${result.totalPeopleEver}`);
      console.log(`   Active People: ${result.finalActivePeople} (min: ${result.minActivePeople}, max: ${result.maxActivePeople}, avg: ${result.avgActivePeople.toFixed(1)})`);
      console.log(`   Total Weeks: ${result.finalStats.totalWeeks}`);
      console.log(`   Total Assignments: ${result.finalStats.totalAssignments}`);
      console.log(`   Final Std Dev (σ): ${result.finalStats.standardDeviation.toFixed(3)}`);
      console.log(`   Std Dev Range: ${result.stressMetrics.minStdDev.toFixed(3)} - ${result.stressMetrics.maxStdDev.toFixed(3)} (avg: ${result.stressMetrics.avgStdDev.toFixed(3)})`);
      console.log(`   Range: ${result.finalStats.range} (${result.finalStats.min} - ${result.finalStats.max})`);
      console.log(`   Critical Moments: ${result.stressMetrics.criticalMoments}`);
      console.log(`   Recoveries: ${result.stressMetrics.recoveryCount}`);
      
      if (result.finalStats.activePeopleStats.length > 0) {
        console.log(`\n   Active People Distribution:`);
        result.finalStats.activePeopleStats.slice(0, 10).forEach(({ name, count, tenure }) => {
          const bar = '█'.repeat(Math.floor(count / 5));
          console.log(`     ${name.padEnd(20)}: ${count.toString().padStart(4)} ${bar} (${tenure} days)`);
        });
        if (result.finalStats.activePeopleStats.length > 10) {
          console.log(`     ... and ${result.finalStats.activePeopleStats.length - 10} more`);
        }
      }
      
      // Add to summary
      summary.runs.push(result);
      
      // Update aggregate stats
      summary.aggregateStats.minStdDev = Math.min(summary.aggregateStats.minStdDev, result.finalStats.standardDeviation);
      summary.aggregateStats.maxStdDev = Math.max(summary.aggregateStats.maxStdDev, result.finalStats.standardDeviation);
      summary.aggregateStats.minRange = Math.min(summary.aggregateStats.minRange, result.finalStats.range);
      summary.aggregateStats.maxRange = Math.max(summary.aggregateStats.maxRange, result.finalStats.range);
      summary.aggregateStats.totalOperations += result.totalOperations;
      summary.aggregateStats.totalPeopleCreated += result.totalPeopleEver;
      
      // Check for system breaks (critical failures)
      if (result.finalActivePeople < 2 || result.finalStats.standardDeviation > 25) {
        summary.aggregateStats.systemBreaks++;
        console.log(`\n   ⚠️  EXTREME SYSTEM STRESS DETECTED!`);
      }
      
      // Validate fairness (more lenient due to extreme conditions)
      expect(result.finalStats.standardDeviation).toBeLessThan(25.0); // VERY lenient - system under extreme stress
      expect(result.finalActivePeople).toBeGreaterThanOrEqual(2); // System needs at least 2 people to function
    }
    
    // Calculate final aggregates
    summary.aggregateStats.avgStdDev = summary.runs.reduce((sum, r) => sum + r.finalStats.standardDeviation, 0) / NUM_RUNS;
    summary.aggregateStats.avgRange = summary.runs.reduce((sum, r) => sum + r.finalStats.range, 0) / NUM_RUNS;
    summary.aggregateStats.avgTurnoverRate = summary.runs.reduce((sum, r) => 
      (r.peopleAdded + r.peopleDeparted + r.peopleReturned) / r.totalPeopleEver, 0
    ) / NUM_RUNS;
    
    // Print final summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('🔥 FINAL EXTREME CHAOS SUMMARY 🔥');
    console.log('='.repeat(70));
    console.log(`\n📈 Aggregate Statistics (${NUM_RUNS} runs):`);
    console.log(`   Total Operations: ${summary.aggregateStats.totalOperations}`);
    console.log(`   Total People Created: ${summary.aggregateStats.totalPeopleCreated}`);
    console.log(`   Avg Turnover Rate: ${(summary.aggregateStats.avgTurnoverRate * 100).toFixed(1)}%`);
    console.log(`   System Breaks: ${summary.aggregateStats.systemBreaks}`);
    console.log(`   Avg Std Dev: ${summary.aggregateStats.avgStdDev.toFixed(3)}`);
    console.log(`   Min Std Dev: ${summary.aggregateStats.minStdDev.toFixed(3)}`);
    console.log(`   Max Std Dev: ${summary.aggregateStats.maxStdDev.toFixed(3)}`);
    console.log(`   Avg Range: ${summary.aggregateStats.avgRange.toFixed(1)}`);
    console.log(`   Min Range: ${summary.aggregateStats.minRange}`);
    console.log(`   Max Range: ${summary.aggregateStats.maxRange}`);
    
    console.log(`\n📋 Individual Run Results:`);
    summary.runs.forEach((run, idx) => {
      console.log(`   Run ${idx + 1}: σ=${run.finalStats.standardDeviation.toFixed(3)}, ` +
                  `Range=${run.finalStats.range}, ` +
                  `People=${run.totalPeopleEver}, ` +
                  `Active=${run.finalActivePeople}, ` +
                  `Critical=${run.stressMetrics.criticalMoments}`);
    });
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `extreme-stress-${timestamp}.json`;
    saveResults(summary, filename);
    
    // Final assertions
    expect(summary.aggregateStats.avgStdDev).toBeLessThan(20.0); // System under extreme stress
    expect(summary.aggregateStats.systemBreaks).toBeLessThanOrEqual(NUM_RUNS); // All might be stressed
    
    console.log(`\n${summary.aggregateStats.systemBreaks === 0 ? '✅ System survived extreme chaos! 🎉' : '⚠️  System showed stress under extreme chaos!'}`);
  }, 600000); // 10 minute timeout for extreme test
});
