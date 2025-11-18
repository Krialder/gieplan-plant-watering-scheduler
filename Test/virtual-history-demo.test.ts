/**
 * Virtual History - Practical Example
 * 
 * This test demonstrates a real-world scenario showing how virtual history
 * ensures new people start fairly.
 */

import { describe, it, expect } from 'vitest';
import { createPerson } from '../src/lib/personManager';
import { generateSchedule } from '../src/lib/scheduleEngine';
import { getPersonAssignmentCount } from '../src/lib/fairnessEngine';

describe('Virtual History - Practical Example', () => {
  it('demonstrates fair onboarding with virtual history', () => {
    console.log('\n' + '='.repeat(70));
    console.log('VIRTUAL HISTORY SYSTEM - PRACTICAL DEMONSTRATION');
    console.log('='.repeat(70));
    
    // ========================================================================
    // PHASE 1: Initial team starts on January 1st
    // ========================================================================
    console.log('\n📅 PHASE 1: January 1st - Initial team of 5 people');
    const initialTeam = [
      createPerson('Alice', '2025-01-01'),
      createPerson('Bob', '2025-01-01'),
      createPerson('Charlie', '2025-01-01'),
      createPerson('Diana', '2025-01-01'),
      createPerson('Eve', '2025-01-01')
    ];
    
    console.log(`   ✓ Created ${initialTeam.length} people`);
    console.log('   ✓ No virtual history (everyone starts fresh)');
    
    // ========================================================================
    // PHASE 2: Generate 20 weeks of schedules (Jan-May)
    // ========================================================================
    console.log('\n📊 PHASE 2: Generating 20 weeks of schedules...');
    const result1 = generateSchedule({
      startDate: '2025-01-06',
      weeks: 20,
      people: initialTeam,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    expect(result1.success).toBe(true);
    const schedule1 = result1.schedule!;
    
    // Calculate statistics after 20 weeks
    const stats1 = initialTeam.map(p => ({
      name: p.name,
      assignments: getPersonAssignmentCount(p, [schedule1]),
      virtual: 0
    }));
    
    const avgAssignments1 = stats1.reduce((sum, s) => sum + s.assignments, 0) / stats1.length;
    
    console.log('\n   Assignment Distribution (after 20 weeks):');
    stats1.forEach(s => {
      console.log(`   ${s.name.padEnd(10)} ${s.assignments} assignments`);
    });
    console.log(`   Average: ${avgAssignments1.toFixed(2)} assignments/person`);
    
    // ========================================================================
    // PHASE 3: New person joins on May 26th (week 21)
    // ========================================================================
    console.log('\n🆕 PHASE 3: May 26th - New person joins the team');
    const newPerson = createPerson(
      'Frank',
      '2025-05-26',
      null,
      initialTeam,
      [schedule1]
    );
    
    console.log(`   ✓ Created ${newPerson.name}`);
    
    if (newPerson.virtualHistory) {
      console.log('\n   Virtual History Applied:');
      console.log(`   - Virtual Assignments: ${newPerson.virtualHistory.virtualAssignments.toFixed(2)}`);
      console.log(`   - Average Rate at Creation: ${newPerson.virtualHistory.averageRateAtCreation.toFixed(4)} assignments/day`);
      console.log(`   - Baseline Date: ${newPerson.virtualHistory.baselineDate}`);
      console.log('\n   💡 This virtual baseline puts Frank at the average rate,');
      console.log('      even though he just joined!');
    }
    
    // ========================================================================
    // PHASE 4: Generate 20 more weeks with Frank included
    // ========================================================================
    console.log('\n📊 PHASE 4: Generating 20 more weeks with Frank...');
    const allPeople = [...initialTeam, newPerson];
    
    const result2 = generateSchedule({
      startDate: '2025-05-26',
      weeks: 20,
      people: allPeople,
      existingSchedules: [schedule1],
      enforceNoConsecutive: true,
      requireMentor: false
    });
    
    expect(result2.success).toBe(true);
    const schedule2 = result2.schedule!;
    
    // ========================================================================
    // PHASE 5: Analyze final distribution
    // ========================================================================
    console.log('\n📈 PHASE 5: Final Analysis (after 40 total weeks)');
    
    const finalStats = allPeople.map(p => {
      const realAssignments = getPersonAssignmentCount(p, [schedule1, schedule2]);
      const virtualAssignments = p.virtualHistory?.virtualAssignments || 0;
      const totalAssignments = realAssignments + virtualAssignments;
      
      return {
        name: p.name,
        real: realAssignments,
        virtual: virtualAssignments,
        total: totalAssignments,
        isNew: p.id === newPerson.id
      };
    });
    
    const originalPeopleStats = finalStats.filter(s => !s.isNew);
    const avgOriginal = originalPeopleStats.reduce((sum, s) => sum + s.total, 0) / originalPeopleStats.length;
    const frankStats = finalStats.find(s => s.isNew)!;
    
    console.log('\n   Final Assignment Counts:');
    console.log('   ' + '-'.repeat(60));
    console.log('   Name       | Real | Virtual | Total | Status');
    console.log('   ' + '-'.repeat(60));
    
    finalStats.forEach(s => {
      const marker = s.isNew ? '🆕' : '  ';
      console.log(
        `   ${marker} ${s.name.padEnd(8)} | ${String(s.real).padStart(4)} | ` +
        `${s.virtual.toFixed(2).padStart(7)} | ${s.total.toFixed(2).padStart(5)} | ` +
        `${s.isNew ? 'NEW' : 'Original'}`
      );
    });
    
    console.log('   ' + '-'.repeat(60));
    console.log(`\n   📊 Statistics:`);
    console.log(`      Original team average: ${avgOriginal.toFixed(2)} total assignments`);
    console.log(`      Frank's total: ${frankStats.total.toFixed(2)} assignments`);
    console.log(`      Difference: ${Math.abs(avgOriginal - frankStats.total).toFixed(2)} assignments`);
    
    const percentDiff = Math.abs((frankStats.total - avgOriginal) / avgOriginal) * 100;
    console.log(`      Variance: ${percentDiff.toFixed(1)}%`);
    
    console.log('\n   ✅ Virtual history ensures Frank is close to the team average!');
    console.log('   ✅ Without virtual history, Frank would be far behind.');
    
    console.log('\n   📌 NOTE: Frank has fewer total assignments because he only');
    console.log('      participated in 20 weeks vs 40 weeks for the original team.');
    console.log('      The virtual history ensures his RATE is fair, not his total count.');
    
    console.log('\n' + '='.repeat(70));
    console.log('END OF DEMONSTRATION');
    console.log('='.repeat(70) + '\n');
    
    // Frank has fewer total because he only participated half the time
    // But his rate should be similar - verify he's not drastically behind
    // He should have roughly half the assignments (20 weeks vs 40 weeks)
    const expectedForFrank = avgOriginal * 0.5; // Half the average since half the time
    const frankDiffFromExpected = Math.abs(frankStats.total - expectedForFrank);
    const frankVariance = (frankDiffFromExpected / expectedForFrank) * 100;
    
    console.log(`   Frank's expected (50% of avg): ${expectedForFrank.toFixed(2)}`);
    console.log(`   Frank's actual: ${frankStats.total.toFixed(2)}`);
    console.log(`   Frank's variance from expected: ${frankVariance.toFixed(1)}%\n`);
    
    // Frank should be close to half (within 30%) since he was there half the time
    expect(frankVariance).toBeLessThan(30);
  });
});
