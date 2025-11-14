/**
 * scheduleEngine.ts - Schedule Generation and Management Engine
 * 
 * This module handles the generation of fair watering schedules using sophisticated algorithms.
 * Functions:
 * - Generate multi-week schedules based on fairness calculations
 * - Ensure mentor-mentee pairing when experienced people are available
 * - Prevent consecutive week assignments for better work-life balance
 * - Handle emergency scenarios with insufficient people or mentors
 * - Validate generated schedules against business constraints
 * - Support manual assignment updates and schedule modifications
 * - Provide week-specific assignment lookup functionality
 * - Edit individual weeks (replace people, update assignments)
 * - Add comments and emergency flags to specific weeks
 * - Swap people globally across all schedules
 * - Get person-specific statistics and reports
 */

import type { Person, Schedule, WeekAssignment } from '@/types';
import { formatDate, addWeeks, getMonday, parseDate, formatDateGerman, getWeekNumber } from './dateUtils';
import { 
  selectTeamsAndSubstitutes,
  selectTeamsAndSubstitutesWithState,
  isPersonActive, 
  isExperienced, 
  validateScheduleConstraints,
  calculatePriority,
  fillGapAfterDeletion,
  initializeRunningState,
  updateRunningState,
  calculateStandardDeviation,
  type RunningFairnessState
} from './fairnessEngine';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleGenerationOptions {
  startDate: string;
  weeks: number;
  people: Person[];
  existingSchedules: Schedule[];
  enforceNoConsecutive: boolean;
  requireMentor: boolean;
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedule?: Schedule;
  errors: string[];
  warnings: string[];
}

// Generate a complete schedule based on fairness algorithms and constraints
export function generateSchedule(options: ScheduleGenerationOptions): ScheduleGenerationResult {
  const { startDate, weeks, people, existingSchedules, enforceNoConsecutive, requireMentor } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate input parameters
  if (!startDate || startDate.trim() === '') {
    return {
      success: false,
      errors: ['Bitte geben Sie ein Startdatum ein'],
      warnings
    };
  }
  
  if (weeks < 1 || weeks > 52) {
    return {
      success: false,
      errors: ['Anzahl der Wochen muss zwischen 1 und 52 liegen'],
      warnings
    };
  }
  
  // Validate date format
  const parsedDate = parseDate(startDate);
  if (isNaN(parsedDate.getTime())) {
    return {
      success: false,
      errors: ['Ungültiges Datumsformat. Bitte verwenden Sie das Format YYYY-MM-DD'],
      warnings
    };
  }
  
  // Start from Monday of the start week for consistency
  const monday = getMonday(parsedDate);
  const mondayString = formatDate(monday);
  
  // Instead of blocking, we'll skip weeks that already exist and only generate missing ones
  const weeksToGenerate: { weekStart: Date; weekNumber: number; isGap: boolean }[] = [];
  const skippedWeeks: string[] = [];
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = addWeeks(monday, i);
    const weekStartString = formatDate(weekStart);
    
    // Check if this week already exists in any schedule with a complete team
    let weekExists = false;
    let weekIsIncomplete = false;
    for (const existingSchedule of existingSchedules) {
      const existingAssignment = existingSchedule.assignments.find(a => a.weekStartDate === weekStartString);
      if (existingAssignment) {
        // Week exists, but check if it has a complete team (2 people)
        if (existingAssignment.assignedPeople.length >= 2) {
          weekExists = true;
          const weekDate = parseDate(weekStartString);
          const weekNum = getWeekNumber(weekDate);
          const year = weekDate.getFullYear();
          skippedWeeks.push(`KW ${weekNum} (${year})`);
          break;
        } else {
          // Week exists but is incomplete (only 1 person) - mark for regeneration
          weekIsIncomplete = true;
        }
      }
    }
    
    if (!weekExists || weekIsIncomplete) {
      weeksToGenerate.push({
        weekStart,
        weekNumber: i + 1,
        isGap: skippedWeeks.length > 0 // This is a gap if we skipped some weeks
      });
      
      // Add info about incomplete weeks being regenerated
      if (weekIsIncomplete) {
        const weekDate = parseDate(weekStartString);
        const weekNum = getWeekNumber(weekDate);
        const year = weekDate.getFullYear();
        warnings.push(`KW ${weekNum} (${year}) wird neu generiert (unvollständiges Team)`);
      }
    }
  }
  
  // If no weeks to generate, return error
  if (weeksToGenerate.length === 0) {
    return {
      success: false,
      errors: [
        'Alle angeforderten Kalenderwochen sind bereits geplant.'
      ],
      warnings: [
        `Übersprungen: ${skippedWeeks.join(', ')}`
      ]
    };
  }
  
  // Show info about skipped weeks
  if (skippedWeeks.length > 0) {
    warnings.push(`Übersprungene Wochen (bereits geplant): ${skippedWeeks.join(', ')}`);
    warnings.push(`Generiere ${weeksToGenerate.length} fehlende Woche(n)`);
  }
  
  // Filter to only active people at the start date
  const activePeople = people.filter(p => isPersonActive(p, startDate));
  
  // Validate we have people to assign
  if (activePeople.length === 0) {
    return {
      success: false,
      errors: ['Keine aktiven Personen für das gewählte Startdatum verfügbar. Bitte fügen Sie Personen hinzu oder wählen Sie ein anderes Datum.'],
      warnings
    };
  }
  
  // Warn if only one person available
  if (activePeople.length === 1) {
    warnings.push('Only one person available - they will be assigned every week');
  }
  
  // Check mentor availability
  const experiencedCount = activePeople.filter(p => isExperienced(p, existingSchedules, mondayString)).length;
  if (experiencedCount === 0 && requireMentor) {
    warnings.push('No experienced mentors available - proceeding with emergency override');
  }
  
  // Start from Monday of the start week for consistency
  const assignments: WeekAssignment[] = [];
  let lastAssignment: WeekAssignment | null = null;
  let lastSubstitutes: string[] = [];
  
  // Initialize running state for progressive fairness calculation
  const runningState = initializeRunningState(activePeople, existingSchedules, mondayString);
  
  // Remove incomplete assignments from existing schedules that will be regenerated
  for (const weekInfo of weeksToGenerate) {
    const weekStartString = formatDate(weekInfo.weekStart);
    for (const existingSchedule of existingSchedules) {
      const assignmentIndex = existingSchedule.assignments.findIndex(a => a.weekStartDate === weekStartString);
      if (assignmentIndex !== -1) {
        const assignment = existingSchedule.assignments[assignmentIndex];
        if (assignment.assignedPeople.length < 2) {
          // Remove incomplete assignment - it will be regenerated
          existingSchedule.assignments.splice(assignmentIndex, 1);
          console.log(`[ScheduleGeneration] Removed incomplete assignment for week ${weekStartString}`);
        }
      }
    }
  }

  console.log('[ScheduleGeneration] Starting with running state:', {
    people: activePeople.length,
    historicalAssignments: Array.from(runningState.historicalAssignments.entries()).map(([id, count]) => ({
      person: activePeople.find(p => p.id === id)?.name,
      count
    })),
    weeksToGenerate: weeksToGenerate.length
  });
  
  // Generate assignments for each week that needs to be filled
  for (const weekInfo of weeksToGenerate) {
    const weekStart = weekInfo.weekStart;
    const weekStartString = formatDate(weekStart);
    
    // Get excluded IDs from last week based on number of available people
    // With 10+ people: exclude both assigned pair AND substitutes (4 people total)
    // With <10 people: only exclude the assigned pair (2 people) for more flexibility
    let excludedIds: string[] = [];
    if (enforceNoConsecutive && lastAssignment) {
      if (activePeople.length >= 10 && lastSubstitutes.length > 0) {
        // 10+ people: exclude both assigned and substitutes (4 people)
        excludedIds = [...lastAssignment.assignedPeople, ...lastSubstitutes];
      } else {
        // <10 people: only exclude the assigned pair (2 people)
        excludedIds = lastAssignment.assignedPeople;
      }
    }
    
    // Use mathematical algorithm with running state for progressive fairness
    const selection = selectTeamsAndSubstitutesWithState(
      activePeople,
      runningState,
      weekStartString,
      excludedIds,
      2, // team size = 2
      2  // substitute size = 2
    );
    
    if (selection.warnings.length > 0) {
      const weekDate = parseDate(weekStartString);
      const weekNum = getWeekNumber(weekDate);
      warnings.push(...selection.warnings.map(w => `KW ${weekNum}: ${w}`));
    }
    
    if (selection.teamIds.length === 0) {
      const weekDate = parseDate(weekStartString);
      const weekNum = getWeekNumber(weekDate);
      errors.push(`KW ${weekNum} konnte nicht generiert werden: Keine verfügbaren Personen (${activePeople.length} aktiv, ${excludedIds.length} ausgeschlossen)`);
      continue;
    }
    
    // If we only got 1 person but have more than 1 active person, try without exclusions
    if (selection.teamIds.length === 1 && activePeople.length > 1) {
      const weekDate = parseDate(weekStartString);
      const weekNum = getWeekNumber(weekDate);
      
      // Try again without excluding previous week's assignments
      const retrySelection = selectTeamsAndSubstitutesWithState(
        activePeople,
        runningState,
        weekStartString,
        [], // No exclusions for retry
        2, // team size = 2
        2  // substitute size = 2
      );
      
      if (retrySelection.teamIds.length >= 2) {
        // Success with retry - use this selection
        console.log(`[ScheduleGeneration] KW ${weekNum}: Retry without exclusions successful`);
        warnings.push(`KW ${weekNum}: Aufeinanderfolgenden-Regel ignoriert um vollständiges Team zu bilden`);
        selection.teamIds = retrySelection.teamIds;
        selection.substituteIds = retrySelection.substituteIds;
      } else {
        // Still only 1 person available - this means truly only 1 person active this week
        console.log(`[ScheduleGeneration] KW ${weekNum}: Only 1 person available even without exclusions`);
        warnings.push(`KW ${weekNum}: Nur 1 Person verfügbar (${selection.teamIds.length})`);
      }
    }
    
    // Use the team IDs as the assigned people
    const assignedPeople = selection.teamIds;
    
    // Store substitutes for next iteration's exclusion
    lastSubstitutes = selection.substituteIds;
    
    // Update running state with this week's assignments
    updateRunningState(runningState, assignedPeople);
    
    // Check if any assigned person is a mentor (using existing schedules + running state)
    const hasMentor = assignedPeople.some(id => {
      const person = people.find(p => p.id === id);
      return person && isExperienced(person, existingSchedules, weekStartString);
    });
    
    // Calculate priority scores at time of assignment for record keeping
    const priorityScores = assignedPeople.map(id => {
      const person = people.find(p => p.id === id);
      return person ? calculatePriority(person, activePeople, existingSchedules, weekStartString) : 0;
    });
    
    // Create week assignment object
    const assignment: WeekAssignment = {
      weekNumber: weekInfo.weekNumber,
      weekStartDate: weekStartString,
      assignedPeople,
      substitutes: selection.substituteIds,
      fairnessScores: priorityScores,
      hasMentor
    };
    
    assignments.push(assignment);
    lastAssignment = assignment;
  }
  
  // Return error if we couldn't generate any assignments
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings
    };
  }
  
  // Validate the generated schedule against constraints
  const validation = validateScheduleConstraints(assignments);
  if (!validation.valid && enforceNoConsecutive) {
    return {
      success: false,
      errors: validation.errors,
      warnings
    };
  }
  
  // Add validation issues as warnings if not enforcing strict constraints
  if (!validation.valid) {
    warnings.push(...validation.errors);
  }
  
  // Create the final schedule object
  const schedule: Schedule = {
    id: uuidv4(),
    startDate: formatDate(monday),
    weeks: weeksToGenerate.length, // Only count generated weeks
    assignments,
    createdAt: new Date().toISOString()
  };
  
  // Calculate and log final distribution statistics
  const finalAssignments = new Map<string, number>();
  for (const person of activePeople) {
    const historical = runningState.historicalAssignments.get(person.id) || 0;
    const accumulated = runningState.accumulatedAssignments.get(person.id) || 0;
    finalAssignments.set(person.id, historical + accumulated);
  }
  
  const stdDev = calculateStandardDeviation(finalAssignments);
  const assignmentCounts = Array.from(finalAssignments.entries()).map(([id, count]) => ({
    name: activePeople.find(p => p.id === id)?.name || id,
    count,
    historical: runningState.historicalAssignments.get(id) || 0,
    accumulated: runningState.accumulatedAssignments.get(id) || 0
  }));
  
  console.log('[ScheduleGeneration] ✅ Generation result:', {
    weeksGenerated: weeksToGenerate.length,
    standardDeviation: stdDev.toFixed(3),
    distribution: assignmentCounts.sort((a, b) => a.count - b.count)
  });
  
  return {
    success: true,
    schedule,
    errors: [],
    warnings
  };
}

// Find assignment for a specific week across all schedules
export function getScheduleForWeek(schedules: Schedule[], weekStartDate: string): WeekAssignment | null {
  for (const schedule of schedules) {
    const assignment = schedule.assignments.find(a => a.weekStartDate === weekStartDate);
    if (assignment) return assignment;
  }
  return null;
}

// Update a specific assignment within a schedule
export function updateAssignment(
  schedule: Schedule,
  weekNumber: number,
  newAssignedPeople: string[]
): Schedule {
  return {
    ...schedule,
    assignments: schedule.assignments.map(assignment =>
      assignment.weekNumber === weekNumber
        ? { ...assignment, assignedPeople: newAssignedPeople }
        : assignment
    )
  };
}

// Remove a schedule from the collection
export function deleteSchedule(schedules: Schedule[], scheduleId: string): Schedule[] {
  return schedules.filter(s => s.id !== scheduleId);
}

export function handlePersonDeletion(
  schedules: Schedule[],
  deletedPersonId: string,
  people: Person[]
): Schedule[] {
  // Process schedules one at a time, updating the schedules array as we go
  // This ensures fairness calculations include previous replacements
  let updatedSchedules = [...schedules];
  
  updatedSchedules = updatedSchedules.map((schedule, scheduleIndex) => {
    const updatedAssignments = schedule.assignments.map(assignment => {
      // Check if this assignment includes the deleted person
      if (!assignment.assignedPeople.includes(deletedPersonId)) {
        return assignment; // No change needed
      }
      
      // Fill the gap with highest priority unassigned person
      // Use updatedSchedules to include replacements made in earlier schedules
      const replacementId = fillGapAfterDeletion(
        deletedPersonId,
        assignment.assignedPeople,
        people,
        updatedSchedules,
        assignment.weekStartDate
      );
      
      if (!replacementId) {
        // No replacement available - remove the person but keep the assignment
        return {
          ...assignment,
          assignedPeople: assignment.assignedPeople.filter(id => id !== deletedPersonId)
        };
      }
      
      // Replace the deleted person with the highest priority person
      const newAssignments = {
        ...assignment,
        assignedPeople: assignment.assignedPeople.map(id => 
          id === deletedPersonId ? replacementId : id
        )
      };
      
      // Update the schedule in updatedSchedules immediately so next assignment sees this change
      updatedSchedules[scheduleIndex] = {
        ...updatedSchedules[scheduleIndex],
        assignments: updatedSchedules[scheduleIndex].assignments.map(a =>
          a.weekStartDate === assignment.weekStartDate ? newAssignments : a
        )
      };
      
      return newAssignments;
    });
    
    return {
      ...schedule,
      assignments: updatedAssignments
    };
  });
  
  return updatedSchedules;
}

// Replace a person in a specific week assignment
export function replacePersonInWeek(
  schedules: Schedule[],
  weekStartDate: string,
  oldPersonId: string,
  newPersonId: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      // Replace the person if they're in this week's assignment
      if (assignment.assignedPeople.includes(oldPersonId)) {
        return {
          ...assignment,
          assignedPeople: assignment.assignedPeople.map(id => 
            id === oldPersonId ? newPersonId : id
          )
        };
      }
      
      return assignment;
    })
  }));
}

// Update a single week's assignment completely
export function updateWeekAssignment(
  schedules: Schedule[],
  weekStartDate: string,
  newAssignedPeople: string[],
  newSubstitutes?: string[]
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      return {
        ...assignment,
        assignedPeople: newAssignedPeople,
        ...(newSubstitutes && { substitutes: newSubstitutes })
      };
    })
  }));
}

// Add a comment/note to a specific week assignment
export function addWeekComment(
  schedules: Schedule[],
  weekStartDate: string,
  comment: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      return {
        ...assignment,
        comment
      };
    })
  }));
}

// Remove comment from a specific week
export function removeWeekComment(
  schedules: Schedule[],
  weekStartDate: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      const { comment, ...assignmentWithoutComment } = assignment as any;
      return assignmentWithoutComment;
    })
  }));
}

// Mark a week as emergency override (manual intervention needed)
export function markWeekAsEmergency(
  schedules: Schedule[],
  weekStartDate: string,
  emergencyReason?: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      return {
        ...assignment,
        isEmergency: true,
        emergencyReason
      };
    })
  }));
}

// Remove emergency flag from a week
export function clearEmergencyFlag(
  schedules: Schedule[],
  weekStartDate: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      if (assignment.weekStartDate !== weekStartDate) {
        return assignment;
      }
      
      const { isEmergency, emergencyReason, ...assignmentWithoutEmergency } = assignment as any;
      return assignmentWithoutEmergency;
    })
  }));
}

// Get all weeks with emergency flags
export function getEmergencyWeeks(schedules: Schedule[]): WeekAssignment[] {
  const emergencyWeeks: WeekAssignment[] = [];
  
  schedules.forEach(schedule => {
    schedule.assignments.forEach(assignment => {
      if ((assignment as any).isEmergency) {
        emergencyWeeks.push(assignment);
      }
    });
  });
  
  return emergencyWeeks;
}

// Swap two people across all schedules
export function swapPeopleGlobally(
  schedules: Schedule[],
  personId1: string,
  personId2: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => ({
      ...assignment,
      assignedPeople: assignment.assignedPeople.map(id => {
        if (id === personId1) return personId2;
        if (id === personId2) return personId1;
        return id;
      }),
      substitutes: assignment.substitutes?.map(id => {
        if (id === personId1) return personId2;
        if (id === personId2) return personId1;
        return id;
      })
    }))
  }));
}

// Swap two people in a specific timeframe
export function swapPeopleInTimeframe(
  schedules: Schedule[],
  personId1: string,
  personId2: string,
  startDate?: string,
  endDate?: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      // Check if assignment is within timeframe
      const assignmentDate = new Date(assignment.weekStartDate);
      const isInTimeframe = 
        (!startDate || assignmentDate >= new Date(startDate)) &&
        (!endDate || assignmentDate <= new Date(endDate));
      
      if (!isInTimeframe) {
        return assignment;
      }
      
      return {
        ...assignment,
        assignedPeople: assignment.assignedPeople.map(id => {
          if (id === personId1) return personId2;
          if (id === personId2) return personId1;
          return id;
        }),
        substitutes: assignment.substitutes?.map(id => {
          if (id === personId1) return personId2;
          if (id === personId2) return personId1;
          return id;
        })
      };
    })
  }));
}

// Remove a person from all assignments in a timeframe
export function removePersonFromTimeframe(
  schedules: Schedule[],
  personId: string,
  startDate?: string,
  endDate?: string
): Schedule[] {
  return schedules.map(schedule => ({
    ...schedule,
    assignments: schedule.assignments.map(assignment => {
      // Check if assignment is within timeframe
      const assignmentDate = new Date(assignment.weekStartDate);
      const isInTimeframe = 
        (!startDate || assignmentDate >= new Date(startDate)) &&
        (!endDate || assignmentDate <= new Date(endDate));
      
      if (!isInTimeframe) {
        return assignment;
      }
      
      return {
        ...assignment,
        assignedPeople: assignment.assignedPeople.filter(id => id !== personId),
        substitutes: assignment.substitutes?.filter(id => id !== personId)
      };
    })
  }));
}

// Get statistics for a specific person across all schedules
export function getPersonStatistics(
  schedules: Schedule[],
  personId: string
): {
  totalAssignments: number;
  asMainAssignment: number;
  asSubstitute: number;
  weeks: string[];
} {
  let totalAssignments = 0;
  let asMainAssignment = 0;
  let asSubstitute = 0;
  const weeks: string[] = [];
  
  schedules.forEach(schedule => {
    schedule.assignments.forEach(assignment => {
      if (assignment.assignedPeople.includes(personId)) {
        totalAssignments++;
        asMainAssignment++;
        weeks.push(assignment.weekStartDate);
      } else if (assignment.substitutes?.includes(personId)) {
        totalAssignments++;
        asSubstitute++;
        weeks.push(assignment.weekStartDate);
      }
    });
  });
  
  return {
    totalAssignments,
    asMainAssignment,
    asSubstitute,
    weeks
  };
}
