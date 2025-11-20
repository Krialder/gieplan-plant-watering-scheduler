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

import type { Person, TimePeriod, FairnessMetrics, Schedule } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getTodayString } from './dateUtils';

// Create a new Person object with proper initialization
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
  
  return {
    id: uuidv4(),
    name,
    arrivalDate,
    expectedDepartureDate,
    actualDepartureDate: null,
    programPeriods: [period],
    experienceLevel: 'new', // All new people start as 'new'
    mentorshipAssignments: [],
    fairnessMetrics
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
