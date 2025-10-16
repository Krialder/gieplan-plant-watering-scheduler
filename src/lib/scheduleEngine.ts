import type { Person, Schedule, WeekAssignment } from '@/types';
import { formatDate, addWeeks, getMonday, parseDate } from './dateUtils';
import { suggestNextAssignments, isPersonActive, isExperienced, validateScheduleConstraints } from './fairnessEngine';
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

export function generateSchedule(options: ScheduleGenerationOptions): ScheduleGenerationResult {
  const { startDate, weeks, people, existingSchedules, enforceNoConsecutive, requireMentor } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const activePeople = people.filter(p => isPersonActive(p, startDate));
  
  if (activePeople.length === 0) {
    return {
      success: false,
      errors: ['No active people available for schedule generation'],
      warnings
    };
  }
  
  if (activePeople.length === 1) {
    warnings.push('Only one person available - they will be assigned every week');
  }
  
  const experiencedCount = activePeople.filter(p => isExperienced(p, existingSchedules)).length;
  if (experiencedCount === 0 && requireMentor) {
    warnings.push('No experienced mentors available - proceeding with emergency override');
  }
  
  const monday = getMonday(parseDate(startDate));
  const assignments: WeekAssignment[] = [];
  let lastAssignment: WeekAssignment | null = null;
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = addWeeks(monday, i);
    const weekStartString = formatDate(weekStart);
    
    const suggested = suggestNextAssignments(
      activePeople,
      existingSchedules,
      weekStartString,
      lastAssignment
    );
    
    if (suggested.length === 0) {
      errors.push(`Failed to generate assignment for week ${i + 1}`);
      continue;
    }
    
    const assignedPeople = suggested.slice(0, 2);
    const hasMentor = assignedPeople.some(id => {
      const person = people.find(p => p.id === id);
      return person && isExperienced(person, existingSchedules);
    });
    
    const assignment: WeekAssignment = {
      weekNumber: i + 1,
      weekStartDate: weekStartString,
      assignedPeople,
      fairnessScores: assignedPeople.map(id => {
        const person = people.find(p => p.id === id);
        return person?.fairnessMetrics.temporalFairnessScore || 1.0;
      }),
      hasMentor
    };
    
    assignments.push(assignment);
    lastAssignment = assignment;
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings
    };
  }
  
  const validation = validateScheduleConstraints(assignments);
  if (!validation.valid && enforceNoConsecutive) {
    return {
      success: false,
      errors: validation.errors,
      warnings
    };
  }
  
  if (!validation.valid) {
    warnings.push(...validation.errors);
  }
  
  const schedule: Schedule = {
    id: uuidv4(),
    startDate: formatDate(monday),
    weeks,
    assignments,
    createdAt: new Date().toISOString()
  };
  
  return {
    success: true,
    schedule,
    errors: [],
    warnings
  };
}

export function getScheduleForWeek(schedules: Schedule[], weekStartDate: string): WeekAssignment | null {
  for (const schedule of schedules) {
    const assignment = schedule.assignments.find(a => a.weekStartDate === weekStartDate);
    if (assignment) return assignment;
  }
  return null;
}

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

export function deleteSchedule(schedules: Schedule[], scheduleId: string): Schedule[] {
  return schedules.filter(s => s.id !== scheduleId);
}
