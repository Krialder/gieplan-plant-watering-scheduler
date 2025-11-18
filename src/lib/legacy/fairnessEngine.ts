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

/**
 * Running state for progressive multi-week generation
 * Tracks accumulated assignments during current generation batch
 */
export interface RunningFairnessState {
  /** Assignments accumulated during current generation batch */
  accumulatedAssignments: Map<string, number>;
  
  /** Number of weeks generated so far in this batch */
  weeksGenerated: number;
  
  /** Historical baseline from existing schedules */
  historicalAssignments: Map<string, number>;
  
  /** Historical days present before generation started */
  historicalDaysPresent: Map<string, number>;
  
  /** Evaluation date (start date of generation) */
  evaluationDate: string;
}

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
 * Sigmoid function for smooth fairness scaling
 * Maps (-∞, +∞) to (0, 1) with smooth transitions
 * @param x - Input value (typically deficit)
 * @returns Value between 0 and 1
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate standard deviation of assignment counts
 * Used to measure fairness distribution quality
 * @param assignments - Map of person ID to assignment count
 * @returns Standard deviation σ
 */
export function calculateStandardDeviation(assignments: Map<string, number>): number {
  const values = Array.from(assignments.values());
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
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
 * Initialize running state for progressive multi-week generation
 * @param people - All people in the system
 * @param schedules - Existing schedules (historical data)
 * @param evaluationDate - Start date of generation
 * @returns Initialized running state
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
  
  // Initialize maps for all people
  for (const person of people) {
    state.accumulatedAssignments.set(person.id, 0);
    state.historicalAssignments.set(person.id, getPersonAssignmentCount(person, schedules));
    state.historicalDaysPresent.set(person.id, calculateTotalDaysPresent(person, evaluationDate));
  }
  
  return state;
}

/**
 * Update running state after a week assignment
 * @param state - Running state to update
 * @param assignedPersonIds - IDs of people assigned this week
 */
export function updateRunningState(
  state: RunningFairnessState,
  assignedPersonIds: string[]
): void {
  // Increment accumulated assignments for selected people
  for (const personId of assignedPersonIds) {
    const current = state.accumulatedAssignments.get(personId) || 0;
    state.accumulatedAssignments.set(personId, current + 1);
  }
  
  // Increment weeks generated
  state.weeksGenerated++;
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
 * Calculate fairness score using running state (for progressive generation)
 * Uses variance minimization with sigmoid scaling
 * 
 * @param person - Person to calculate score for
 * @param state - Current running state
 * @param idealRate - Target assignment rate (total slots / total person-days)
 * @param k - Sigmoid steepness factor (default 20)
 * @returns Fairness score between 0 and 1 (higher = more deserving)
 */
export function calculateFairnessWithState(
  person: Person,
  state: RunningFairnessState,
  idealRate: number,
  k: number = 20
): number {
  const historicalAssignments = state.historicalAssignments.get(person.id) || 0;
  const accumulatedAssignments = state.accumulatedAssignments.get(person.id) || 0;
  const effectiveAssignments = historicalAssignments + accumulatedAssignments;
  
  const historicalDays = state.historicalDaysPresent.get(person.id) || 0;
  const effectiveDays = historicalDays + (state.weeksGenerated * 7);
  
  // Avoid division by zero
  if (effectiveDays === 0) return 0.5;
  
  // Special case: never assigned and active = highest priority
  if (effectiveAssignments === 0 && historicalDays > 0) {
    return 1.0;
  }
  
  // Calculate current rate and deficit from ideal
  const currentRate = effectiveAssignments / effectiveDays;
  const deficit = idealRate - currentRate;
  
  // Apply sigmoid for smooth scaling
  // deficit > 0 (below ideal) → score > 0.5
  // deficit < 0 (above ideal) → score < 0.5
  const score = sigmoid(k * deficit);
  
  return score;
}

/**
 * Calculate comprehensive fairness metrics for a person
 * Score is relative to median assignment rate (assignments per day)
 */
export function calculateFairnessScore(
  person: Person,
  schedules: Schedule[],
  evaluationDate: string = getTodayString(),
  medianRate?: number // Optional: pass pre-calculated median rate for efficiency
): FairnessCalculation {
  const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
  const totalAssignments = getPersonAssignmentCount(person, schedules);
  const assignmentsPerDay = daysPresent > 0 ? totalAssignments / daysPresent : 0;
  
  const experienced = isExperienced(person, schedules, evaluationDate);
  const mentorshipLoad = person.mentorshipAssignments.length;
  
  // Fairness score relative to median rate
  // Below median rate = higher score (more deserving, less worked)
  // Above median rate = lower score (less deserving, already worked more)
  let fairnessScore = 0.5; // Default
  
  if (totalAssignments === 0 && daysPresent > 0) {
    // Never assigned but present - highest priority
    fairnessScore = 1.0;
  } else if (medianRate !== undefined && medianRate > 0 && daysPresent > 0) {
    // Calculate relative difference from median rate
    const diff = medianRate - assignmentsPerDay;
    
    // Scale: normalized difference from median
    // Map to 0-1 range with median at 0.5
    // Scale by median to normalize (someone 0.1 below median of 0.5 is different than 0.1 below median of 0.01)
    fairnessScore = 0.5 + (diff / (medianRate * 2));
    fairnessScore = Math.max(0, Math.min(1, fairnessScore));
  }
  
  console.log(`[FairnessScore] ${person.name}:`, {
    daysPresent,
    totalAssignments,
    assignmentsPerDay: assignmentsPerDay.toFixed(4),
    medianRate: medianRate?.toFixed(4),
    fairnessScore: fairnessScore.toFixed(2),
    arrivalDate: person.arrivalDate,
    evaluationDate
  });
  
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
 * Uses median assignment rate for fairness calculation
 */
export function calculateAllFairnessScores(
  people: Person[],
  schedules: Schedule[],
  activeOnly: boolean = true
): FairnessCalculation[] {
  const targetPeople = activeOnly ? people.filter(p => isPersonActive(p)) : people;
  
  // Calculate median assignment rate (assignments per day)
  const rates = targetPeople
    .map(p => {
      const daysPresent = calculateTotalDaysPresent(p, getTodayString());
      const assignments = getPersonAssignmentCount(p, schedules);
      return daysPresent > 0 ? assignments / daysPresent : 0;
    })
    .filter(rate => rate > 0); // Exclude people with 0 rate for median calculation
  
  const sortedRates = [...rates].sort((a, b) => a - b);
  const medianRate = sortedRates.length > 0 
    ? (sortedRates.length % 2 === 0
        ? (sortedRates[sortedRates.length / 2 - 1] + sortedRates[sortedRates.length / 2]) / 2
        : sortedRates[Math.floor(sortedRates.length / 2)])
    : 0;
  
  console.log(`[FairnessEngine] Median assignment rate: ${medianRate.toFixed(4)} per day`, 
    rates.map(r => r.toFixed(4)));
  
  return targetPeople.map(person => 
    calculateFairnessScore(person, schedules, getTodayString(), medianRate)
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
 * Select teams and substitutes using running state (for progressive generation)
 * Uses variance minimization with ideal rate calculation
 * 
 * @param people - All people in the system
 * @param state - Current running state
 * @param weekStartDate - Start date of week to assign
 * @param excludedIds - People to exclude (e.g., from previous week)
 * @param teamSize - Number of people for team (default 2)
 * @param substituteSize - Number of substitutes (default 2)
 * @returns Object with teamIds, substituteIds, and warnings
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
  
  // Calculate ideal assignment rate
  // Total slots needed so far (including this week) / total person-days
  const totalSlots = (state.weeksGenerated + 1) * teamSize;
  const totalPersonDays = available.reduce((sum, p) => {
    const historicalDays = state.historicalDaysPresent.get(p.id) || 0;
    return sum + historicalDays + (state.weeksGenerated * 7);
  }, 0);
  
  const idealRate = totalPersonDays > 0 ? totalSlots / totalPersonDays : 0;
  
  console.log(`[SelectionWithState] Week ${state.weeksGenerated + 1}, Ideal rate: ${idealRate.toFixed(4)}, Slots: ${totalSlots}, PersonDays: ${totalPersonDays}`);
  
  // Calculate fairness score for each available person
  const withPriority: PersonWithPriority[] = available.map(person => {
    const fairnessScore = calculateFairnessWithState(person, state, idealRate);
    return {
      person,
      priority: fairnessScore,
      experienced: false, // Will be calculated if needed
      mentorshipLoad: person.mentorshipAssignments.length
    };
  });
  
  // Add controlled randomness: add small random jitter to priority
  // This makes selection less deterministic while maintaining fairness
  const withRandomizedPriority = withPriority.map(p => ({
    ...p,
    // Add random value between -0.05 and +0.05 to priority
    // This shuffles people with very similar priorities
    randomizedPriority: p.priority + (Math.random() - 0.5) * 0.1
  }));
  
  // Sort by randomized priority (descending - highest priority first)
  withRandomizedPriority.sort((a, b) => b.randomizedPriority - a.randomizedPriority);
  
  // Log top candidates
  console.log('[SelectionWithState] Top candidates:', 
    withRandomizedPriority.slice(0, teamSize + substituteSize).map(p => ({
      name: p.person.name,
      priority: p.priority.toFixed(3),
      randomized: p.randomizedPriority.toFixed(3)
    }))
  );
  
  // Select top k for team
  const teamMembers = withRandomizedPriority.slice(0, Math.min(teamSize, withRandomizedPriority.length));
  const teamIds = teamMembers.map(m => m.person.id);
  
  // Select next m for substitutes from remaining
  const remaining = withRandomizedPriority.slice(teamMembers.length);
  const substituteMembers = remaining.slice(0, Math.min(substituteSize, remaining.length));
  const substituteIds = substituteMembers.map(m => m.person.id);
  
  // Check if we have enough people
  if (teamIds.length < teamSize) {
    warnings.push(`Only ${teamIds.length} people available for team (need ${teamSize})`);
  }
  if (substituteIds.length < substituteSize) {
    warnings.push(`Only ${substituteIds.length} substitutes available (need ${substituteSize})`);
  }
  
  return { teamIds, substituteIds, warnings };
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
  
  // Calculate median assignment count for fairness score
  const assignmentCounts = available.map(p => getPersonAssignmentCount(p, schedules));
  const sortedCounts = [...assignmentCounts].sort((a, b) => a - b);
  const medianAssignments = sortedCounts.length > 0 
    ? (sortedCounts.length % 2 === 0
        ? (sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2
        : sortedCounts[Math.floor(sortedCounts.length / 2)])
    : 0;
  
  // Calculate priority for each available person using median-based fairness
  const withPriority: PersonWithPriority[] = available.map(person => {
    const fairness = calculateFairnessScore(person, schedules, weekStartDate, medianAssignments);
    return {
      person,
      priority: fairness.fairnessScore, // Use median-relative fairness score as priority
      experienced: isExperienced(person, schedules, weekStartDate),
      mentorshipLoad: person.mentorshipAssignments.length
    };
  });
  
  // Add controlled randomness: add small random jitter to priority
  // This makes selection less deterministic while maintaining fairness
  const withRandomizedPriority = withPriority.map(p => ({
    ...p,
    // Add random value between -0.05 and +0.05 to priority
    // This shuffles people with very similar priorities
    randomizedPriority: p.priority + (Math.random() - 0.5) * 0.1
  }));
  
  // Sort by randomized priority (descending - highest priority first)
  withRandomizedPriority.sort((a, b) => b.randomizedPriority - a.randomizedPriority);
  
  // Select top k for team
  const teamMembers = withRandomizedPriority.slice(0, Math.min(teamSize, withRandomizedPriority.length));
  const teamIds = teamMembers.map(m => m.person.id);
  
  // Select next m for substitutes from remaining
  const remaining = withRandomizedPriority.slice(teamMembers.length);
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
