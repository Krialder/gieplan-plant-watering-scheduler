# API Reference

Complete API documentation for GießPlan Plant Watering Schedule Management System.

**IHK Abschlussprojekt**: Fachinformatiker/-in für Anwendungsentwicklung  
📄 [Project Documentation](../IHK/02_Dokumentation/Projektdokumentation.md)

---

## Quick Reference

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **scheduleEngine** | Schedule generation orchestration | `generateSchedule`, `updateWeekAssignment`, `replacePersonInWeek` |
| **personManager** | People lifecycle management | `addPerson`, `updatePerson`, `deletePerson`, `calculateExperienceLevel` |
| **fairnessEngine** | Fairness utilities & compatibility | `calculateFairnessMetrics`, `updateFairnessMetrics`, `calculateTenure` |
| **adaptiveFairness** | Advanced fairness coordination | `AdaptiveFairnessManager` (with feature flags), `DEFAULT_FEATURE_FLAGS` |
| **fileStorage** | File-based data persistence | `loadYearData`, `saveYearData`, `exportToJSON`, `exportToCSV` |
| **storage** | LocalStorage utilities | `useLocalStorage` hook for preferences (theme, folder name) |
| **dateUtils** | Date operations | `getNextMonday`, `getWeeksInRange`, `isDateInRange` |
| **exportUtils** | Export format conversion | `convertToCSV`, `convertToExcel` |

---

## Table of Contents

- [Type Definitions](#type-definitions)
- [Core Modules](#core-modules)
- [Fairness Subsystems](#fairness-subsystems)
- [React Components](#react-components)

---

## Type Definitions

Located in `src/types/index.ts`

### Person

```typescript
interface Person {
  id: string;                           // UUID
  name: string;
  arrivalDate: string;                  // ISO date
  expectedDepartureDate: string | null;
  actualDepartureDate: string | null;
  programPeriods: TimePeriod[];
  experienceLevel: 'new' | 'experienced';
  mentorshipAssignments: string[];      // Mentored person IDs
  fairnessMetrics: FairnessMetrics;
}
```

### TimePeriod

```typescript
interface TimePeriod {
  startDate: string;          // ISO date
  endDate: string | null;     // null = active
  departureReason?: string;
}
```

### FairnessMetrics

```typescript
interface FairnessMetrics {
  person: string;
  temporalFairnessScore: number;     // 1.0 = fair
  assignmentsPerDayPresent: number;
  crossYearFairnessDebt: number;
  mentorshipBurdenScore: number;
  recentAssignmentBalance: number;
  lastUpdated: string;
}
```

### Schedule & WeekAssignment

```typescript
interface Schedule {
  id: string;
  startDate: string;
  weeks: number;
  assignments: WeekAssignment[];
  createdAt: string;
}

interface WeekAssignment {
  weekNumber: number;
  weekStartDate: string;
  assignedPeople: string[];
  substitutes?: string[];
  fairnessScores: number[];
  hasMentor: boolean;
  comment?: string;
  isEmergency?: boolean;
  emergencyReason?: string;
}
```

### YearData

```typescript
interface YearData {
  year: number;
  people: Person[];
  schedules: Schedule[];
  lastModified: string;
}
```

---

## Core Modules

### Schedule Engine (`src/lib/scheduleEngine.ts`)

#### generateSchedule(options)
Generate multi-week schedule with fairness optimization.

```typescript
generateSchedule({
  startDate: '2025-01-06',
  weeks: 12,
  people: Person[],
  existingSchedules: Schedule[],
  enforceNoConsecutive: boolean,
  requireMentor: boolean,
  includeFutureArrivals?: boolean
}): { success, schedule?, errors, warnings }
```

#### Other Functions
- `getWeekAssignment(schedule, weekStartDate)` - Find specific week assignment
- `updateWeekAssignment(schedule, weekStartDate, updates)` - Update week details
- `replacePersonInWeek(schedule, weekStartDate, oldId, newId)` - Swap person in week
- `swapPersonGlobally(schedules, person1Id, person2Id)` - Swap across all schedules
- `deleteSchedule(schedules, scheduleId)` - Remove schedule
- `consolidateSchedules(schedules)` - Merge consecutive schedules
- `getPersonStatistics(personId, schedules)` - Get assignment stats

---

### Person Manager (`src/lib/personManager.ts`)

#### Core Functions
- `createPerson(name, arrivalDate, expectedDepartureDate?, ...)` - Create new person with UUID and initial metrics
- `updatePerson(person, updates)` - Immutable person update
- `markPersonDeparture(person, date, reason?)` - Close current period
- `markPersonReturn(person, returnDate)` - Start new period
- `validatePersonData(data)` - Validate person data
- `normalizeGermanName(name)` - Capitalize German names
- `calculateExperienceLevel(person, schedules)` - Determine experience (90 days + 4 assignments)
- `deletePerson(people, personId)` - Remove person
- `addPersonToProgramPeriod(person, startDate)` - Add program period

---

### Fairness Engine (`src/lib/fairnessEngine.ts`)

Utility functions and compatibility layer.

#### Key Functions
- `calculateTenure(person, date?)` - Days since join
- `calculateTotalDaysPresent(person, date?)` - Total days across all periods
- `isPersonActive(person, date?)` - Check if active on date
- `isExperienced(person)` - Check if experienced (90 days + 4 assignments)
- `getPersonAssignmentCount(person, schedules)` - Count assignments
- `selectTeamsAndSubstitutes(people, schedules, weekStartDate, fairnessManager, teamSize, numSubstitutes, requireMentor)` - Select team with fairness
- `calculateFairnessMetrics(person, schedules, people)` - Calculate all metrics
- `updateFairnessMetrics(people, schedules)` - Update metrics for all people

---

### Adaptive Fairness (`src/lib/adaptiveFairness.ts`)

Dynamic fairness system coordination with feature flags for gradual rollout.

#### FairnessFeatureFlags Interface

```typescript
interface FairnessFeatureFlags {
  usePenalizedPriority: boolean;    // Enable priority with mentor penalties
  useBayesianUpdates: boolean;      // Enable Bayesian state tracking
  useConstraintChecking: boolean;   // Enable fairness constraint validation
  useSoftmaxSelection: boolean;     // Enable Gumbel-Softmax selection
}

// Default configuration (production)
export const DEFAULT_FEATURE_FLAGS: FairnessFeatureFlags = {
  usePenalizedPriority: true,
  useBayesianUpdates: true,
  useConstraintChecking: true,
  useSoftmaxSelection: false  // Disabled for gradual rollout
};
```

#### AdaptiveFairnessManager

**Constructor:** `new AdaptiveFairnessManager(people, schedules, evaluationDate, flags?, constraints?)`

**Parameters:**
- `people`: Person[] - Active participants
- `schedules`: Schedule[] - Historical schedules
- `evaluationDate`: string - Current date (ISO format)
- `flags?`: FairnessFeatureFlags - Feature toggles (default: DEFAULT_FEATURE_FLAGS)
- `constraints?`: FairnessConstraints - Fairness thresholds

**Methods:**
- `calculatePriorities(people, weekStartDate)` - Returns `Map<string, number>` of priorities
- `selectTeamWithSoftmax(candidates, priorities, teamSize, temperature?)` - Stochastic selection (if enabled)
- `updateAfterSelection(selectedIds, weekStartDate)` - Update fairness state
- `getFairnessReport()` - Get comprehensive metrics
- `checkConstraints()` - Validate fairness constraints (if enabled)
- `getFeatureFlags()` - Get current feature flag configuration

**Usage Example:**
```typescript
// Production usage (default flags)
const manager = new AdaptiveFairnessManager(people, schedules, evaluationDate);

// Testing with experimental features
const testManager = new AdaptiveFairnessManager(
  people,
  schedules,
  evaluationDate,
  { ...DEFAULT_FEATURE_FLAGS, useSoftmaxSelection: true }
);
```

---

### Storage Utilities (`src/lib/storage.ts`)

LocalStorage-based React hook for preferences and lightweight data.

#### useLocalStorage Hook

```typescript
function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void]
```

**Usage:**
```typescript
// In React components
const [theme, setTheme] = useLocalStorage('theme', 'light');
const [folderName, setFolderName] = useLocalStorage('folderName', '');
const [settings, setSettings] = useLocalStorage('settings', { /* defaults */ });

// Works like useState but persists to localStorage
setTheme('dark');  // Automatically syncs to localStorage
```

**Features:**
- Automatic JSON serialization/deserialization
- React state integration (triggers re-renders)
- Error handling for quota exceeded
- Supports updater functions like useState

**Use Cases:**
- Theme selection (light/dark/twilight)
- UI preferences
- Last selected folder name
- Recent items cache

---

### File Storage (`src/lib/fileStorage.ts`)

File-based JSON persistence using File System Access API.

#### Functions
- `selectDataFolder()` - Prompt user to select folder → `Promise<boolean>`
- `loadYearDataFromFile(year)` - Load from `yearData_YYYY.json` → `Promise<YearData | null>`
- `saveYearDataToFile(yearData)` - Save to JSON file → `Promise<boolean>`
- `exportToJSON(yearData)` - Export as JSON string
- `exportToCSV(schedules, people)` - Export as CSV string
- `exportToExcel(schedules, people)` - Export as Excel workbook
- `importFromJSON(jsonString)` - Parse JSON import
- `importFromCSV(csvString)` - Parse CSV import

---

### Date Utils (`src/lib/dateUtils.ts`)

Date manipulation utilities.

#### Functions
- `formatDate(date)` - Date → ISO string (YYYY-MM-DD)
- `parseDate(isoString)` - ISO string → Date
- `getMonday(date)` - Get week's Monday
- `addWeeks(date, weeks)` - Add weeks to date
- `getDaysBetween(startDate, endDate)` - Calculate day difference
- `formatDateGerman(isoString)` - Format as DD.MM.YYYY
- `getWeekNumber(date)` - Get ISO week number
- `getCurrentYear()` - Get current year
- `getTodayString()` - Get today as ISO string
- `isDateInRange(date, startDate, endDate)` - Check if date in range
- `getWeeksInRange(startDate, endDate)` - Get all Mondays in range

---

## Fairness Subsystems

### Bayesian State (`fairness/bayesianState.ts`)

Bayesian random walk for fairness tracking.

#### BayesianState Interface
```typescript
interface BayesianState {
  personId: string;
  mu: number;              // Posterior mean (assignment rate)
  sigma: number;           // Posterior std deviation (uncertainty)
  priorMu: number;         // Prior mean
  priorSigma: number;      // Prior std deviation
  observations: number;    // Update count
  lastUpdated: string;     // ISO timestamp
}
```

#### Functions
- `initializeBayesianState(personId, initialRate, date)` - Create initial state
- `updateBayesianState(state, observedRate, date)` - Bayesian update after observation
- `getConfidenceInterval(state, confidence = 0.95)` - Get confidence interval `{ lower, upper, mean }`
- `predictFutureState(state, futureDays)` - Predict future state
- `mergeBayesianStates(states)` - Merge multiple states

---

### Penalized Priority (`fairness/penalizedPriority.ts`)

Time-weighted fairness priority calculation.

#### calculatePenalizedPriority
Calculate selection priority with fairness penalties.

```typescript
calculatePenalizedPriority(
  personId: string,
  bayesianState: BayesianState,
  schedulingDays: number,
  totalAssignments: number,
  isMentor: boolean,
  recentAssignments: number,
  crossYearDebt: number
): number  // Higher = more deserving
```

**Priority Components:**
- Base fairness from Bayesian state
- Time-weighted recent assignments
- Cross-year debt adjustment
- Mentorship burden penalty
- Availability weighting

---

### Softmax Selection (`fairness/softmaxSelection.ts`)

Stochastic team selection with Gumbel-Softmax.

#### Functions
- `selectWithSoftmax(candidates, priorities, teamSize, temperature = 1.0, rng?)` - Select team with temperature
  - `temperature`: 0.1 = greedy, 1.0 = balanced, 5.0 = random
- `selectWithAdaptiveTemperature(candidates, priorities, teamSize, entropyHistory, targetEntropy = 0.7, rng?)` - Auto-adjust temperature
  - Returns: `{ selected, temperature, entropy }`
- `calculateNormalizedEntropy(selections, totalCandidates)` - Measure selection diversity (0-1)
- `gumbelSoftmax(logits, temperature, rng?)` - Gumbel-Softmax sampling

---

### Fairness Constraints (`fairness/fairnessConstraints.ts`)

Constraint checking and validation.

#### FairnessConstraints Interface
```typescript
interface FairnessConstraints {
  maxGiniCoefficient: number;        // Default: 0.25
  maxCoefficientOfVariation: number; // Default: 0.30
  minAssignmentRate: number;         // Default: 0.80
  maxAssignmentRate: number;         // Default: 1.20
}
```

#### Functions
- `checkFairnessConstraints(people, schedules, constraints)` - Check all constraints
  - Returns: `{ satisfied, violations: string[], metrics }`
- `calculateGiniCoefficient(values)` - Measure inequality (0 = perfect equality, 1 = total inequality)
- `calculateCoefficientOfVariation(values)` - Measure variability
- `suggestCorrectiveActions(violations, people, schedules)` - Suggest fixes for violations

---

### Random Utilities (`fairness/random.ts`)

Seeded random number generation.

#### SeededRandom Class
```typescript
class SeededRandom {
  constructor(seed: number)
  random(): number              // [0, 1)
  randomInt(min, max): number   // [min, max]
  randomChoice<T>(array: T[]): T
  shuffle<T>(array: T[]): T[]
  gumbel(): number              // Gumbel distribution sample
}
```

**Usage:** Ensures reproducible tests and debugging.

Calculate selection diversity entropy.

```typescript
function calculateNormalizedEntropy(
  priorities: Map<string, number>
): number
```

**Returns:** Entropy value (0 = deterministic, 1 = uniform)

---

### Fairness Constraints

**Module:** `fairness/fairnessConstraints.ts`

Constraint checking and violation detection.

#### checkFairnessConstraints

Check if assignment distribution satisfies constraints.

```typescript
function checkFairnessConstraints(
  assignmentCounts: Map<string, number>,
  schedulingDays: Map<string, number>,
  constraints: FairnessConstraints
): ConstraintViolation[]
```

**Returns:**

```typescript
interface ConstraintViolation {
  type: 'gini' | 'cv' | 'min_rate' | 'max_rate';
  severity: 'critical' | 'warning';
  message: string;
  actualValue: number;
  threshold: number;
  affectedPeople?: string[];
}
```

---

#### calculateFairnessMetrics

Calculate comprehensive fairness metrics.

```typescript
function calculateFairnessMetrics(
  assignmentCounts: Map<string, number>,
  schedulingDays: Map<string, number>
): FairnessMetrics
```

**Returns:**

```typescript
interface FairnessMetrics {
  giniCoefficient: number;           // 0 = perfect equality
  coefficientOfVariation: number;    // Relative std dev
  meanAssignmentRate: number;        // Average rate
  stdAssignmentRate: number;         // Std deviation
  minAssignmentRate: number;         // Minimum rate
  maxAssignmentRate: number;         // Maximum rate
  totalPeople: number;
  totalAssignments: number;
}
```

---

#### DEFAULT_CONSTRAINTS

Default fairness constraint thresholds.

```typescript
const DEFAULT_CONSTRAINTS: FairnessConstraints = {
  maxGiniCoefficient: 0.25,        // Max inequality
  maxCoefficientOfVariation: 0.30, // Max variability
  minAssignmentRate: 0.8,          // Min relative rate
  maxAssignmentRate: 1.2           // Max relative rate
};
```

---

### Random Utilities

**Module:** `fairness/random.ts`

Seeded PRNG and Gumbel distribution support.

#### SeededRandom

Seeded random number generator class.

```typescript
class SeededRandom {
  constructor(seed: number);
  next(): number;              // [0, 1)
  nextInt(max: number): number; // [0, max)
}
```

---

#### sampleGumbel

Sample from Gumbel distribution.

```typescript
function sampleGumbel(
  loc: number = 0,
  scale: number = 1,
  rng?: SeededRandom
): number
```

---

#### gumbelMaxSample

Sample using Gumbel-Max trick.

```typescript
function gumbelMaxSample(
  logits: number[],
  rng?: SeededRandom
): number
```

**Returns:** Index of sampled element

---

#### gumbelSoftmax

Sample multiple items with Gumbel-Softmax.

```typescript
function gumbelSoftmax(
  logits: number[],
  k: number,
  temperature: number = 1.0,
  rng?: SeededRandom
): number[]
```

**Parameters:**
- `logits`: Log-probabilities
- `k`: Number to sample
- `temperature`: Randomness control

**Returns:** Indices of selected elements

---

## React Components

Main UI components in `src/components/`:

- **App** (`App.tsx`) - Root component with theme and state management
- **PeopleTab** - Person management interface
  - Props: `{ people, schedules, onUpdate }`
- **ScheduleTab** - Schedule generation and viewing
  - Props: `{ people, schedules, onUpdate }`
- **ManualTab** - Manual assignment overrides
  - Props: `{ people, schedules, onUpdate }`
- **DataTab** - Import/export and data management
  - Props: `{ yearData, onImport, onFolderChange }`
- **FolderSelector** - Data folder selection dialog
- **AddPersonDialog** - Person creation dialog

### UI Components (`src/components/ui/`)

Radix UI-based accessible components:
- Alert, AlertDialog, Badge, Button, Card, Checkbox, Dialog, Dropdown, Input, Label, Popover, Select, Separator, Tabs, Textarea

---

## Constants & Configuration

```typescript
// Experience thresholds
EXPERIENCE_DAYS_THRESHOLD = 90
EXPERIENCE_ASSIGNMENTS_THRESHOLD = 4

// Fairness parameters
MENTORSHIP_PENALTY = 0.15
RECENT_WINDOW_WEEKS = 8
CROSS_YEAR_DECAY = 0.8

// Schedule defaults
DEFAULT_TEAM_SIZE = 2
DEFAULT_SUBSTITUTES = 2
MAX_WEEKS = 52

// Constraint defaults
MAX_GINI_COEFFICIENT = 0.25
MAX_COEFFICIENT_OF_VARIATION = 0.30
MIN_ASSIGNMENT_RATE = 0.80
MAX_ASSIGNMENT_RATE = 1.20
```

---

## Best Practices

**Type Safety**: Always use TypeScript types
```typescript
const person: Person = createPerson('Alice', '2025-01-15');
```

**Immutability**: Functions return new objects
```typescript
const updated = updatePerson(person, { name: 'Alice Schmidt' });
```

**Error Handling**: Always check results
```typescript
const result = generateSchedule(options);
if (!result.success) {
  toast.error(result.errors.join(', '));
  return;
}
```

**Date Handling**: Use utility functions
```typescript
const monday = getMonday(parseDate('2025-01-15'));
```

---

## Further Reading

- [Architecture Guide](ARCHITECTURE.md) - System design and algorithms
- [Testing Guide](TESTING.md) - Testing strategies and examples
- [IHK Documentation](IHK_PROJECT.md) - Complete project documentation

---

<div align="center">

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#api-reference)

</div>
