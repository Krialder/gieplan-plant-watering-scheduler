import type { Person, TimePeriod, FairnessMetrics } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getTodayString } from './dateUtils';

export function createPerson(
  name: string,
  arrivalDate: string,
  expectedDepartureDate: string | null = null
): Person {
  const period: TimePeriod = {
    startDate: arrivalDate,
    endDate: null,
    departureReason: undefined
  };
  
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
    experienceLevel: 'new',
    mentorshipAssignments: [],
    fairnessMetrics
  };
}

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

export function markPersonDeparture(
  person: Person,
  departureDate: string,
  reason?: string
): Person {
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

export function markPersonReturn(
  person: Person,
  returnDate: string
): Person {
  const newPeriod: TimePeriod = {
    startDate: returnDate,
    endDate: null
  };
  
  return {
    ...person,
    actualDepartureDate: null,
    programPeriods: [...person.programPeriods, newPeriod]
  };
}

export function deletePerson(people: Person[], personId: string): Person[] {
  return people.filter(p => p.id !== personId);
}

export function findPersonById(people: Person[], personId: string): Person | undefined {
  return people.find(p => p.id === personId);
}

export function findPersonByName(people: Person[], name: string): Person | undefined {
  return people.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function validatePersonData(data: Partial<Person>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.arrivalDate) {
    errors.push('Arrival date is required');
  }
  
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

export function normalizeGermanName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
