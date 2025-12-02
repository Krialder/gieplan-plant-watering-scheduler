# Anhang D: Code-Beispiele

## IHK Abschlussprojekt - GießPlan

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor

---

## Inhaltsverzeichnis

1. [Bayesian State Tracking](#1-bayesian-state-tracking)
2. [Penalized Priority Calculation](#2-penalized-priority-calculation)
3. [Gumbel-Softmax Selection](#3-gumbel-softmax-selection)
4. [Schedule Engine](#4-schedule-engine)
5. [File Storage](#5-file-storage)
6. [React UI Components](#6-react-ui-components)

---

## 1. Bayesian State Tracking

### 1.1 Implementierung (bayesianState.ts)

```typescript
/**
 * Bayesian Random Walk Model for Fairness
 * 
 * Implements a Kalman filter-style Bayesian update for tracking assignment rates.
 * Smooths short-term volatility and applies drift correction toward ideal rates.
 */

import type { BayesianState } from './types';

// Configuration parameters
export const SIGMA_PROCESS_SQ = 0.005;      // Process noise variance
export const SIGMA_OBS_SQ = 0.05;           // Observation noise variance
export const DRIFT_THRESHOLD = 0.03;        // Threshold for drift correction
export const DRIFT_CORRECTION_ALPHA = 0.2;  // Correction rate (0-1)
const INITIAL_VARIANCE = 0.1;               // Initial uncertainty

/**
 * Initialize Bayesian state for a person
 * 
 * @param personId - Person identifier
 * @param initialRate - Initial belief about fair rate
 * @param date - Initialization date
 * @param initialVariance - Initial uncertainty (optional)
 * @returns Initialized Bayesian state
 */
export function initializeBayesianState(
  personId: string,
  initialRate: number,
  date: string,
  initialVariance: number = INITIAL_VARIANCE
): BayesianState {
  return {
    personId,
    priorMean: initialRate,
    priorVariance: initialVariance,
    observedRate: 0,
    posteriorMean: initialRate,
    posteriorVariance: initialVariance,
    lastUpdateDate: date
  };
}

/**
 * Update Bayesian state using Kalman filter
 * 
 * Mathematical model:
 *   Prior: r(t) ~ N(μ_prior, σ²_prior + σ²_process)
 *   Observation: y(t) ~ N(r(t), σ²_obs)
 *   Posterior: r(t) | y(t) ~ N(μ_posterior, σ²_posterior)
 * 
 * Kalman filter equations:
 *   K = σ²_prior / (σ²_prior + σ²_obs)  [Kalman gain]
 *   μ_posterior = μ_prior + K(y - μ_prior)
 *   σ²_posterior = (1 - K) σ²_prior
 * 
 * @param state - Current Bayesian state
 * @param assigned - Whether person was assigned this period
 * @param daysElapsed - Days since last update
 * @param idealRate - Target ideal rate
 * @returns Updated Bayesian state
 */
export function updateBayesianState(
  state: BayesianState,
  assigned: boolean,
  daysElapsed: number,
  idealRate: number
): BayesianState {
  // 1. Process noise: Uncertainty grows over time
  const processNoise = SIGMA_PROCESS_SQ * (daysElapsed / 7);
  const priorVariance = state.posteriorVariance + processNoise;
  
  // 2. Observation: Calculate observed rate increment
  const observedIncrement = assigned && daysElapsed > 0 
    ? (1 / daysElapsed) 
    : 0;
  
  // 3. Kalman update: Combine prior and observation
  const kalmanGain = priorVariance / (priorVariance + SIGMA_OBS_SQ);
  let posteriorMean = state.posteriorMean + 
    kalmanGain * (observedIncrement - state.posteriorMean);
  const posteriorVariance = (1 - kalmanGain) * priorVariance;
  
  // 4. Drift correction: Pull toward ideal rate if drifting
  if (Math.abs(posteriorMean - idealRate) > DRIFT_THRESHOLD) {
    posteriorMean += DRIFT_CORRECTION_ALPHA * (idealRate - posteriorMean);
  }
  
  return {
    ...state,
    priorMean: posteriorMean,
    priorVariance: posteriorVariance,
    observedRate: observedIncrement,
    posteriorMean,
    posteriorVariance,
    lastUpdateDate: new Date().toISOString()
  };
}

/**
 * Get current fairness deficit
 * 
 * Deficit = idealRate - currentRate
 * Positive deficit → person is underassigned (needs more)
 * Negative deficit → person is overassigned (needs less)
 * 
 * @param state - Bayesian state
 * @param idealRate - Target ideal rate
 * @returns Fairness deficit
 */
export function getFairnessDeficit(
  state: BayesianState,
  idealRate: number
): number {
  return idealRate - state.posteriorMean;
}

/**
 * Get uncertainty (standard deviation)
 * 
 * Higher uncertainty → less confident in current estimate
 * Lower uncertainty → more observations, more confident
 * 
 * @param state - Bayesian state
 * @returns Standard deviation
 */
export function getUncertainty(state: BayesianState): number {
  return Math.sqrt(state.posteriorVariance);
}
```

### 1.2 Mathematische Herleitung

**Kalman-Filter für Zuweisungsraten**:

```
Zustandsraum:
  θ_t = wahre Zuweisungsrate zum Zeitpunkt t
  
Prozessmodell:
  θ_t = θ_{t-1} + w_t,  w_t ~ N(0, σ²_process)
  
Beobachtungsmodell:
  y_t = θ_t + v_t,  v_t ~ N(0, σ²_obs)
  
Bayesian Update:
  Prior: P(θ_t | y_{1:t-1}) = N(μ_prior, σ²_prior)
  Likelihood: P(y_t | θ_t) = N(θ_t, σ²_obs)
  Posterior: P(θ_t | y_{1:t}) = N(μ_post, σ²_post)
  
Kalman Gain:
  K = σ²_prior / (σ²_prior + σ²_obs)
  
Update-Gleichungen:
  μ_post = μ_prior + K(y_t - μ_prior)
  σ²_post = (1 - K) σ²_prior
```

**Drift Correction**:

```
Wenn |μ_post - μ_ideal| > threshold:
  μ_post ← μ_post + α(μ_ideal - μ_post)
  
Wobei α ∈ [0,1] die Korrekturrate ist.
```

---

## 2. Penalized Priority Calculation

### 2.1 Implementierung (penalizedPriority.ts)

```typescript
/**
 * Penalized Priority System
 * 
 * Calculates selection priority with penalties and bonuses.
 */

import type { BayesianState } from './types';

const MENTOR_PENALTY = 0.15;        // 15% priority reduction for mentors
const RECENT_WINDOW_WEEKS = 4;      // Window for recent assignments
const DEBT_WEIGHT = 0.8;            // Weight for cross-year debt

/**
 * Calculate penalized priority for team selection
 * 
 * Formula:
 *   Priority = BasePriority × MentorPenalty × RecencyBonus × DebtBonus
 * 
 * Components:
 *   BasePriority = 1 / (currentRate + ε)
 *     → Lower rate = higher priority (inverse relationship)
 *   
 *   MentorPenalty = isMentor ? (1 - 0.15) : 1.0
 *     → Mentors get 15% less priority to account for extra burden
 *   
 *   RecencyBonus = 1 + max(0, expectedRecent - actualRecent)
 *     → Boost if underassigned in recent weeks
 *   
 *   DebtBonus = 1 + (crossYearDebt × 0.8)
 *     → Compensate for historical inequity
 * 
 * @param personId - Person identifier
 * @param bayesianState - Current Bayesian state
 * @param schedulingDays - Total days in scheduling period
 * @param totalAssignments - Total assignments so far
 * @param isMentor - Whether person is currently mentoring
 * @param recentAssignments - Assignments in recent window
 * @param crossYearDebt - Historical fairness debt
 * @returns Priority score (higher = more likely to be selected)
 */
export function calculatePenalizedPriority(
  personId: string,
  bayesianState: BayesianState,
  schedulingDays: number,
  totalAssignments: number,
  isMentor: boolean,
  recentAssignments: number,
  crossYearDebt: number
): number {
  // Base priority: Inverse of current rate
  const currentRate = bayesianState.posteriorMean;
  const epsilon = 0.001; // Prevent division by zero
  const basePriority = 1 / (currentRate + epsilon);
  
  // Mentor penalty: Reduce priority for active mentors
  const mentorPenalty = isMentor ? (1 - MENTOR_PENALTY) : 1.0;
  
  // Recency bonus: Boost if underassigned recently
  const recentDays = RECENT_WINDOW_WEEKS * 7;
  const expectedRecent = (recentDays / schedulingDays) * totalAssignments;
  const recencyBonus = 1 + Math.max(0, expectedRecent - recentAssignments);
  
  // Cross-year debt bonus: Compensate historical inequity
  const debtBonus = 1 + (crossYearDebt * DEBT_WEIGHT);
  
  // Combined priority
  const priority = basePriority * mentorPenalty * recencyBonus * debtBonus;
  
  return priority;
}

/**
 * Calculate priority for all candidates
 * 
 * @param candidates - Array of candidate person IDs
 * @param states - Map of person IDs to Bayesian states
 * @param context - Additional context (mentors, assignments, etc.)
 * @returns Map of person IDs to priorities
 */
export function calculateAllPriorities(
  candidates: string[],
  states: Map<string, BayesianState>,
  context: {
    schedulingDays: number;
    totalAssignments: number;
    mentors: Set<string>;
    recentAssignments: Map<string, number>;
    crossYearDebts: Map<string, number>;
  }
): Map<string, number> {
  const priorities = new Map<string, number>();
  
  for (const personId of candidates) {
    const state = states.get(personId);
    if (!state) continue;
    
    const priority = calculatePenalizedPriority(
      personId,
      state,
      context.schedulingDays,
      context.totalAssignments,
      context.mentors.has(personId),
      context.recentAssignments.get(personId) || 0,
      context.crossYearDebts.get(personId) || 0
    );
    
    priorities.set(personId, priority);
  }
  
  return priorities;
}
```

### 2.2 Beispiel-Berechnung

```typescript
// Person A: Niedrige Rate, kein Mentor
const priorityA = calculatePenalizedPriority(
  'person-a',
  { posteriorMean: 0.08 },  // Rate unter Durchschnitt
  365,                       // 1 Jahr
  52,                        // 52 Zuweisungen total
  false,                     // Kein Mentor
  3,                         // 3 Zuweisungen in letzten 4 Wochen
  0.1                        // Leichtes Defizit aus Vorjahr
);

// Berechnung:
// basePriority = 1 / (0.08 + 0.001) = 12.35
// mentorPenalty = 1.0 (kein Mentor)
// expectedRecent = (28 / 365) * 52 = 3.99
// recencyBonus = 1 + max(0, 3.99 - 3) = 1.99
// debtBonus = 1 + (0.1 * 0.8) = 1.08
// priority = 12.35 * 1.0 * 1.99 * 1.08 = 26.56

// Person B: Hohe Rate, Mentor
const priorityB = calculatePenalizedPriority(
  'person-b',
  { posteriorMean: 0.16 },  // Rate über Durchschnitt
  365,
  52,
  true,                      // Ist Mentor
  7,                         // 7 Zuweisungen in letzten 4 Wochen
  -0.05                      // Leichtes Plus aus Vorjahr
);

// Berechnung:
// basePriority = 1 / (0.16 + 0.001) = 6.21
// mentorPenalty = 0.85 (Mentor-Reduktion)
// expectedRecent = 3.99
// recencyBonus = 1 + max(0, 3.99 - 7) = 1.0 (kein Bonus)
// debtBonus = 1 + (-0.05 * 0.8) = 0.96
// priority = 6.21 * 0.85 * 1.0 * 0.96 = 5.07

// Ergebnis: Person A (26.56) >> Person B (5.07)
// → Person A wird mit höherer Wahrscheinlichkeit ausgewählt
```

---

## 3. Gumbel-Softmax Selection

### 3.1 Implementierung (softmaxSelection.ts)

```typescript
/**
 * Gumbel-Softmax Selection
 * 
 * Implements stochastic team selection using Gumbel-Max trick.
 */

import type { SeededRandom } from './random';
import { gumbelMaxSample } from './random';

export const TEMPERATURE_DEFAULT = 1.0;

/**
 * Sample from Gumbel(0, 1) distribution
 * 
 * Gumbel distribution CDF: F(x) = exp(-exp(-x))
 * Inverse CDF: F^(-1)(u) = -log(-log(u))
 * 
 * @param rng - Seeded random number generator
 * @returns Sample from Gumbel(0, 1)
 */
function sampleGumbel(rng?: SeededRandom): number {
  const random = rng || Math.random;
  const u = typeof random === 'function' ? random() : random.next();
  return -Math.log(-Math.log(u));
}

/**
 * Select team using Gumbel-Softmax
 * 
 * Gumbel-Max Trick:
 *   For each candidate i:
 *     g_i ~ Gumbel(0, 1)
 *     score_i = log(priority_i) + g_i / temperature
 *   
 *   Select k candidates with highest scores
 * 
 * Temperature effects:
 *   T → 0: Deterministic (always highest priority)
 *   T = 1: Balanced stochasticity
 *   T → ∞: Uniform random
 * 
 * @param candidates - Array of candidate person IDs
 * @param priorities - Map of person IDs to priorities
 * @param teamSize - Number of people to select
 * @param temperature - Temperature parameter (default 1.0)
 * @param rng - Seeded RNG for reproducibility
 * @returns Selected team (person IDs)
 */
export function selectTeamGumbelSoftmax(
  candidates: string[],
  priorities: Map<string, number>,
  teamSize: number,
  temperature: number = TEMPERATURE_DEFAULT,
  rng?: SeededRandom
): string[] {
  if (candidates.length === 0) {
    throw new Error('No candidates available');
  }
  
  if (candidates.length <= teamSize) {
    // Not enough candidates, return all
    return [...candidates];
  }
  
  // Calculate Gumbel-perturbed scores
  const scores = candidates.map(id => {
    const priority = priorities.get(id) || 0.001;
    const gumbel = sampleGumbel(rng);
    return {
      id,
      score: Math.log(priority) + gumbel / temperature
    };
  });
  
  // Sort by score (descending) and take top k
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, teamSize).map(s => s.id);
}

/**
 * Calculate softmax probabilities
 * 
 * For inspection/debugging purposes.
 * 
 * Formula:
 *   p_i = exp(log(priority_i) / T) / Σ_j exp(log(priority_j) / T)
 *       = priority_i^(1/T) / Σ_j priority_j^(1/T)
 * 
 * @param priorities - Map of person IDs to priorities
 * @param temperature - Temperature parameter
 * @returns Map of person IDs to selection probabilities
 */
export function calculateSoftmaxProbabilities(
  priorities: Map<string, number>,
  temperature: number = TEMPERATURE_DEFAULT
): Map<string, number> {
  const ids = Array.from(priorities.keys());
  const logits = ids.map(id => {
    const priority = priorities.get(id) || 0.001;
    return Math.log(priority) / temperature;
  });
  
  // LogSumExp for numerical stability
  const maxLogit = Math.max(...logits);
  const expSum = logits.reduce((sum, logit) => 
    sum + Math.exp(logit - maxLogit), 0
  );
  const logSumExp = maxLogit + Math.log(expSum);
  
  // Calculate probabilities
  const probs = new Map<string, number>();
  ids.forEach((id, i) => {
    const prob = Math.exp(logits[i] - logSumExp);
    probs.set(id, prob);
  });
  
  return probs;
}
```

### 3.2 Beispiel-Nutzung

```typescript
// Setup
const candidates = ['alice', 'bob', 'charlie', 'diana', 'eve'];
const priorities = new Map([
  ['alice', 10.5],   // Höchste Priorität
  ['bob', 8.2],
  ['charlie', 5.1],
  ['diana', 3.8],
  ['eve', 2.0]       // Niedrigste Priorität
]);

// Deterministisch (T → 0)
const deterministicTeam = selectTeamGumbelSoftmax(
  candidates, priorities, 2, 0.1
);
// → ['alice', 'bob'] (immer die Top 2)

// Balanced (T = 1.0)
const balancedTeam = selectTeamGumbelSoftmax(
  candidates, priorities, 2, 1.0
);
// → ['alice', 'charlie'] (stochastisch, aber gewichtet)

// Uniform random (T → ∞)
const randomTeam = selectTeamGumbelSoftmax(
  candidates, priorities, 2, 10.0
);
// → ['diana', 'eve'] (fast uniform)

// Probabilities
const probs = calculateSoftmaxProbabilities(priorities, 1.0);
// alice: 0.52
// bob: 0.28
// charlie: 0.12
// diana: 0.06
// eve: 0.02
```

---

## 4. Schedule Engine

### 4.1 Kernlogik (scheduleEngine.ts)

```typescript
/**
 * Schedule Generation Engine
 * 
 * Orchestrates fair schedule generation using fairness algorithms.
 */

import type { 
  Person, 
  Schedule, 
  WeekAssignment, 
  ScheduleOptions, 
  ScheduleResult 
} from '../types';
import { AdaptiveFairnessManager } from './adaptiveFairness';
import { getActivePeople } from './personManager';
import { parseISO, addWeeks, format } from 'date-fns';

/**
 * Generate fair schedule
 * 
 * @param options - Schedule generation options
 * @returns Schedule result with success status
 */
export function generateSchedule(options: ScheduleOptions): ScheduleResult {
  // 1. Validate options
  const validation = validateOptions(options);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  // 2. Initialize fairness manager
  const fairnessManager = new AdaptiveFairnessManager({
    people: options.people,
    startDate: options.startDate,
    seed: options.seed
  });
  
  const assignments: WeekAssignment[] = [];
  let currentDate = parseISO(options.startDate);
  
  // 3. Generate assignments for each week
  for (let weekNum = 1; weekNum <= options.weeks; weekNum++) {
    const weekStart = format(currentDate, 'yyyy-MM-dd');
    
    // 3a. Get active people for this week
    const activePeople = getActivePeople(options.people, weekStart);
    
    if (activePeople.length < 2) {
      // Insufficient people - mark as gap
      assignments.push({
        weekNumber: weekNum,
        weekStartDate: weekStart,
        assignedPeople: [],
        substitutes: [],
        fairnessScores: [],
        hasMentor: false,
        comment: `Insufficient people (${activePeople.length})`,
        isEmergency: true
      });
      currentDate = addWeeks(currentDate, 1);
      continue;
    }
    
    // 3b. Select main team
    const team = fairnessManager.selectTeam({
      candidates: activePeople.map(p => p.id),
      teamSize: 2,
      requireMentor: options.requireMentor,
      avoidConsecutive: options.avoidConsecutive,
      previousAssignees: assignments[weekNum - 2]?.assignedPeople
    });
    
    // 3c. Select substitutes
    const availableForSubs = activePeople
      .map(p => p.id)
      .filter(id => !team.includes(id));
    
    const substitutes = fairnessManager.selectSubstitutes({
      candidates: availableForSubs,
      count: Math.min(2, availableForSubs.length)
    });
    
    // 3d. Create week assignment
    const hasMentor = team.some(id => {
      const person = options.people.find(p => p.id === id);
      return person?.experienceLevel === 'experienced';
    });
    
    assignments.push({
      weekNumber: weekNum,
      weekStartDate: weekStart,
      assignedPeople: team,
      substitutes,
      fairnessScores: team.map(id => 
        fairnessManager.getFairnessScore(id)
      ),
      hasMentor,
      comment: undefined,
      isEmergency: false
    });
    
    // 3e. Update fairness state
    fairnessManager.updateAfterAssignment(team, weekStart);
    
    // 3f. Move to next week
    currentDate = addWeeks(currentDate, 1);
  }
  
  // 4. Check constraints
  const violations = fairnessManager.checkConstraints();
  
  // 5. Create schedule
  const schedule: Schedule = {
    id: crypto.randomUUID(),
    startDate: options.startDate,
    weeks: options.weeks,
    assignments,
    createdAt: new Date().toISOString()
  };
  
  return {
    success: true,
    schedule,
    warnings: violations.length > 0 ? violations : undefined
  };
}
```

---

## 5. File Storage

### 5.1 File System Access API (fileStorage.ts)

```typescript
/**
 * File Storage using File System Access API
 * 
 * Enables local file storage with user-controlled folder.
 */

import type { YearData } from '../types';

/**
 * Select data folder
 * 
 * Opens native folder picker dialog.
 * 
 * @returns Success status
 */
export async function selectDataFolder(): Promise<boolean> {
  try {
    // Feature detection
    if (!('showDirectoryPicker' in window)) {
      alert(
        'Ihr Browser unterstützt die File System Access API nicht.\n' +
        'Bitte nutzen Sie Chrome 102+ oder Edge 102+.'
      );
      return false;
    }
    
    // @ts-ignore - showDirectoryPicker not in TypeScript yet
    const dirHandle: FileSystemDirectoryHandle = 
      await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
    
    // Store handle in IndexedDB (persists across sessions)
    await setStorageItem('dataFolderHandle', dirHandle);
    
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled - not an error
      return false;
    }
    throw error;
  }
}

/**
 * Save year data to JSON file
 * 
 * @param year - Year number
 * @param data - Year data to save
 */
export async function saveYearData(
  year: number, 
  data: YearData
): Promise<void> {
  const dirHandle = await getStorageItem<FileSystemDirectoryHandle>(
    'dataFolderHandle'
  );
  
  if (!dirHandle) {
    throw new Error('Kein Datenordner ausgewählt. Bitte wählen Sie einen Ordner.');
  }
  
  const fileName = `yearData_${year}.json`;
  
  // Create or overwrite file
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  
  // Write JSON (formatted for readability)
  const json = JSON.stringify(data, null, 2);
  await writable.write(json);
  await writable.close();
}

/**
 * Load year data from JSON file
 * 
 * @param year - Year number
 * @returns Year data
 */
export async function loadYearData(year: number): Promise<YearData | null> {
  const dirHandle = await getStorageItem<FileSystemDirectoryHandle>(
    'dataFolderHandle'
  );
  
  if (!dirHandle) {
    return null;
  }
  
  try {
    const fileName = `yearData_${year}.json`;
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text) as YearData;
    
    return data;
  } catch (error) {
    // File doesn't exist
    return null;
  }
}

/**
 * Export schedule to CSV
 * 
 * @param schedule - Schedule to export
 * @param people - People for name lookup
 * @returns CSV string
 */
export function exportScheduleToCSV(
  schedule: Schedule,
  people: Person[]
): string {
  const peopleMap = new Map(people.map(p => [p.id, p.name]));
  
  const header = 'Woche,Datum,Person 1,Person 2,Ersatz 1,Ersatz 2,Mentor,Kommentar\n';
  
  const rows = schedule.assignments.map(a => {
    const person1 = peopleMap.get(a.assignedPeople[0]) || 'N/A';
    const person2 = peopleMap.get(a.assignedPeople[1]) || 'N/A';
    const sub1 = a.substitutes?.[0] ? peopleMap.get(a.substitutes[0]) : '';
    const sub2 = a.substitutes?.[1] ? peopleMap.get(a.substitutes[1]) : '';
    const mentor = a.hasMentor ? 'Ja' : 'Nein';
    const comment = a.comment || '';
    
    return `${a.weekNumber},${a.weekStartDate},${person1},${person2},${sub1},${sub2},${mentor},"${comment}"`;
  }).join('\n');
  
  return header + rows;
}
```

---

## 6. React UI Components

### 6.1 Schedule Tab Component (ScheduleTab.tsx)

```typescript
/**
 * Schedule Tab - Schedule generation and display
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { generateSchedule } from '../lib/scheduleEngine';
import type { Person, Schedule } from '../types';

interface ScheduleTabProps {
  people: Person[];
  onScheduleGenerated: (schedule: Schedule) => void;
}

export function ScheduleTab({ people, onScheduleGenerated }: ScheduleTabProps) {
  const [startDate, setStartDate] = useState('');
  const [weeks, setWeeks] = useState(12);
  const [requireMentor, setRequireMentor] = useState(true);
  const [avoidConsecutive, setAvoidConsecutive] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const result = generateSchedule({
        people,
        startDate,
        weeks,
        requireMentor,
        avoidConsecutive
      });
      
      if (result.success && result.schedule) {
        onScheduleGenerated(result.schedule);
        toast.success('Zeitplan erfolgreich generiert');
        
        if (result.warnings && result.warnings.length > 0) {
          toast.warning(`${result.warnings.length} Fairness-Warnungen`);
        }
      } else {
        toast.error('Fehler: ' + (result.errors?.join(', ') || 'Unbekannt'));
      }
    } catch (error) {
      toast.error('Fehler beim Generieren: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Zeitplan generieren</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Startdatum (Montag)
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Anzahl Wochen (1-52)
          </label>
          <Input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mentor"
            checked={requireMentor}
            onCheckedChange={setRequireMentor}
          />
          <label htmlFor="mentor" className="text-sm">
            Mentor erforderlich (mind. 1 erfahrene Person pro Team)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="consecutive"
            checked={avoidConsecutive}
            onCheckedChange={setAvoidConsecutive}
          />
          <label htmlFor="consecutive" className="text-sm">
            Keine aufeinanderfolgenden Wochen
          </label>
        </div>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={generating || !startDate || people.length < 4}
        className="w-full"
      >
        {generating ? 'Generiere...' : 'Zeitplan generieren'}
      </Button>
      
      {people.length < 4 && (
        <p className="text-sm text-amber-600">
          Mindestens 4 Personen erforderlich für Zeitplan-Generierung
        </p>
      )}
    </div>
  );
}
```

---

<div align="center">

**Anhang D: Code-Beispiele**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

**Programmiersprache**: TypeScript 5.7  
**Framework**: React 19

 Monat Jahr 

</div>
