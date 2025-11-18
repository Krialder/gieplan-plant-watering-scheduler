/**
 * Dynamic Fairness Engine Adapter for Existing System
 * 
 * This adapter integrates the new dynamic fairness system with the existing
 * fairnessEngine.ts, allowing gradual migration and feature flags.
 */

import type { Person, Schedule, WeekAssignment } from '@/types';
import { 
  calculateTenure, 
  calculateTotalDaysPresent, 
  isPersonActive,
  getPersonAssignmentCount 
} from './fairnessEngine';
import { getDaysBetween } from './dateUtils';
import { 
  DynamicFairnessEngine,
  createFairnessEngine,
  calculatePenalizedPriority,
  type FairnessConstraints,
  DEFAULT_CONSTRAINTS
} from '../../fairness';

/**
 * Feature flags for gradual rollout
 */
export interface FairnessFeatureFlags {
  usePenalizedPriority: boolean;
  useBayesianUpdates: boolean;
  useConstraintChecking: boolean;
  useSoftmaxSelection: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FairnessFeatureFlags = {
  usePenalizedPriority: true,
  useBayesianUpdates: true,
  useConstraintChecking: true,
  useSoftmaxSelection: false  // Keep false for now for gradual rollout
};

/**
 * Adaptive Fairness Manager
 * 
 * Combines existing fairness logic with new dynamic fairness system
 */
export class AdaptiveFairnessManager {
  private engine: DynamicFairnessEngine;
  private flags: FairnessFeatureFlags;
  private initialized: boolean = false;
  private people: Person[];
  private schedules: Schedule[];
  private evaluationDate: string;
  private historicalAssignments: Map<string, number>;
  private accumulatedAssignments: Map<string, number>;
  private firstSchedulingDate: Map<string, string>; // Track when person first became eligible for scheduling
  
  constructor(
    people: Person[],
    schedules: Schedule[],
    evaluationDate: string,
    flags: FairnessFeatureFlags = DEFAULT_FEATURE_FLAGS,
    constraints: FairnessConstraints = DEFAULT_CONSTRAINTS
  ) {
    this.engine = createFairnessEngine(constraints);
    this.flags = flags;
    this.people = people;
    this.schedules = schedules;
    this.evaluationDate = evaluationDate;
    
    // Initialize historical assignments and first scheduling dates
    this.historicalAssignments = new Map();
    this.accumulatedAssignments = new Map();
    this.firstSchedulingDate = new Map();
    
    // Find earliest schedule date as reference
    let earliestScheduleDate = evaluationDate;
    for (const schedule of schedules) {
      if (schedule.startDate < earliestScheduleDate) {
        earliestScheduleDate = schedule.startDate;
      }
    }
    
    for (const person of people) {
      const count = getPersonAssignmentCount(person, schedules);
      this.historicalAssignments.set(person.id, count);
      this.accumulatedAssignments.set(person.id, 0);
      
      // First scheduling date logic:
      // 1. If person has assignments: use date of their earliest assignment
      // 2. If no assignments but schedules exist: use earliest schedule date or join date (whichever is later)
      // 3. If no schedules: use join date
      
      if (count > 0) {
        // Person has assignments - find their earliest assignment date
        let personEarliestAssignment = evaluationDate;
        for (const schedule of schedules) {
          for (const assignment of schedule.assignments) {
            if (assignment.assignedPeople.includes(person.id) || 
                assignment.substitutes?.includes(person.id)) {
              if (assignment.weekStartDate < personEarliestAssignment) {
                personEarliestAssignment = assignment.weekStartDate;
              }
            }
          }
        }
        // They were available from when they were first assigned (or their join date if earlier)
        const joinDate = person.arrivalDate;
        this.firstSchedulingDate.set(person.id, 
          personEarliestAssignment < joinDate ? joinDate : personEarliestAssignment
        );
      } else {
        // No assignments - use earliest schedule or join date
        const joinDate = person.arrivalDate;
        const firstAvailable = joinDate > earliestScheduleDate ? joinDate : earliestScheduleDate;
        this.firstSchedulingDate.set(person.id, firstAvailable);
      }
    }
    
    // Initialize Bayesian states (using Bayesian Random Walks)
    if (this.flags.useBayesianUpdates) {
      // Calculate average rate of people who have been scheduled
      const existingRates = people
        .map(p => {
          const days = this.calculateSchedulingDays(p.id, evaluationDate);
          const assigns = getPersonAssignmentCount(p, schedules);
          return days > 0 ? assigns / days : 0;
        })
        .filter(rate => rate > 0);
      
      const averageRate = existingRates.length > 0
        ? existingRates.reduce((sum, r) => sum + r, 0) / existingRates.length
        : 0;
      
      for (const person of people) {
        const schedulingDays = this.calculateSchedulingDays(person.id, evaluationDate);
        const assignments = getPersonAssignmentCount(person, schedules);
        
        // New people with no history start at average rate (fair starting point)
        const initialRate = assignments === 0 && schedulingDays === 0
          ? averageRate
          : (schedulingDays > 0 ? assignments / schedulingDays : averageRate);
        
        this.engine.initializePerson(person.id, initialRate, evaluationDate);
      }
      this.initialized = true;
    }
  }
  
  /**
   * Calculate "scheduling days" - days since person first became eligible for scheduling
   * This counts from the first generation run where they could have been selected,
   * NOT from when they were actually selected
   */
  private calculateSchedulingDays(
    personId: string,
    evaluationDate: string
  ): number {
    const firstDate = this.firstSchedulingDate.get(personId);
    if (!firstDate) return 0;
    
    const person = this.people.find(p => p.id === personId);
    if (!person) return 0;
    
    // Calculate days between first scheduling opportunity and evaluation date
    // Only count days when person was actually present (in program periods)
    const daysBetween = getDaysBetween(firstDate, evaluationDate);
    
    // Verify person was actually present during this time
    // (they could have left and returned)
    const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
    const daysBeforeScheduling = calculateTotalDaysPresent(person, firstDate);
    const daysPresentDuringScheduling = daysPresent - daysBeforeScheduling;
    
    // Use the minimum of calendar days and actual present days
    return Math.min(Math.max(0, daysBetween), Math.max(0, daysPresentDuringScheduling));
  }
  
  /**
   * Mark person as becoming available for scheduling (called during generation)
   */
  markPersonAvailableForScheduling(personId: string, date: string): void {
    if (!this.firstSchedulingDate.has(personId)) {
      this.firstSchedulingDate.set(personId, date);
    }
  }
  
  /**
   * Recalculate first scheduling dates after schedule deletion
   * This ensures scheduling days remain accurate when schedules are removed
   */
  recalculateFirstSchedulingDates(schedules: Schedule[]): void {
    // Find new earliest schedule date
    let earliestScheduleDate = this.evaluationDate;
    for (const schedule of schedules) {
      if (schedule.startDate < earliestScheduleDate) {
        earliestScheduleDate = schedule.startDate;
      }
    }
    
    // Recalculate for each person
    for (const person of this.people) {
      const assignments = getPersonAssignmentCount(person, schedules);
      
      if (assignments === 0) {
        // Person has no assignments in remaining schedules
        // Reset to either earliest schedule date or their join date
        const joinDate = person.arrivalDate;
        const firstAvailable = joinDate > earliestScheduleDate ? joinDate : earliestScheduleDate;
        this.firstSchedulingDate.set(person.id, firstAvailable);
      } else {
        // Person has assignments - find their earliest assignment date
        let personEarliestDate = this.evaluationDate;
        for (const schedule of schedules) {
          for (const assignment of schedule.assignments) {
            if (assignment.assignedPeople.includes(person.id) || 
                assignment.substitutes?.includes(person.id)) {
              if (assignment.weekStartDate < personEarliestDate) {
                personEarliestDate = assignment.weekStartDate;
              }
            }
          }
        }
        
        // Use the earlier of: their first assignment or their join date
        const joinDate = person.arrivalDate;
        const firstDate = personEarliestDate < joinDate ? joinDate : personEarliestDate;
        this.firstSchedulingDate.set(person.id, firstDate);
      }
    }
    
    // Update historical assignments
    for (const person of this.people) {
      const count = getPersonAssignmentCount(person, schedules);
      this.historicalAssignments.set(person.id, count);
    }
  }
  
  /**
   * Initialize Bayesian states for all people
   */
  initializeFromPeople(
    people: Person[],
    schedules: Schedule[],
    evaluationDate: string
  ): void {
    if (!this.flags.useBayesianUpdates) return;
    
    for (const person of people) {
      const daysPresent = calculateTotalDaysPresent(person, evaluationDate);
      const assignments = getPersonAssignmentCount(person, schedules);
      const initialRate = daysPresent > 0 ? assignments / daysPresent : 0;
      
      this.engine.initializePerson(person.id, initialRate, evaluationDate);
    }
    
    this.initialized = true;
  }
  
  /**
   * Get current state for debugging
   */
  getState(): {
    historicalAssignments: Map<string, number>;
    accumulatedAssignments: Map<string, number>;
  } {
    return {
      historicalAssignments: this.historicalAssignments,
      accumulatedAssignments: this.accumulatedAssignments
    };
  }
  
  /**
   * Update state after assignments
   */
  updateState(assignedIds: string[]): void {
    for (const id of assignedIds) {
      const current = this.accumulatedAssignments.get(id) || 0;
      this.accumulatedAssignments.set(id, current + 1);
    }
  }
  
  /**
   * Calculate priority for a person
   */
  calculatePriority(personId: string, weekStartDate: string): number {
    const person = this.people.find(p => p.id === personId);
    if (!person) return 0;
    
    return this.calculateEnhancedPriority(person, this.people, this.schedules, weekStartDate);
  }
  
  /**
   * Select teams and substitutes
   */
  selectTeamsAndSubstitutes(
    weekStartDate: string,
    excludedIds: string[],
    teamSize: number,
    substituteSize: number
  ): {
    teamIds: string[];
    substituteIds: string[];
    warnings: string[];
  } {
    const available = this.people.filter(p => 
      isPersonActive(p, weekStartDate) && !excludedIds.includes(p.id)
    );
    
    if (available.length === 0) {
      return {
        teamIds: [],
        substituteIds: [],
        warnings: ['No people available for assignment']
      };
    }
    
    // Calculate priorities for all available people
    const priorities = available.map(p => ({
      id: p.id,
      name: p.name,
      priority: this.calculateEnhancedPriority(p, this.people, this.schedules, weekStartDate)
    }));
    
    // Sort by priority descending (deterministic - highest need goes first)
    priorities.sort((a, b) => {
      const diff = b.priority - a.priority;
      // Only use randomization for EXACT ties (same priority to 6 decimal places)
      if (Math.abs(diff) < 0.000001) {
        return Math.random() - 0.5; // Tie-breaker only
      }
      return diff;
    });
    
    // Select top priority people for team (deterministic)
    const teamIds = priorities
      .slice(0, Math.min(teamSize, priorities.length))
      .map(p => p.id);
    
    // Select substitutes from remaining (also deterministic by priority)
    const substituteIds = priorities
      .slice(teamSize, Math.min(teamSize + substituteSize, priorities.length))
      .map(p => p.id);
    
    return {
      teamIds,
      substituteIds,
      warnings: []
    };
  }
  
  /**
   * Calculate enhanced priority using Penalized Regression if enabled
   * Uses scheduling days (relative to first opportunity) not absolute tenure
   * CRITICAL: Uses accumulated assignments from current generation run
   */
  calculateEnhancedPriority(
    person: Person,
    allPeople: Person[],
    schedules: Schedule[],
    evaluationDate: string
  ): number {
    const schedulingDays = this.calculateSchedulingDays(person.id, evaluationDate);
    const historicalAssignments = getPersonAssignmentCount(person, schedules);
    const accumulatedAssignments = this.accumulatedAssignments.get(person.id) || 0;
    const totalAssignments = historicalAssignments + accumulatedAssignments;
    
    // Calculate expected assignments (Fairness-over-time Framework)
    // Proportional to scheduling days, not absolute tenure
    // IMPORTANT: Include accumulated assignments from all people in current generation
    const totalSchedulingDays = allPeople.reduce((sum, p) => 
      sum + this.calculateSchedulingDays(p.id, evaluationDate), 0);
    const allHistoricalAssignments = allPeople.reduce((sum, p) => 
      sum + getPersonAssignmentCount(p, schedules), 0);
    const allAccumulatedAssignments = allPeople.reduce((sum, p) => 
      sum + (this.accumulatedAssignments.get(p.id) || 0), 0);
    const systemTotalAssignments = allHistoricalAssignments + allAccumulatedAssignments;
    
    const expected = totalSchedulingDays > 0 
      ? (schedulingDays / totalSchedulingDays) * systemTotalAssignments 
      : 0;
    
    const deficit = expected - totalAssignments;
    
    // Special handling for people with very few scheduling days (< 14 days = 2 weeks)
    // They should converge to system rate, not historical average
    if (schedulingDays < 14 && schedulingDays > 0) {
      // Calculate system rate (assignments per day across all people)
      const systemRate = totalSchedulingDays > 0 
        ? systemTotalAssignments / totalSchedulingDays 
        : 0;
      
      // New person's target: match the system rate
      const targetAssignments = schedulingDays * systemRate;
      const adjustedDeficit = targetAssignments - totalAssignments;
      
      // Use adjusted deficit for priority
      if (this.flags.usePenalizedPriority) {
        const result = calculatePenalizedPriority(adjustedDeficit, schedulingDays);
        return result.finalPriority;
      }
      
      return adjustedDeficit / (schedulingDays + 1);
    }
    
    // Use Penalized Regression for priority calculation
    if (this.flags.usePenalizedPriority) {
      const result = calculatePenalizedPriority(deficit, schedulingDays);
      return result.finalPriority;
    }
    
    // Fallback to simple priority (Random Variable Theory)
    return deficit / (schedulingDays + 1);
  }
  
  /**
   * Update Bayesian state after assignment decision
   */
  updateAfterAssignment(
    personId: string,
    assigned: boolean,
    daysElapsed: number,
    idealRate: number
  ): void {
    if (!this.flags.useBayesianUpdates || !this.initialized) return;
    
    try {
      this.engine.updateAfterAssignment(personId, assigned, daysElapsed, idealRate);
    } catch (error) {
      console.warn(`Failed to update Bayesian state for ${personId}:`, error);
    }
  }
  
  /**
   * Check fairness constraints and get warnings
   */
  checkFairness(
    people: Person[],
    schedules: Schedule[],
    evaluationDate: string
  ): { warnings: string[]; metrics: any } {
    if (!this.flags.useConstraintChecking) {
      return { warnings: [], metrics: null };
    }
    
    const activePeople = people.filter(p => isPersonActive(p, evaluationDate));
    
    const rates: number[] = [];
    const deficits: number[] = [];
    const schedulingDays: number[] = [];
    const personIds: string[] = [];
    
    for (const person of activePeople) {
      const days = this.calculateSchedulingDays(person.id, evaluationDate);
      const assignments = getPersonAssignmentCount(person, schedules);
      const rate = days > 0 ? assignments / days : 0;
      
      const totalSchedulingDays = activePeople.reduce((sum, p) => 
        sum + this.calculateSchedulingDays(p.id, evaluationDate), 0);
      const totalAssignments = activePeople.reduce((sum, p) => 
        sum + getPersonAssignmentCount(p, schedules), 0);
      
      const expected = totalSchedulingDays > 0 
        ? (days / totalSchedulingDays) * totalAssignments 
        : 0;
      const deficit = expected - assignments;
      
      rates.push(rate);
      deficits.push(deficit);
      schedulingDays.push(days);
      personIds.push(person.id);
    }
    
    const { metrics, violations, actions } = this.engine.checkAndCorrect(
      rates,
      deficits,
      schedulingDays,
      personIds
    );
    
    const warnings: string[] = [];
    
    for (const violation of violations) {
      if (violation.type === 'cumulative_deficit') {
        const person = people.find(p => p.id === violation.personId);
        warnings.push(
          `⚠️ ${person?.name || violation.personId}: Deficit ${violation.value.toFixed(1)} exceeds bound ${violation.bound.toFixed(1)}`
        );
      } else if (violation.type === 'variance') {
        warnings.push(
          `⚠️ System variance ${violation.value.toFixed(3)} exceeds limit ${violation.bound.toFixed(3)}`
        );
      }
    }
    
    for (const action of actions) {
      const person = people.find(p => p.id === action.personId);
      warnings.push(
        `💡 ${person?.name || action.personId}: ${action.reason} (boosting priority for ${action.duration} weeks)`
      );
    }
    
    return { warnings, metrics };
  }
  
  /**
   * Select team using softmax if enabled, otherwise return null
   */
  selectTeamSoftmax(
    people: Person[],
    schedules: Schedule[],
    evaluationDate: string,
    excludedIds: string[],
    teamSize: number
  ): string[] | null {
    if (!this.flags.useSoftmaxSelection) return null;
    
    const available = people.filter(p => 
      isPersonActive(p, evaluationDate) && !excludedIds.includes(p.id)
    );
    
    if (available.length === 0) return null;
    
    // Calculate deficits
    const personIds: string[] = [];
    const deficits: number[] = [];
    
    const totalSchedulingDays = available.reduce((sum, p) => 
      sum + this.calculateSchedulingDays(p.id, evaluationDate), 0);
    const totalAssignments = available.reduce((sum, p) => 
      sum + getPersonAssignmentCount(p, schedules), 0);
    
    for (const person of available) {
      const days = this.calculateSchedulingDays(person.id, evaluationDate);
      const assignments = getPersonAssignmentCount(person, schedules);
      
      const expected = totalSchedulingDays > 0 
        ? (days / totalSchedulingDays) * totalAssignments 
        : 0;
      const deficit = expected - assignments;
      
      personIds.push(person.id);
      deficits.push(deficit);
    }
    
    // Calculate current variance
    const rates = available.map(p => {
      const daysPresent = calculateTotalDaysPresent(p, evaluationDate);
      const assignments = getPersonAssignmentCount(p, schedules);
      return daysPresent > 0 ? assignments / daysPresent : 0;
    });
    
    const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const variance = rates.reduce((sum, r) => 
      sum + Math.pow(r - mean, 2), 0) / rates.length;
    
    // Use adaptive temperature selection
    return this.engine.selectTeam(personIds, deficits, variance, teamSize);
  }
  
  /**
   * Get confidence interval for a person's assignment rate
   */
  getPersonConfidenceInterval(
    personId: string,
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number } | null {
    if (!this.flags.useBayesianUpdates || !this.initialized) return null;
    
    return this.engine.getPersonConfidenceInterval(personId, confidenceLevel);
  }
  
  /**
   * Get fairness metrics for UI display
   */
  getFairnessMetrics(
    people: Person[],
    schedules: Schedule[],
    evaluationDate: string
  ): any {
    const activePeople = people.filter(p => isPersonActive(p, evaluationDate));
    
    const rates = activePeople.map(p => {
      const days = this.calculateSchedulingDays(p.id, evaluationDate);
      const assignments = getPersonAssignmentCount(p, schedules);
      return days > 0 ? assignments / days : 0;
    });
    
    if (rates.length === 0) return null;
    
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => 
      sum + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    
    return {
      mean: mean.toFixed(4),
      variance: variance.toFixed(4),
      stdDev: stdDev.toFixed(4),
      cv: cv.toFixed(4),
      count: activePeople.length
    };
  }
  
  /**
   * Reset the engine (for testing or reinitialization)
   */
  reset(): void {
    this.engine.reset();
    this.initialized = false;
  }
}

/**
 * Global instance (singleton pattern) - deprecated, use direct instantiation
 */
let globalManager: AdaptiveFairnessManager | null = null;

/**
 * Get or create the global fairness manager
 * @deprecated Use direct instantiation instead
 */
export function getAdaptiveFairnessManager(
  people: Person[],
  schedules: Schedule[],
  evaluationDate: string,
  flags?: FairnessFeatureFlags,
  constraints?: FairnessConstraints
): AdaptiveFairnessManager {
  if (!globalManager) {
    globalManager = new AdaptiveFairnessManager(people, schedules, evaluationDate, flags, constraints);
  }
  return globalManager;
}

/**
 * Reset global manager (for testing)
 */
export function resetAdaptiveFairnessManager(): void {
  if (globalManager) {
    globalManager.reset();
  }
  globalManager = null;
}
