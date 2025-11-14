/**
 * stress-progressive-fairness.test.ts - Comprehensive Stress Test for Progressive Fairness
 * 
 * Simulates 3 years of realistic usage with:
 * - Random schedule generation (varying weeks)
 * - Random deletions (entire schedules and individual weeks)
 * - Re-generation after deletions
 * - Multiple runs with saved results
 */

import { describe, it, expect } from 'vitest';
import {
  initializeRunningState,
  updateRunningState,
  calculateStandardDeviation,
  getPersonAssignmentCount,
  type RunningFairnessState
} from '@/lib/fairnessEngine';
import { generateSchedule, deleteSchedule } from '@/lib/scheduleEngine';
import { createPerson } from '@/lib/personManager';
import type { Person, Schedule } from '@/types';
import { formatDate, addWeeks, parseDate } from '@/lib/dateUtils';
import * as fs from 'fs';
import * as path from 'path';

interface StressTestResult {
  runId: number;
  totalOperations: number;
  schedulesCreated: number;
  schedulesDeleted: number;
  weeksDeleted: number;
  finalStats: {
    totalWeeks: number;
    totalAssignments: number;
    assignmentCounts: { name: string; count: number }[];
    standardDeviation: number;
    mean: number;
    min: number;
    max: number;
    range: number;
  };
  operations: Array<{
    type: 'generate' | 'delete_schedule' | 'delete_week' | 'regenerate';
    timestamp: string;
    details: string;
  }>;
}

interface StressTestSummary {
  runs: StressTestResult[];
  aggregateStats: {
    avgStdDev: number;
    minStdDev: number;
    maxStdDev: number;
    avgRange: number;
    minRange: number;
    maxRange: number;
    totalOperations: number;
  };
}

describe('Progressive Fairness - 3-Year Stress Test', () => {
  const NUM_RUNS = 5;
  const SIMULATION_YEARS = 3;
  const PEOPLE_COUNT = 10;
  
  // Helper to save results
  function saveResults(summary: StressTestSummary, filename: string) {
    const resultsDir = path.join(process.cwd(), 'Test', 'stress-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filepath = path.join(resultsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    console.log(`\n✅ Results saved to: ${filepath}`);
  }
  
  // Helper to calculate statistics
  function calculateStats(people: Person[], schedules: Schedule[]) {
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
    
    const counts = Array.from(assignmentCounts.values());
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const range = max - min;
    const stdDev = calculateStandardDeviation(assignmentCounts);
    
    const assignmentCountsArray = people.map(p => ({
      name: p.name,
      count: assignmentCounts.get(p.id) || 0
    })).sort((a, b) => a.count - b.count);
    
    return {
      totalWeeks,
      totalAssignments: counts.reduce((sum, c) => sum + c, 0),
      assignmentCounts: assignmentCountsArray,
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
    
    const toDelete = Math.min(numWeeks, Math.floor(availableWeeks * 0.5)); // Max 50% deletion
    const indicesToDelete = new Set<number>();
    
    while (indicesToDelete.size < toDelete) {
      const randomIndex = Math.floor(Math.random() * availableWeeks);
      indicesToDelete.add(randomIndex);
    }
    
    // Delete in reverse order to maintain indices
    const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
    sortedIndices.forEach(index => {
      schedule.assignments.splice(index, 1);
    });
    
    return toDelete;
  }
  
  it('should maintain fairness over 3 years with random operations (5 runs)', async () => {
    const summary: StressTestSummary = {
      runs: [],
      aggregateStats: {
        avgStdDev: 0,
        minStdDev: Infinity,
        maxStdDev: -Infinity,
        avgRange: 0,
        minRange: Infinity,
        maxRange: -Infinity,
        totalOperations: 0
      }
    };
    
    console.log('\n🚀 Starting 3-Year Progressive Fairness Stress Test');
    console.log(`   Runs: ${NUM_RUNS}`);
    console.log(`   Years: ${SIMULATION_YEARS}`);
    console.log(`   People: ${PEOPLE_COUNT}\n`);
    
    for (let runId = 1; runId <= NUM_RUNS; runId++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Run ${runId}/${NUM_RUNS}`);
      console.log('='.repeat(60));
      
      // Initialize people (all start at beginning of simulation)
      const startDate = new Date(2023, 0, 1); // Jan 1, 2023
      const people: Person[] = Array.from({ length: PEOPLE_COUNT }, (_, i) => 
        createPerson(`Person_${String.fromCharCode(65 + i)}`, formatDate(startDate))
      );
      
      let schedules: Schedule[] = [];
      let currentDate = startDate;
      const endDate = new Date(2023 + SIMULATION_YEARS, 0, 1); // 3 years later
      
      const result: StressTestResult = {
        runId,
        totalOperations: 0,
        schedulesCreated: 0,
        schedulesDeleted: 0,
        weeksDeleted: 0,
        finalStats: {
          totalWeeks: 0,
          totalAssignments: 0,
          assignmentCounts: [],
          standardDeviation: 0,
          mean: 0,
          min: 0,
          max: 0,
          range: 0
        },
        operations: []
      };
      
      let operationCount = 0;
      
      while (currentDate < endDate) {
        operationCount++;
        
        // Random operation: 70% generate, 20% delete schedule, 10% delete weeks
        const rand = Math.random();
        
        if (rand < 0.70 || schedules.length === 0) {
          // GENERATE: Random number of weeks (4-20)
          const weeksToGenerate = Math.floor(Math.random() * 17) + 4; // 4-20 weeks
          
          const genResult = generateSchedule({
            startDate: formatDate(currentDate),
            weeks: weeksToGenerate,
            people,
            existingSchedules: schedules,
            enforceNoConsecutive: true,
            requireMentor: false
          });
          
          if (genResult.success && genResult.schedule) {
            schedules.push(genResult.schedule);
            result.schedulesCreated++;
            result.operations.push({
              type: 'generate',
              timestamp: formatDate(currentDate),
              details: `Generated ${genResult.schedule.assignments.length} weeks`
            });
            
            console.log(`  [${operationCount}] ✅ Generated ${genResult.schedule.assignments.length} weeks from ${formatDate(currentDate)}`);
            
            // Advance date by generated weeks
            currentDate = addWeeks(currentDate, genResult.schedule.assignments.length);
          } else {
            console.log(`  [${operationCount}] ⚠️  Generation failed, advancing 1 week`);
            currentDate = addWeeks(currentDate, 1);
          }
          
        } else if (rand < 0.90 && schedules.length > 0) {
          // DELETE SCHEDULE: Random schedule deletion
          const randomIndex = Math.floor(Math.random() * schedules.length);
          const deleted = schedules[randomIndex];
          schedules.splice(randomIndex, 1);
          result.schedulesDeleted++;
          result.operations.push({
            type: 'delete_schedule',
            timestamp: formatDate(currentDate),
            details: `Deleted schedule with ${deleted.assignments.length} weeks`
          });
          
          console.log(`  [${operationCount}] ❌ Deleted schedule with ${deleted.assignments.length} weeks`);
          
        } else if (schedules.length > 0) {
          // DELETE WEEKS: Random week deletion from random schedule
          const randomIndex = Math.floor(Math.random() * schedules.length);
          const schedule = schedules[randomIndex];
          const weeksToDelete = Math.floor(Math.random() * 5) + 1; // 1-5 weeks
          
          const deletedCount = deleteRandomWeeks(schedule, weeksToDelete);
          result.weeksDeleted += deletedCount;
          result.operations.push({
            type: 'delete_week',
            timestamp: formatDate(currentDate),
            details: `Deleted ${deletedCount} weeks from schedule`
          });
          
          console.log(`  [${operationCount}] 🗑️  Deleted ${deletedCount} weeks from schedule`);
          
          // Remove empty schedules
          schedules = schedules.filter(s => s.assignments.length > 0);
        }
        
        // Occasionally regenerate to fill gaps (20% chance)
        if (Math.random() < 0.20 && schedules.length > 0) {
          const gapWeeks = Math.floor(Math.random() * 8) + 4; // 4-12 weeks
          const gapResult = generateSchedule({
            startDate: formatDate(currentDate),
            weeks: gapWeeks,
            people,
            existingSchedules: schedules,
            enforceNoConsecutive: false,
            requireMentor: false
          });
          
          if (gapResult.success && gapResult.schedule && gapResult.schedule.assignments.length > 0) {
            schedules.push(gapResult.schedule);
            result.operations.push({
              type: 'regenerate',
              timestamp: formatDate(currentDate),
              details: `Regenerated ${gapResult.schedule.assignments.length} weeks (gap fill)`
            });
            
            console.log(`  [${operationCount}] 🔄 Regenerated ${gapResult.schedule.assignments.length} weeks (gap fill)`);
          }
        }
        
        // Progress time forward
        const daysToAdvance = Math.floor(Math.random() * 14) + 7; // 7-21 days
        currentDate = new Date(currentDate.getTime() + daysToAdvance * 24 * 60 * 60 * 1000);
        
        // Safety: Don't run too many operations
        if (operationCount >= 500) {
          console.log(`  ⚠️  Reached operation limit (500), stopping simulation`);
          break;
        }
      }
      
      // Calculate final statistics
      result.totalOperations = operationCount;
      result.finalStats = calculateStats(people, schedules);
      
      console.log(`\n📊 Run ${runId} Summary:`);
      console.log(`   Operations: ${result.totalOperations}`);
      console.log(`   Schedules Created: ${result.schedulesCreated}`);
      console.log(`   Schedules Deleted: ${result.schedulesDeleted}`);
      console.log(`   Weeks Deleted: ${result.weeksDeleted}`);
      console.log(`   Total Weeks: ${result.finalStats.totalWeeks}`);
      console.log(`   Total Assignments: ${result.finalStats.totalAssignments}`);
      console.log(`   Mean Assignments: ${result.finalStats.mean.toFixed(2)}`);
      console.log(`   Std Dev (σ): ${result.finalStats.standardDeviation.toFixed(3)}`);
      console.log(`   Range: ${result.finalStats.range} (${result.finalStats.min} - ${result.finalStats.max})`);
      console.log(`\n   Distribution:`);
      result.finalStats.assignmentCounts.forEach(({ name, count }) => {
        const bar = '█'.repeat(Math.floor(count / 5));
        console.log(`     ${name}: ${count.toString().padStart(4)} ${bar}`);
      });
      
      // Add to summary
      summary.runs.push(result);
      
      // Update aggregate stats
      summary.aggregateStats.minStdDev = Math.min(summary.aggregateStats.minStdDev, result.finalStats.standardDeviation);
      summary.aggregateStats.maxStdDev = Math.max(summary.aggregateStats.maxStdDev, result.finalStats.standardDeviation);
      summary.aggregateStats.minRange = Math.min(summary.aggregateStats.minRange, result.finalStats.range);
      summary.aggregateStats.maxRange = Math.max(summary.aggregateStats.maxRange, result.finalStats.range);
      summary.aggregateStats.totalOperations += result.totalOperations;
      
      // Validate fairness
      expect(result.finalStats.standardDeviation).toBeLessThan(5.0); // Should be reasonably fair
      expect(result.finalStats.range).toBeLessThan(20); // Range should be reasonable
    }
    
    // Calculate averages
    summary.aggregateStats.avgStdDev = summary.runs.reduce((sum, r) => sum + r.finalStats.standardDeviation, 0) / NUM_RUNS;
    summary.aggregateStats.avgRange = summary.runs.reduce((sum, r) => sum + r.finalStats.range, 0) / NUM_RUNS;
    
    // Print final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('FINAL SUMMARY - 3-Year Stress Test');
    console.log('='.repeat(60));
    console.log(`\n📈 Aggregate Statistics (${NUM_RUNS} runs):`);
    console.log(`   Total Operations: ${summary.aggregateStats.totalOperations}`);
    console.log(`   Avg Std Dev: ${summary.aggregateStats.avgStdDev.toFixed(3)}`);
    console.log(`   Min Std Dev: ${summary.aggregateStats.minStdDev.toFixed(3)}`);
    console.log(`   Max Std Dev: ${summary.aggregateStats.maxStdDev.toFixed(3)}`);
    console.log(`   Avg Range: ${summary.aggregateStats.avgRange.toFixed(1)}`);
    console.log(`   Min Range: ${summary.aggregateStats.minRange}`);
    console.log(`   Max Range: ${summary.aggregateStats.maxRange}`);
    
    console.log(`\n📋 Individual Run Results:`);
    summary.runs.forEach((run, idx) => {
      console.log(`   Run ${idx + 1}: σ=${run.finalStats.standardDeviation.toFixed(3)}, Range=${run.finalStats.range}, Ops=${run.totalOperations}`);
    });
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `stress-test-${timestamp}.json`;
    saveResults(summary, filename);
    
    // Final assertions
    expect(summary.aggregateStats.avgStdDev).toBeLessThan(3.0); // Average should be good
    expect(summary.aggregateStats.maxStdDev).toBeLessThan(5.0); // Even worst case should be acceptable
    expect(summary.aggregateStats.avgRange).toBeLessThan(15); // Range should be reasonable
    
    console.log(`\n✅ All stress tests passed!`);
  }, 300000); // 5 minute timeout
});
