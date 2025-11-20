/**
 * Debug test to see exactly when Neu gets assigned
 */

import { describe, it } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';
import { createPerson } from '@/lib/personManager';
import type { Person } from '@/types';

describe('Debug New Person Assignment Pattern', () => {
  it('should show week-by-week assignments for new person', () => {
    // Create initial people
    const people: Person[] = [
      createPerson('Hans', '2025-01-01'),
      createPerson('Moin', '2025-01-01'),
      createPerson('Zimmer', '2025-01-01'),
      createPerson('Hugs', '2025-01-01'),
      createPerson('Getting', '2025-01-01'),
      createPerson('Kompono', '2025-01-01'),
      createPerson('Helloween', '2025-01-01'),
      createPerson('Jay', '2025-01-01'),
      createPerson('Create', '2025-01-01'),
      createPerson('Wen', '2025-01-01')
    ];

    // Generate 25 weeks (similar to user's scenario)
    const result1 = generateSchedule({
      startDate: '2025-11-24',
      weeks: 25,
      people,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: false
    });

    console.log('\n=== AFTER 25 WEEKS ===');
    const schedules = result1.schedule ? [result1.schedule] : [];
    
    // Now add "Neu"
    const neu = createPerson('Neu', '2026-05-18', null, people, schedules);
    console.log(`\nNeu created - no virtual history (equal distribution model)`);
    
    const allPeople = [...people, neu];

    // Generate next 15 weeks
    const result2 = generateSchedule({
      startDate: '2026-05-18',
      weeks: 15,
      people: allPeople,
      existingSchedules: schedules,
      enforceNoConsecutive: true,
      requireMentor: false
    });

    if (result2.schedule) {
      console.log('\n=== NEW PERSON ASSIGNMENTS (next 15 weeks) ===');
      let neuCount = 0;
      for (const assignment of result2.schedule.assignments) {
        const hasNeu = assignment.assignedPeople.some(id => {
          const person = allPeople.find(p => p.id === id);
          return person?.name === 'Neu';
        });
        
        const names = assignment.assignedPeople.map(id => {
          const person = allPeople.find(p => p.id === id);
          return person?.name;
        }).join(' + ');
        
        if (hasNeu) {
          neuCount++;
          console.log(`KW ${assignment.weekNumber}: ${names} ⭐`);
        } else {
          console.log(`KW ${assignment.weekNumber}: ${names}`);
        }
      }
      
      console.log(`\nNeu appeared in ${neuCount} out of 15 weeks (${(neuCount/15*100).toFixed(1)}%)`);
      console.log(`Expected for fair distribution: ~${(15*2/11).toFixed(1)} weeks (${(2/11*100).toFixed(1)}%)`);
    }
  });
});
