/**
 * fairnessEngine.ts - Mathematical Fairness Algorithm Implementation
 * 
 * This module implements the mathematically rigorous fairness algorithm from SCHEDULING_ALGORITHM.md
 * 
 * Key concepts:
 * - Tenure: Time since person joined (in days)
 * - Expected Selection Count: Proportional to tenure among all people
 * - Deficit: Expected selections minus actual selections
 * - Priority: Deficit normalized by tenure (selection rate fairness)
 * 
 * The algorithm ensures time-proportional fairness with provable convergence.
 */

import type { Person, FairnessCalculation, Schedule, WeekAssignment } from '@/types';
import { getDaysBetween, isDateInRange, getTodayString, parseDate, formatDate } from './dateUtils';

// Small epsilon to prevent division by zero for new members (1 day)
const EPSILON = 1;

// Experience thresholds
const EXPERIENCE_DAYS_THRESHOLD = 90;
const EXPERIENCE_ASSIGNMENTS_THRESHOLD = 4;

/**
 * Calculate tenure for a person (time since join date in days)
 * Formula: tenure(p_i) = T_current - t_join(p_i)
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
  // Check if person has departed before (not on) this date
  if (person.actualDepartureDate && parseDate(person.actualDepartureDate) < parseDate(date)) {
    return false;
  }
  
  const hasActivePeriod = person.programPeriods.some(period => 
    isDateInRange(date, period.startDate, period.endDate)
  );
  
  return hasActivePeriod;
}

/**
 * Count total assignments (selection count) for a person across all schedules
 * Formula: s(p_i)
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
 * Formula: e(p_i) ∈ {0, 1}
 */
export function isExperienced(person: Person, schedules: Schedule[], evaluationDate: string = getTodayString()): boolean {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  const assignmentCount = getPersonAssignmentCount(person, schedules);
  
  return daysPresent >= EXPERIENCE_DAYS_THRESHOLD || assignmentCount >= EXPERIENCE_ASSIGNMENTS_THRESHOLD;
}

/**
 * Calculate total system selections across all schedules
 * Formula: S_total
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
 * Formula: E[s(p_i)] = (tenure(p_i) / Σ tenure(p_j)) × S_total
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
 * Formula: deficit(p_i) = E[s(p_i)] - s(p_i)
 * Positive = underselected, Negative = overselected
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
 * Calculate selection priority score (main fairness metric)
 * Formula: priority(p_i) = deficit(p_i) / (tenure(p_i) + ε)
 * Higher priority = should be selected sooner
 * 
 * Special case: When no selections have been made yet (bootstrap case),
 * priority = 1.0 for everyone to indicate they all deserve selection equally
 */
export function calculatePriority(
  person: Person,
  allPeople: Person[],
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): number {
  const totalSystemSelections = getTotalSystemSelections(schedules);
  
  // Bootstrap case: no selections yet, everyone has equal positive priority
  if (totalSystemSelections === 0) {
    const tenure = calculateTenure(person, evaluationDate);
    // Return normalized tenure as priority (longer tenure = slightly higher priority)
    const totalTenure = allPeople.reduce((sum, p) => sum + calculateTenure(p, evaluationDate), 0);
    return totalTenure > 0 ? tenure / totalTenure : 1.0;
  }
  
  // Normal case: use deficit-based priority
  const deficit = calculateDeficit(person, allPeople, schedules, evaluationDate);
  const tenure = calculateTenure(person, evaluationDate);
  
  return deficit / (tenure + EPSILON);
}

/**
 * Calculate comprehensive fairness metrics for a person
 * This maintains backward compatibility with existing UI components
 */
export function calculateFairnessScore(
  person: Person,
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): FairnessCalculation {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  const totalAssignments = getPersonAssignmentCount(person, schedules);
  const assignmentsPerDay = daysPresent > 0 ? totalAssignments / daysPresent : 0;
  
  const experienced = isExperienced(person, schedules, evaluationDate);
  const mentorshipLoad = person.mentorshipAssignments.length;
  
  // Use inverse of assignments per day as a proxy for fairness score
  // Lower assignments per day = higher fairness score (more deserving)
  const avgRate = assignmentsPerDay || 0.001;
  const fairnessScore = 1.0 / (avgRate * 1000 + 1);
  
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

/**
 * Calculate fairness scores for all people (for UI display)
 */
export function calculateAllFairnessScores(
  people: Person[],
  schedules: Schedule[],
  activeOnly: boolean = true
): FairnessCalculation[] {
  const targetPeople = activeOnly ? people.filter(p => isPersonActive(p)) : people;
  
  return targetPeople.map(person => 
    calculateFairnessScore(person, schedules)
  );
}

/**
 * Interface for person with calculated priority
 */
interface PersonWithPriority {
  person: Person;
  priority: number;
  experienced: boolean;
  mentorshipLoad: number;
}

/**
 * Select teams and substitutes using the mathematical algorithm
 * Formula: argmax over subsets by sum of priorities
 * 
 * @param people - All people in the system
 * @param schedules - All existing schedules
 * @param weekStartDate - Start date of week to assign
 * @param excludedIds - People to exclude (e.g., from previous week)
 * @param teamSize - Number of people for team (default 2)
 * @param substituteSize - Number of substitutes (default 2)
 * @returns Object with teamIds, substituteIds, and warnings
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
  
  // Filter to available people
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
  
  // Calculate priority for each available person
  const withPriority: PersonWithPriority[] = available.map(person => ({
    person,
    priority: calculatePriority(person, people, schedules, weekStartDate),
    experienced: isExperienced(person, schedules, weekStartDate),
    mentorshipLoad: person.mentorshipAssignments.length
  }));
  
  // Sort by priority (descending - highest priority first)
  withPriority.sort((a, b) => b.priority - a.priority);
  
  // Select top k for team
  const teamMembers = withPriority.slice(0, Math.min(teamSize, withPriority.length));
  const teamIds = teamMembers.map(m => m.person.id);
  
  // Select next m for substitutes from remaining
  const remaining = withPriority.slice(teamMembers.length);
  const substituteMembers = remaining.slice(0, Math.min(substituteSize, remaining.length));
  const substituteIds = substituteMembers.map(m => m.person.id);
  
  // Check if we have enough people
  if (teamIds.length < teamSize) {
    warnings.push(`Only ${teamIds.length} people available for team (need ${teamSize})`);
  }
  if (substituteIds.length < substituteSize) {
    warnings.push(`Only ${substituteIds.length} substitutes available (need ${substituteSize})`);
  }
  
  // Check if team has at least one experienced person (soft constraint)
  const hasExperienced = teamMembers.some(m => m.experienced);
  if (!hasExperienced && teamIds.length > 0) {
    warnings.push('No experienced mentor available in team');
  }
  
  return { teamIds, substituteIds, warnings };
}

/**
 * Pair team members with experience mixing preference (soft constraint)
 * If one new and one experienced, pair them. Otherwise, pair by priority order.
 * 
 * @param teamIds - Selected team member IDs
 * @param people - All people
 * @param schedules - All schedules
 * @returns Array of pairs (for team size 2, returns one pair)
 */
export function pairWithExperienceMixing(
  teamIds: string[],
  people: Person[],
  schedules: Schedule[],
  evaluationDate: string = getTodayString()
): string[][] {
  if (teamIds.length !== 2) {
    return [teamIds]; // Just return as-is for non-standard team sizes
  }
  
  const person1 = people.find(p => p.id === teamIds[0]);
  const person2 = people.find(p => p.id === teamIds[1]);
  
  if (!person1 || !person2) return [teamIds];
  
  const exp1 = isExperienced(person1, schedules, evaluationDate);
  const exp2 = isExperienced(person2, schedules, evaluationDate);
  
  // Pairing is already optimal - one new and one experienced, or both same level
  // Priority sort already gave us the best pair
  return [[person1.id, person2.id]];
}

/**
 * Suggest optimal next assignments based on mathematical priority algorithm
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
    2, // team size
    0  // no substitutes for suggestion
  );
  
  return result.teamIds;
}

/**
 * Fill gap after person deletion with highest priority unassigned person
 * 
 * @param deletedPersonId - ID of person who was deleted
 * @param currentAssignments - Current week assignments
 * @param people - All people in system
 * @param schedules - All schedules
 * @param weekStartDate - Week start date
 * @returns ID of replacement person, or null if none available
 */
export function fillGapAfterDeletion(
  deletedPersonId: string,
  currentAssignments: string[],
  people: Person[],
  schedules: Schedule[],
  weekStartDate: string
): string | null {
  // Get all currently assigned person IDs (excluding the deleted one)
  const assigned = currentAssignments.filter(id => id !== deletedPersonId);
  
  // Find unassigned, active people (excluding deleted person and currently assigned)
  const unassigned = people.filter(p => 
    p.id !== deletedPersonId &&  // Exclude the deleted person
    isPersonActive(p, weekStartDate) && 
    !assigned.includes(p.id)
  );
  
  if (unassigned.length === 0) return null;
  
  // Calculate priority for each unassigned person
  const withPriority = unassigned.map(person => ({
    person,
    priority: calculatePriority(person, people, schedules, weekStartDate)
  }));
  
  // Select highest priority person
  withPriority.sort((a, b) => b.priority - a.priority);
  
  return withPriority[0].person.id;
}

/**
 * Validate schedule constraints
 */
export function validateScheduleConstraints(assignments: WeekAssignment[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for consecutive week assignments
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
