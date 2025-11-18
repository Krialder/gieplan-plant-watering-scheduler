/**
 * personManager.ts - Person Management and Lifecycle Functions
 * 
 * This module handles all person-related operations including creation, updates, and lifecycle management.
 * Functions:
 * - Create new Person objects with proper initialization
 * - Handle person departures and returns with time period tracking
 * - Manage person lifecycle states and experience levels
 * - Validate person data and normalize German names
 * - Update fairness metrics and maintain data consistency
 * - Provide search and filtering utilities for person collections
 * 
 * Note: Person deletion with schedule gap-filling is handled in scheduleEngine.ts
 * via the handlePersonDeletion function.
 */

import type { Person, TimePeriod, FairnessMetrics, VirtualHistory, Schedule } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getTodayString, getDaysBetween } from './dateUtils';

/**
 * Calculate virtual history for a new person to start them at the average
 * This is a ONE-TIME calculation that gives them a fair baseline
 * 
 * Logic:
 * 1. Find average assignment rate of existing people (assignments per scheduling day)
 * 2. Calculate how many scheduling days this new person would have had (from first schedule to now)
 * 3. Give them virtual assignments = average_rate × their_scheduling_days
 * 4. These virtual assignments are a permanent baseline added at creation
 */
function calculateVirtualHistory(
  arrivalDate: string,
  existingPeople: Person[],
  existingSchedules: Schedule[]
): VirtualHistory | undefined {
  // Find earliest schedule date
  let earliestScheduleDate: string | null = null;
  for (const schedule of existingSchedules) {
    if (!earliestScheduleDate || schedule.startDate < earliestScheduleDate) {
      earliestScheduleDate = schedule.startDate;
    }
  }
  
  // If no schedules exist yet, no virtual history needed (everyone starts fresh)
  if (!earliestScheduleDate) {
    return undefined;
  }
  
  // Calculate average rate from existing people who have assignments
  const peopleWithAssignments = existingPeople.filter(p => {
    // Count their total assignments across all schedules
    let count = 0;
    for (const schedule of existingSchedules) {
      for (const assignment of schedule.assignments) {
        if (assignment.assignedPeople.includes(p.id)) {
          count++;
        }
      }
    }
    return count > 0;
  });
  
  // If no one has assignments yet, no virtual history needed
  if (peopleWithAssignments.length === 0) {
    return undefined;
  }
  
  // Calculate average assignment rate (assignments per scheduling day)
  let totalRate = 0;
  for (const person of peopleWithAssignments) {
    // Count assignments
    let assignments = 0;
    for (const schedule of existingSchedules) {
      for (const assignment of schedule.assignments) {
        if (assignment.assignedPeople.includes(person.id)) {
          assignments++;
        }
      }
    }
    
    // Calculate their scheduling days (from first schedule or their join date, whichever is later)
    const personStartDate = person.arrivalDate > earliestScheduleDate 
      ? person.arrivalDate 
      : earliestScheduleDate;
    const schedulingDays = getDaysBetween(personStartDate, arrivalDate);
    
    if (schedulingDays > 0) {
      totalRate += assignments / schedulingDays;
    }
  }
  
  const averageRate = totalRate / peopleWithAssignments.length;
  
  // Calculate this person's baseline date (earliest schedule or their arrival, whichever is later)
  const baselineDate = arrivalDate > earliestScheduleDate ? arrivalDate : earliestScheduleDate;
  
  // Calculate virtual assignments: how many would they have if they started at average rate?
  const schedulingDays = getDaysBetween(baselineDate, arrivalDate);
  const virtualAssignments = schedulingDays > 0 ? averageRate * schedulingDays : 0;
  
  return {
    virtualAssignments: Math.max(0, virtualAssignments),
    baselineDate,
    averageRateAtCreation: averageRate
  };
}

// Create a new Person object with proper initialization
// Optionally provide existingPeople and existingSchedules to calculate virtual history
export function createPerson(
  name: string,
  arrivalDate: string,
  expectedDepartureDate: string | null = null,
  existingPeople: Person[] = [],
  existingSchedules: Schedule[] = []
): Person {
  // Create initial time period for the person's participation
  const period: TimePeriod = {
    startDate: arrivalDate,
    endDate: null,
    departureReason: undefined
  };
  
  // Initialize fairness metrics with default values
  const fairnessMetrics: FairnessMetrics = {
    person: name,
    temporalFairnessScore: 1.0,
    assignmentsPerDayPresent: 0,
    crossYearFairnessDebt: 0,
    mentorshipBurdenScore: 0,
    recentAssignmentBalance: 1.0,
    lastUpdated: new Date().toISOString()
  };
  
  // Calculate virtual history to give new person a fair starting point
  const virtualHistory = calculateVirtualHistory(arrivalDate, existingPeople, existingSchedules);
  
  return {
    id: uuidv4(),
    name,
    arrivalDate,
    expectedDepartureDate,
    actualDepartureDate: null,
    programPeriods: [period],
    experienceLevel: 'new', // All new people start as 'new'
    mentorshipAssignments: [],
    fairnessMetrics,
    virtualHistory
  };
}

// Update an existing person with partial data changes
export function updatePerson(person: Person, updates: Partial<Person>): Person {
  return {
    ...person,
    ...updates,
    fairnessMetrics: {
      ...person.fairnessMetrics,
      ...updates.fairnessMetrics,
      lastUpdated: new Date().toISOString()
    }
  };
}

// Mark a person as departed with date and optional reason
export function markPersonDeparture(
  person: Person,
  departureDate: string,
  reason?: string
): Person {
  // Close all open periods (where endDate is null)
  const updatedPeriods = person.programPeriods.map(period =>
    period.endDate === null
      ? { ...period, endDate: departureDate, departureReason: reason }
      : period
  );
  
  return {
    ...person,
    actualDepartureDate: departureDate,
    programPeriods: updatedPeriods
  };
}

// Mark a person as returned by creating a new active period
export function markPersonReturn(
  person: Person,
  returnDate: string
): Person {
  // Create new time period for the person's return
  const newPeriod: TimePeriod = {
    startDate: returnDate,
    endDate: null
  };
  
  return {
    ...person,
    actualDepartureDate: null, // Clear actual departure date
    programPeriods: [...person.programPeriods, newPeriod]
  };
}

// Remove a person from the collection by ID
export function deletePerson(people: Person[], personId: string): Person[] {
  return people.filter(p => p.id !== personId);
}

// Find a person by their unique ID
export function findPersonById(people: Person[], personId: string): Person | undefined {
  return people.find(p => p.id === personId);
}

// Find a person by their name (case-insensitive)
export function findPersonByName(people: Person[], name: string): Person | undefined {
  return people.find(p => p.name.toLowerCase() === name.toLowerCase());
}

// Validate person data for creation/updates
export function validatePersonData(data: Partial<Person>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  // Arrival date validation
  if (!data.arrivalDate) {
    errors.push('Arrival date is required');
  }
  
  // Date logic validation
  if (data.expectedDepartureDate && data.arrivalDate) {
    const arrival = new Date(data.arrivalDate);
    const departure = new Date(data.expectedDepartureDate);
    
    if (departure <= arrival) {
      errors.push('Expected departure date must be after arrival date');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Normalize German names with proper capitalization
export function normalizeGermanName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
