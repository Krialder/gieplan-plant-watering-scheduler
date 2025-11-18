/**
 * types/index.ts - Type Definitions for the GießPlan System
 * 
 * This file contains all TypeScript type definitions for the watering schedule management system.
 * The types are organized to support:
 * - Person lifecycle management with multiple program periods
 * - Time-proportional fairness calculations and metrics
 * - Complex schedule generation with mentor-mentee relationships  
 * - High-turnover environment with frequent arrivals/departures
 * - Multi-year data persistence and historical tracking
 * - Comprehensive export and reporting functionality
 */

// Experience level classification for participants
export type ExperienceLevel = 'new' | 'experienced';

// Represents a continuous period of participation in the program
export interface TimePeriod {
  startDate: string; // ISO date string
  endDate: string | null; // null means currently active
  departureReason?: string; // Optional reason for departure
}

// Virtual history for fair onboarding of new people
// This is a ONE-TIME baseline set at person creation to start them at the average
export interface VirtualHistory {
  virtualAssignments: number; // Virtual assignments added at creation (based on average rate)
  baselineDate: string; // Date when virtual history was calculated (person's arrival or first schedule)
  averageRateAtCreation: number; // Average assignment rate when person was created
}

// Comprehensive fairness tracking metrics for equitable assignment distribution
export interface FairnessMetrics {
  person: string; // Person name for reference
  temporalFairnessScore: number; // Main fairness score (1.0 = perfectly fair)
  assignmentsPerDayPresent: number; // Assignment density metric
  crossYearFairnessDebt: number; // Accumulated unfairness from previous periods
  mentorshipBurdenScore: number; // Load from mentoring responsibilities
  recentAssignmentBalance: number; // Recent assignment fairness
  lastUpdated: string; // ISO timestamp of last calculation
}

// Core person entity with complete lifecycle and fairness tracking
export interface Person {
  id: string; // Unique identifier
  name: string; // Full name
  arrivalDate: string; // ISO date of first program entry
  expectedDepartureDate: string | null; // Planned departure (if known)
  actualDepartureDate: string | null; // Actual departure (if departed)
  programPeriods: TimePeriod[]; // All periods of participation
  experienceLevel: ExperienceLevel; // Current experience classification
  mentorshipAssignments: string[]; // IDs of people this person has mentored
  fairnessMetrics: FairnessMetrics; // Current fairness calculations
  virtualHistory?: VirtualHistory; // Optional one-time virtual history for fair onboarding
}

// Individual week assignment within a schedule
export interface WeekAssignment {
  weekNumber: number; // Week number within the schedule (1-indexed)
  weekStartDate: string; // ISO date of Monday starting the week
  assignedPeople: string[]; // Array of person IDs assigned to this week
  substitutes?: string[]; // Array of person IDs serving as substitutes (optional for backwards compatibility)
  fairnessScores: number[]; // Fairness scores at time of assignment
  hasMentor: boolean; // Whether at least one assigned person is experienced
  comment?: string; // Optional comment/note for this week
  isEmergency?: boolean; // Flag indicating emergency override/manual intervention
  emergencyReason?: string; // Reason for emergency override
}

// Complete multi-week schedule with all assignments
export interface Schedule {
  id: string; // Unique schedule identifier
  startDate: string; // ISO date of first week Monday
  weeks: number; // Total number of weeks in schedule
  assignments: WeekAssignment[]; // All weekly assignments
  createdAt: string; // ISO timestamp when schedule was generated
}

// Complete data structure for a calendar year
export interface YearData {
  year: number; // Calendar year
  people: Person[]; // All people for this year
  schedules: Schedule[]; // All schedules generated for this year
  lastModified: string; // ISO timestamp of last data modification
}

// Calculated fairness information for decision making
export interface FairnessCalculation {
  personId: string; // Reference to person
  personName: string; // Person name for display
  daysPresent: number; // Total days present in program
  totalAssignments: number; // Total number of weeks assigned
  assignmentsPerDay: number; // Assignment density (assignments/days)
  fairnessScore: number; // Relative fairness score (1.0 = average)
  experienceLevel: ExperienceLevel; // Current experience level
  canBeMentor: boolean; // Whether person can serve as mentor
  mentorshipLoad: number; // Current mentoring responsibility count
}
