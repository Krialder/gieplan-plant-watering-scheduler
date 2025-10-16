import type { Person, FairnessCalculation, Schedule, WeekAssignment } from '@/types';
import { getDaysBetween, isDateInRange, getTodayString, parseDate } from './dateUtils';

export function calculateTotalDaysPresent(person: Person, evaluationDate: string = getTodayString()): number {
  let totalDays = 0;
  
  for (const period of person.programPeriods) {
    const endDate = period.endDate || evaluationDate;
    const days = getDaysBetween(period.startDate, endDate);
    totalDays += days;
  }
  
  return totalDays;
}

export function isPersonActive(person: Person, date: string = getTodayString()): boolean {
  if (person.actualDepartureDate && parseDate(person.actualDepartureDate) < parseDate(date)) {
    return false;
  }
  
  const hasActivePeriod = person.programPeriods.some(period => 
    isDateInRange(date, period.startDate, period.endDate)
  );
  
  return hasActivePeriod;
}

export function getPersonAssignmentCount(person: Person, schedules: Schedule[], startDate?: string, endDate?: string): number {
  let count = 0;
  
  for (const schedule of schedules) {
    for (const assignment of schedule.assignments) {
      if (startDate && parseDate(assignment.weekStartDate) < parseDate(startDate)) continue;
      if (endDate && parseDate(assignment.weekStartDate) > parseDate(endDate)) continue;
      
      if (assignment.assignedPeople.includes(person.id)) {
        count++;
      }
    }
  }
  
  return count;
}

export function isExperienced(person: Person, schedules: Schedule[]): boolean {
  const daysPresent = calculateTotalDaysPresent(person);
  const assignmentCount = getPersonAssignmentCount(person, schedules);
  
  return daysPresent >= 90 || assignmentCount >= 4;
}

export function calculateFairnessScore(
  person: Person,
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): FairnessCalculation {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  const totalAssignments = getPersonAssignmentCount(person, schedules);
  const assignmentsPerDay = daysPresent > 0 ? totalAssignments / daysPresent : 0;
  
  const experienced = isExperienced(person, schedules);
  const mentorshipLoad = person.mentorshipAssignments.length;
  
  const fairnessScore = 1.0 - (person.fairnessMetrics.crossYearFairnessDebt * 0.3);
  
  return {
    personId: person.id,
    personName: person.name,
    daysPresent,
    totalAssignments,
    assignmentsPerDay,
    fairnessScore,
    experienceLevel: experienced ? 'experienced' : 'new',
    canBeMentor: experienced,
    mentorshipLoad
  };
}

export function calculateAllFairnessScores(
  people: Person[],
  schedules: Schedule[],
  activeOnly: boolean = true
): FairnessCalculation[] {
  const activePeople = activeOnly ? people.filter(p => isPersonActive(p)) : people;
  
  const calculations = activePeople.map(person => 
    calculateFairnessScore(person, schedules)
  );
  
  if (calculations.length === 0) return [];
  
  const avgAssignmentsPerDay = calculations.reduce((sum, calc) => sum + calc.assignmentsPerDay, 0) / calculations.length;
  
  return calculations.map(calc => ({
    ...calc,
    fairnessScore: avgAssignmentsPerDay > 0 
      ? (calc.assignmentsPerDay / avgAssignmentsPerDay) 
      : 1.0
  }));
}

export function suggestNextAssignments(
  people: Person[],
  schedules: Schedule[],
  weekStartDate: string,
  lastAssignment: WeekAssignment | null
): string[] {
  const fairnessCalculations = calculateAllFairnessScores(people, schedules);
  
  const excludedIds = lastAssignment ? lastAssignment.assignedPeople : [];
  
  const eligible = fairnessCalculations.filter(calc => 
    !excludedIds.includes(calc.personId)
  );
  
  eligible.sort((a, b) => {
    const fairnessDiff = a.fairnessScore - b.fairnessScore;
    if (Math.abs(fairnessDiff) > 0.05) return fairnessDiff;
    
    return a.assignmentsPerDay - b.assignmentsPerDay;
  });
  
  if (eligible.length === 0) return [];
  if (eligible.length === 1) return [eligible[0].personId];
  
  const mentors = eligible.filter(calc => calc.canBeMentor);
  const newPeople = eligible.filter(calc => !calc.canBeMentor);
  
  if (newPeople.length > 0 && mentors.length > 0) {
    mentors.sort((a, b) => a.mentorshipLoad - b.mentorshipLoad);
    
    return [mentors[0].personId, eligible[1]?.personId || eligible[0].personId].filter(Boolean);
  }
  
  return [eligible[0].personId, eligible[1]?.personId].filter(Boolean);
}

export function validateScheduleConstraints(assignments: WeekAssignment[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < assignments.length - 1; i++) {
    const current = assignments[i];
    const next = assignments[i + 1];
    
    const overlap = current.assignedPeople.filter(id => next.assignedPeople.includes(id));
    if (overlap.length > 0) {
      errors.push(`Consecutive week assignment detected for weeks ${current.weekNumber} and ${next.weekNumber}`);
    }
  }
  
  const newPersonOnlyWeeks = assignments.filter(a => !a.hasMentor);
  if (newPersonOnlyWeeks.length > 0) {
    errors.push(`${newPersonOnlyWeeks.length} week(s) have no experienced mentor`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
