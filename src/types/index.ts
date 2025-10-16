export type ExperienceLevel = 'new' | 'experienced';

export interface TimePeriod {
  startDate: string;
  endDate: string | null;
  departureReason?: string;
}

export interface FairnessMetrics {
  person: string;
  temporalFairnessScore: number;
  assignmentsPerDayPresent: number;
  crossYearFairnessDebt: number;
  mentorshipBurdenScore: number;
  recentAssignmentBalance: number;
  lastUpdated: string;
}

export interface Person {
  id: string;
  name: string;
  arrivalDate: string;
  expectedDepartureDate: string | null;
  actualDepartureDate: string | null;
  programPeriods: TimePeriod[];
  experienceLevel: ExperienceLevel;
  mentorshipAssignments: string[];
  fairnessMetrics: FairnessMetrics;
}

export interface WeekAssignment {
  weekNumber: number;
  weekStartDate: string;
  assignedPeople: string[];
  fairnessScores: number[];
  hasMentor: boolean;
}

export interface Schedule {
  id: string;
  startDate: string;
  weeks: number;
  assignments: WeekAssignment[];
  createdAt: string;
}

export interface YearData {
  year: number;
  people: Person[];
  schedules: Schedule[];
  lastModified: string;
}

export interface FairnessCalculation {
  personId: string;
  personName: string;
  daysPresent: number;
  totalAssignments: number;
  assignmentsPerDay: number;
  fairnessScore: number;
  experienceLevel: ExperienceLevel;
  canBeMentor: boolean;
  mentorshipLoad: number;
}
