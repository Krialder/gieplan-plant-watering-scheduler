/**
 * fairnessEngine.ts - Fairness Engine Compatibility Layer
 * 
 * This module provides a compatibility layer that maintains the API surface
 * while delegating to the new dynamic fairness system (in /fairness folder).
 * 
 * Utility functions that are used across the system remain here.
 */

import type { Person, FairnessCalculation, Schedule, WeekAssignment } from '@/types';
import { getDaysBetween, isDateInRange, getTodayString, parseDate, formatDate } from './dateUtils';

// Constants
const EPSILON = 1;
const EXPERIENCE_DAYS_THRESHOLD = 90;
const EXPERIENCE_ASSIGNMENTS_THRESHOLD = 4;

/**
 * Running state for progressive multi-week generation
 * Maintained for backward compatibility
 */
export interface RunningFairnessState {
  accumulatedAssignments: Map<string, number>;
  weeksGenerated: number;
  historicalAssignments: Map<string, number>;
  historicalDaysPresent: Map<string, number>;
  evaluationDate: string;
}

// ============================================================================
// UTILITY FUNCTIONS (used across the system)
// These remain here as they're not specific to fairness algorithm
// ============================================================================

/**
 * Calculate tenure for a person (time since join date in days)
 */
export function calculateTenure(person: Person, evaluationDate: string = getTodayString()): number {
  return getDaysBetween(person.arrivalDate, evaluationDate);
}

/**
 * Calculate total days a person has been present across all program periods
 */
export function calculateTotalDaysPresent(person: Person, evaluationDate: string = getTodayString()): number {
  let totalDays = 0;
  const evalDate = parseDate(evaluationDate);
  
  for (const period of person.programPeriods) {
    const startDate = parseDate(period.startDate);
    
    // Skip periods that haven't started yet
    if (startDate > evalDate) {
      continue;
    }
    
    const endDate = period.endDate ? parseDate(period.endDate) : evalDate;
    const effectiveEndDate = endDate < evalDate ? endDate : evalDate;
    
    const days = getDaysBetween(period.startDate, formatDate(effectiveEndDate));
    totalDays += Math.max(0, days);
  }
  
  return totalDays;
}

/**
 * Check if a person is currently active in the program
 */
export function isPersonActive(person: Person, date: string = getTodayString()): boolean {
  if (person.actualDepartureDate && parseDate(person.actualDepartureDate) < parseDate(date)) {
    return false;
  }
  
  const hasActivePeriod = person.programPeriods.some(period => 
    isDateInRange(date, period.startDate, period.endDate)
  );
  
  return hasActivePeriod;
}

/**
 * Calculate standard deviation of assignment counts
 */
export function calculateStandardDeviation(assignments: Map<string, number>): number {
  const values = Array.from(assignments.values());
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Count total assignments for a person across all schedules
 */
export function getPersonAssignmentCount(
  person: Person, 
  schedules: Schedule[], 
  startDate?: string, 
  endDate?: string
): number {
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

/**
 * Determine if a person is experienced
 */
export function isExperienced(person: Person, schedules: Schedule[], evaluationDate: string = getTodayString()): boolean {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  const assignments = getPersonAssignmentCount(person, schedules);
  
  return daysPresent >= EXPERIENCE_DAYS_THRESHOLD || assignments >= EXPERIENCE_ASSIGNMENTS_THRESHOLD;
}

/**
 * Sigmoid function for smooth fairness scaling
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ============================================================================
// RUNNING STATE FUNCTIONS
// ============================================================================

/**
 * Initialize running state for progressive multi-week generation
 */
export function initializeRunningState(
  people: Person[],
  schedules: Schedule[],
  evaluationDate: string
): RunningFairnessState {
  const state: RunningFairnessState = {
    accumulatedAssignments: new Map(),
    weeksGenerated: 0,
    historicalAssignments: new Map(),
    historicalDaysPresent: new Map(),
    evaluationDate
  };
  
  for (const person of people) {
    state.accumulatedAssignments.set(person.id, 0);
    // Real assignments only
    const assignments = getPersonAssignmentCount(person, schedules);
    state.historicalAssignments.set(person.id, assignments);
    state.historicalDaysPresent.set(person.id, calculateTotalDaysPresent(person, evaluationDate));
  }
  
  return state;
}

/**
 * Update running state after a week assignment
 */
export function updateRunningState(
  state: RunningFairnessState,
  assignedPersonIds: string[]
): void {
  for (const personId of assignedPersonIds) {
    const current = state.accumulatedAssignments.get(personId) || 0;
    state.accumulatedAssignments.set(personId, current + 1);
  }
  
  state.weeksGenerated++;
}

// ============================================================================
// LEGACY FAIRNESS CALCULATION FUNCTIONS
// These are maintained for backward compatibility with existing tests
// ============================================================================

/**
 * Calculate total system selections across all schedules
 */
function getTotalSystemSelections(schedules: Schedule[]): number {
  let total = 0;
  for (const schedule of schedules) {
    for (const assignment of schedule.assignments) {
      total += assignment.assignedPeople.length;
    }
  }
  return total;
}

/**
 * Calculate expected selection count for a person
 */
function calculateExpectedSelections(
  person: Person,
  allPeople: Person[],
  schedules: Schedule[],
  evaluationDate: string
): number {
  const tenure = calculateTenure(person, evaluationDate);
  const totalTenure = allPeople.reduce((sum, p) => sum + calculateTenure(p, evaluationDate), 0);
  const totalSystemSelections = getTotalSystemSelections(schedules);
  
  if (totalTenure === 0) return 0;
  
  return (tenure / totalTenure) * totalSystemSelections;
}

/**
 * Calculate deficit (how far behind/ahead from expected selections)
 */
function calculateDeficit(
  person: Person,
  allPeople: Person[],
  schedules: Schedule[],
  evaluationDate: string
): number {
  const expected = calculateExpectedSelections(person, allPeople, schedules, evaluationDate);
  const actual = getPersonAssignmentCount(person, schedules);
  
  return expected - actual;
}

/**
 * Calculate selection priority score
 */
export function calculatePriority(
  person: Person,
  allPeople: Person[],
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): number {
  const totalSystemSelections = getTotalSystemSelections(schedules);
  
  if (totalSystemSelections === 0) {
    const tenure = calculateTenure(person, evaluationDate);
    const totalTenure = allPeople.reduce((sum, p) => sum + calculateTenure(p, evaluationDate), 0);
    return totalTenure > 0 ? tenure / totalTenure : 1.0;
  }
  
  const deficit = calculateDeficit(person, allPeople, schedules, evaluationDate);
  const tenure = calculateTenure(person, evaluationDate);
  
  return deficit / (tenure + EPSILON);
}

/**
 * Calculate fairness score using running state
 */
export function calculateFairnessWithState(
  person: Person,
  state: RunningFairnessState,
  idealRate: number,
  teamSize?: number
): number {
  const historicalAssignments = state.historicalAssignments.get(person.id) || 0;
  const accumulatedAssignments = state.accumulatedAssignments.get(person.id) || 0;
  const effectiveAssignments = historicalAssignments + accumulatedAssignments;
  
  const historicalDays = state.historicalDaysPresent.get(person.id) || 0;
  const effectiveDays = historicalDays + (state.weeksGenerated * 7);
  
  if (effectiveDays === 0) return 0.5;
  
  if (effectiveAssignments === 0 && historicalDays > 0) {
    return 1.0;
  }
  
  const currentRate = effectiveAssignments / effectiveDays;
  const deficit = idealRate - currentRate;
  
  // Adaptive k-parameter depending on team size
  // Larger teams → smaller k (gentler sigmoid) for more stable selection
  // Smaller teams → larger k (steeper sigmoid) for more decisive selection
  const k = teamSize !== undefined ? Math.max(10, 20 - (teamSize / 10)) : 20;
  
  const score = sigmoid(k * deficit);
  
  return score;
}

/**
 * Calculate comprehensive fairness metrics for a person
 */
export function calculateFairnessScore(
  person: Person,
  schedules: Schedule[],
  evaluationDate: string = getTodayString(),
  medianRate?: number
): FairnessCalculation {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  // Real assignments only
  const assignments = getPersonAssignmentCount(person, schedules);
  const assignmentsPerDay = daysPresent > 0 ? assignments / daysPresent : 0;
  
  const experienced = isExperienced(person, schedules, evaluationDate);
  const mentorshipLoad = person.mentorshipAssignments.length;
  
  let fairnessScore = 0.5; // Default = average fairness
  
  // Calculate fairness score based on deviation from median rate
  if (medianRate !== undefined && medianRate > 0 && daysPresent > 0) {
    // How far are they from the median rate?
    const diff = medianRate - assignmentsPerDay;
    // Scale: if diff = medianRate, score = 1.0 (max need)
    //        if diff = 0, score = 0.5 (perfectly average)
    //        if diff = -medianRate, score = 0.0 (has too many)
    fairnessScore = 0.5 + (diff / (medianRate * 2));
    fairnessScore = Math.max(0, Math.min(1, fairnessScore));
  } else if (assignments === 0 && daysPresent > 0) {
    // New person with 0 assignments when no median exists yet
    // They're at the same state as everyone else (all have 0)
    fairnessScore = 0.5;
  }
  
  return {
    personId: person.id,
    personName: person.name,
    daysPresent,
    totalAssignments: assignments,
    assignmentsPerDay,
    fairnessScore,
    experienceLevel: experienced ? 'experienced' : 'new',
    canBeMentor: experienced,
    mentorshipLoad
  };
}

/**
 * Calculate fairness scores for all people
 */
export function calculateAllFairnessScores(
  people: Person[],
  schedules: Schedule[],
  activeOnly: boolean = true
): FairnessCalculation[] {
  const targetPeople = activeOnly ? people.filter(p => isPersonActive(p)) : people;
  
  const rates = targetPeople
    .map(p => {
      const daysPresent = calculateTotalDaysPresent(p, getTodayString());
      const assignments = getPersonAssignmentCount(p, schedules);
      return daysPresent > 0 ? assignments / daysPresent : 0;
    })
    .filter(rate => rate > 0);
  
  const sortedRates = [...rates].sort((a, b) => a - b);
  const medianRate = sortedRates.length > 0 
    ? (sortedRates.length % 2 === 0
        ? (sortedRates[sortedRates.length / 2 - 1] + sortedRates[sortedRates.length / 2]) / 2
        : sortedRates[Math.floor(sortedRates.length / 2)])
    : 0;
  
  return targetPeople.map(person => 
    calculateFairnessScore(person, schedules, getTodayString(), medianRate)
  );
}

// ============================================================================
// TEAM SELECTION FUNCTIONS
// ============================================================================

interface PersonWithPriority {
  person: Person;
  priority: number;
  experienced: boolean;
  mentorshipLoad: number;
}

/**
 * Select teams and substitutes using running state
 */
export function selectTeamsAndSubstitutesWithState(
  people: Person[],
  state: RunningFairnessState,
  weekStartDate: string,
  excludedIds: string[] = [],
  teamSize: number = 2,
  substituteSize: number = 2
): { teamIds: string[]; substituteIds: string[]; warnings: string[] } {
  const warnings: string[] = [];
  
  const available = people.filter(p => 
    isPersonActive(p, weekStartDate) && !excludedIds.includes(p.id)
  );
  
  if (available.length === 0) {
    const totalActive = people.filter(p => isPersonActive(p, weekStartDate)).length;
    return { 
      teamIds: [], 
      substituteIds: [], 
      warnings: [`Keine verfügbaren Personen (${totalActive} aktiv, ${excludedIds.length} ausgeschlossen)`] 
    };
  }
  
  const totalSlots = (state.weeksGenerated + 1) * teamSize;
  const totalPersonDays = available.reduce((sum, p) => {
    const historicalDays = state.historicalDaysPresent.get(p.id) || 0;
    return sum + historicalDays + (state.weeksGenerated * 7);
  }, 0);
  
  const idealRate = totalPersonDays > 0 ? totalSlots / totalPersonDays : 0;
  
  const withPriority: PersonWithPriority[] = available.map(person => {
    const fairnessScore = calculateFairnessWithState(person, state, idealRate, available.length);
    return {
      person,
      priority: fairnessScore,
      experienced: false,
      mentorshipLoad: person.mentorshipAssignments.length
    };
  });
  
  const withRandomizedPriority = withPriority.map(p => ({
    ...p,
    randomizedPriority: p.priority + (Math.random() - 0.5) * 0.1
  }));
  
  withRandomizedPriority.sort((a, b) => b.randomizedPriority - a.randomizedPriority);
  
  const teamMembers = withRandomizedPriority.slice(0, Math.min(teamSize, withRandomizedPriority.length));
  const teamIds = teamMembers.map(m => m.person.id);
  
  const remaining = withRandomizedPriority.slice(teamMembers.length);
  const substituteMembers = remaining.slice(0, Math.min(substituteSize, remaining.length));
  const substituteIds = substituteMembers.map(m => m.person.id);
  
  if (teamIds.length < teamSize) {
    warnings.push(`Only ${teamIds.length} people available for team (need ${teamSize})`);
  }
  if (substituteIds.length < substituteSize) {
    warnings.push(`Only ${substituteIds.length} substitutes available (need ${substituteSize})`);
  }
  
  return { teamIds, substituteIds, warnings };
}

/**
 * Select teams and substitutes
 */
export function selectTeamsAndSubstitutes(
  people: Person[],
  schedules: Schedule[],
  weekStartDate: string,
  excludedIds: string[] = [],
  teamSize: number = 2,
  substituteSize: number = 2
): { teamIds: string[]; substituteIds: string[]; warnings: string[] } {
  const warnings: string[] = [];
  
  const available = people.filter(p => 
    isPersonActive(p, weekStartDate) && !excludedIds.includes(p.id)
  );
  
  if (available.length === 0) {
    const totalActive = people.filter(p => isPersonActive(p, weekStartDate)).length;
    return { 
      teamIds: [], 
      substituteIds: [], 
      warnings: [`Keine verfügbaren Personen (${totalActive} aktiv, ${excludedIds.length} ausgeschlossen)`] 
    };
  }
  
  const assignmentCounts = available.map(p => {
    return getPersonAssignmentCount(p, schedules);
  });
  const sortedCounts = [...assignmentCounts].sort((a, b) => a - b);
  const medianAssignments = sortedCounts.length > 0 
    ? (sortedCounts.length % 2 === 0
        ? (sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2
        : sortedCounts[Math.floor(sortedCounts.length / 2)])
    : 0;
  
  const withPriority: PersonWithPriority[] = available.map(person => {
    const fairness = calculateFairnessScore(person, schedules, weekStartDate, medianAssignments);
    return {
      person,
      priority: fairness.fairnessScore,
      experienced: isExperienced(person, schedules, weekStartDate),
      mentorshipLoad: person.mentorshipAssignments.length
    };
  });
  
  const withRandomizedPriority = withPriority.map(p => ({
    ...p,
    randomizedPriority: p.priority + (Math.random() - 0.5) * 0.1
  }));
  
  withRandomizedPriority.sort((a, b) => b.randomizedPriority - a.randomizedPriority);
  
  const teamMembers = withRandomizedPriority.slice(0, Math.min(teamSize, withRandomizedPriority.length));
  const teamIds = teamMembers.map(m => m.person.id);
  
  const remaining = withRandomizedPriority.slice(teamMembers.length);
  const substituteMembers = remaining.slice(0, Math.min(substituteSize, remaining.length));
  const substituteIds = substituteMembers.map(m => m.person.id);
  
  if (teamIds.length < teamSize) {
    warnings.push(`Only ${teamIds.length} people available for team (need ${teamSize})`);
  }
  if (substituteIds.length < substituteSize) {
    warnings.push(`Only ${substituteIds.length} substitutes available (need ${substituteSize})`);
  }
  
  const hasExperienced = teamMembers.some(m => m.experienced);
  if (!hasExperienced && teamIds.length > 0) {
    warnings.push('No experienced mentor available in team');
  }
  
  return { teamIds, substituteIds, warnings };
}

/**
 * Pair team members with experience mixing
 */
export function pairWithExperienceMixing(
  teamIds: string[],
  people: Person[],
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): string[][] {
  if (teamIds.length !== 2) {
    return [teamIds];
  }
  
  const person1 = people.find(p => p.id === teamIds[0]);
  const person2 = people.find(p => p.id === teamIds[1]);
  
  if (!person1 || !person2) return [teamIds];
  
  return [[person1.id, person2.id]];
}

/**
 * Suggest optimal next assignments
 */
export function suggestNextAssignments(
  people: Person[],
  schedules: Schedule[],
  weekStartDate: string,
  lastAssignment: WeekAssignment | null
): string[] {
  const excludedIds = lastAssignment ? lastAssignment.assignedPeople : [];
  
  const result = selectTeamsAndSubstitutes(
    people,
    schedules,
    weekStartDate,
    excludedIds,
    2,
    0
  );
  
  return result.teamIds;
}

/**
 * Fill gap after person deletion
 */
export function fillGapAfterDeletion(
  deletedPersonId: string,
  currentAssignments: string[],
  people: Person[],
  schedules: Schedule[],
  weekStartDate: string
): string | null {
  const assigned = currentAssignments.filter(id => id !== deletedPersonId);
  
  const unassigned = people.filter(p => 
    p.id !== deletedPersonId &&
    isPersonActive(p, weekStartDate) && 
    !assigned.includes(p.id)
  );
  
  if (unassigned.length === 0) return null;
  
  const withPriority = unassigned.map(person => ({
    person,
    priority: calculatePriority(person, people, schedules, weekStartDate)
  }));
  
  withPriority.sort((a, b) => b.priority - a.priority);
  
  return withPriority[0].person.id;
}

/**
 * Validate schedule constraints
 */
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
  
  return {
    valid: errors.length === 0,
    errors
  };
}
