# Architecture Guide

System architecture, design decisions, and fairness algorithms for GießPlan Plant Watering Schedule Management System.

**IHK Abschlussprojekt**: Fachinformatiker/-in für Anwendungsentwicklung  
📄 [Project Documentation](IHK_PROJECT.md)

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Layered Architecture](#layered-architecture)
- [Fairness Engine Design](#fairness-engine-design)
- [Algorithm Details](#algorithm-details)
- [Performance & Security](#performance--security)

---

## System Overview

GießPlan is a single-page React/TypeScript application solving a complex scheduling problem: **fairly distributing weekly plant watering assignments among participants in a high-turnover vocational rehabilitation program**.

### Core Challenges

1. **High Turnover**: 50%+ annual participant turnover
2. **Fair Distribution**: Equitable workload despite varying participation periods
3. **Mentorship**: Pair experienced participants with newcomers
4. **Temporal Fairness**: Consider historical and future assignments
5. **Multi-Year Tracking**: Maintain fairness across calendar boundaries
6. **Stochastic Balance**: Avoid deterministic patterns while ensuring fairness

### Solution: Bayesian Fairness Engine

- **Bayesian Random Walk**: Probabilistic state tracking
- **Penalized Priority**: Time-weighted fairness scoring
- **Gumbel-Softmax Selection**: Controlled stochastic team selection
- **Constraint Checking**: Automated violation detection
- **Corrective Actions**: Automatic equity compensation

---

## Architecture Principles

1. **Separation of Concerns**: Presentation → Business Logic → Fairness Engine → Data Persistence
2. **Immutability**: Functional programming style, all updates return new objects
3. **Type Safety**: Comprehensive TypeScript typing throughout
4. **Testability**: Pure functions preferred, seeded randomness for reproducibility
5. **Progressive Enhancement**: Fairness features with feature flags

---

## Layered Architecture

### Layer 1: React UI (`src/components/`, `src/App.tsx`)

**Responsibilities**: User interaction, rendering, form validation, real-time feedback

**Components**:
- `App.tsx` - Application shell, routing, theme
- `PeopleTab.tsx` - Person management
- `ScheduleTab.tsx` - Schedule viewing/generation
- `ManualTab.tsx` - Manual overrides
- `DataTab.tsx` - Import/export

**Tech**: React 19 • TailwindCSS • Radix UI • Lucide icons  
**State**: Local `useState`, custom hooks, no global state library

---

### Layer 2: Business Logic (`src/lib/`)

**Responsibilities**: Schedule orchestration, person lifecycle, validation, date manipulation

**Key Modules**:

```typescript
// scheduleEngine.ts - Schedule generation orchestration
generateSchedule(options) {
  // 1. Validate → 2. Init fairness → 3. For each week: calculate priorities,
  // select team, update state → 4. Validate constraints → 5. Return
}

// personManager.ts - Person CRUD
createPerson(name, arrivalDate) {
  // Generate UUID → Create period → Init metrics → Return
}

// adaptiveFairness.ts - Fairness subsystem coordination
class AdaptiveFairnessManager {
  // Coordinates: Bayesian state, priority, selection, constraints
}
```

---

### Layer 3: Fairness Engine (`fairness/`)

**Responsibilities:**
- Bayesian state management
- Fairness priority calculation
- Stochastic team selection
- Constraint violation detection
- Corrective action generation

**Design Philosophy:**
- **Separate from business logic** for testability
- **Modular subsystems** that can be independently tested
- **Configurable constraints** for different use cases
- **Reproducible randomness** with seeded PRNGs

**Subsystems:**

```
DynamicFairnessEngine
├── BayesianState (bayesianState.ts)
│   └── Random Walk state tracking
├── PenalizedPriority (penalizedPriority.ts)
│   └── Fairness scoring with penalties
├── SoftmaxSelection (softmaxSelection.ts)
│   └── Stochastic team selection
├── FairnessConstraints (fairnessConstraints.ts)
│   └── Violation detection
└── Random (random.ts)
    └── Seeded PRNG utilities
```

---

### Layer 4: Data Persistence

**Location:** `src/lib/fileStorage.ts`

**Responsibilities:**
- File system interaction
- JSON serialization/deserialization
- Export format conversion
- Backup/restore

**Storage Strategy:**
- **File-based JSON**: One file per year (`yearData_2025.json`)
- **User-selected folder**: Via File System Access API
- **No cloud dependency**: Fully local, privacy-first
- **Human-readable**: JSON for transparency

**File Structure:**

```json
{
  "year": 2025,
  "people": [...],
  "schedules": [...],
  "lastModified": "2025-12-02T10:30:00Z"
}
```

---

## Data Flow

### Schedule Generation Flow

```
User Input (UI)
    ↓
Validate Options (scheduleEngine)
    ↓
Initialize Fairness Manager (adaptiveFairness)
    ↓
For Each Week:
    ↓
┌──────────────────────────────────────┐
│ 1. Get Active People                 │
│ 2. Calculate Priorities              │
│    ├─ Bayesian State                 │
│    ├─ Historical Assignments         │
│    ├─ Mentorship Burden              │
│    └─ Cross-Year Debt                │
│                                      │
│ 3. Select Team (Softmax)             │
│    ├─ Apply Temperature              │
│    ├─ Gumbel-Max Sampling           │
│    └─ Ensure Mentor                  │
│                                      │
│ 4. Select Substitutes                │
│                                      │
│ 5. Update Fairness State             │
│    ├─ Increment Assignments          │
│    ├─ Update Bayesian State          │
│    └─ Track Selection History        │
└──────────────────────────────────────┘
    ↓
Validate Constraints (fairnessConstraints)
    ↓
Check Violations
    ↓
Apply Corrective Actions (if needed)
    ↓
Return Schedule or Errors
    ↓
Save to File (fileStorage)
    ↓
Update UI
```

### Person Lifecycle Flow

```
User Creates Person
    ↓
Validate Data (personManager)
    ↓
Create Person Object
    ├─ Generate UUID
    ├─ Create Time Period
    └─ Initialize Metrics
    ↓
Add to People Array
    ↓
Save to File
    ↓
Update UI

[Later: Person Departure]
    ↓
Mark Departure (personManager)
    ├─ Close Current Period
    ├─ Set Actual Departure Date
    └─ Record Reason
    ↓
Save to File
    ↓
Update UI

[Later: Person Return]
    ↓
Mark Return (personManager)
    ├─ Create New Time Period
    └─ Clear Departure Date
    ↓
Save to File
    ↓
Update UI
```

---

## Fairness Engine Design

### Philosophical Foundation

The fairness engine is based on **temporal fairness** - the principle that assignment burden should be proportional to time available for assignments.

**Key Insight:** A person present for 100 days should have approximately 2x the assignments of someone present for 50 days.

### Mathematical Model

#### 1. Bayesian Random Walk

Each person has a latent "assignment rate" that evolves over time:

```
θ_t ~ N(μ_t, σ_t²)
```

Where:
- `θ_t` = true assignment rate at time t
- `μ_t` = posterior mean (expected rate)
- `σ_t²` = posterior variance (uncertainty)

**Update Rule (Bayesian):**

```
Prior: θ ~ N(μ_prior, σ_prior²)
Observation: r_obs (observed rate)
Posterior: θ | r_obs ~ N(μ_post, σ_post²)

μ_post = (σ_obs² * μ_prior + σ_prior² * r_obs) / (σ_prior² + σ_obs²)
σ_post² = (σ_prior² * σ_obs²) / (σ_prior² + σ_obs²)
```

**Implementation:**

```typescript
function updateBayesianState(
  state: BayesianState,
  observedRate: number,
  date: string
): BayesianState {
  const observationVariance = 0.01; // Fixed obs variance
  
  const posteriorVariance = 
    (state.sigma ** 2 * observationVariance) /
    (state.sigma ** 2 + observationVariance);
    
  const posteriorMean =
    (observationVariance * state.mu + state.sigma ** 2 * observedRate) /
    (state.sigma ** 2 + observationVariance);
    
  return {
    ...state,
    mu: posteriorMean,
    sigma: Math.sqrt(posteriorVariance),
    observations: state.observations + 1,
    lastUpdated: date
  };
}
```

#### 2. Penalized Priority

Priority score combines multiple fairness factors:

```
Priority = BasePriority × MentorPenalty × RecencyBonus × DebtBonus

Where:
  BasePriority = 1 / (currentRate + ε)
  MentorPenalty = isMentor ? (1 - 0.15) : 1.0
  RecencyBonus = 1 + (recentGap / avgGap)
  DebtBonus = 1 + (crossYearDebt × 0.8)
```

**Implementation:**

```typescript
function calculatePenalizedPriority(
  personId: string,
  bayesianState: BayesianState,
  schedulingDays: number,
  totalAssignments: number,
  isMentor: boolean,
  recentAssignments: number,
  crossYearDebt: number
): number {
  // Base: inverse of current rate (lower rate = higher priority)
  const currentRate = bayesianState.mu;
  const basePriority = 1 / (currentRate + 0.001);
  
  // Mentor penalty (reduce priority for mentors)
  const mentorPenalty = isMentor ? 0.85 : 1.0;
  
  // Recency bonus (boost if underassigned recently)
  const expectedRecent = (recentWindow / schedulingDays) * totalAssignments;
  const recencyBonus = 1 + Math.max(0, expectedRecent - recentAssignments);
  
  // Cross-year debt bonus
  const debtBonus = 1 + (crossYearDebt * 0.8);
  
  return basePriority * mentorPenalty * recencyBonus * debtBonus;
}
```

#### 3. Gumbel-Softmax Selection

Stochastic selection with controlled randomness:

```
Gumbel-Max Trick:
  g_i ~ Gumbel(0, 1)
  score_i = log(priority_i) + g_i / temperature
  select = argmax(score_i)
```

**Temperature Control:**
- `T → 0`: Deterministic (always select highest priority)
- `T = 1`: Balanced stochasticity
- `T → ∞`: Uniform random

**Implementation:**

```typescript
function gumbelMaxSample(
  logits: number[],
  rng?: SeededRandom
): number {
  const gumbelNoise = logits.map(() => sampleGumbel(0, 1, rng));
  const perturbedLogits = logits.map((l, i) => l + gumbelNoise[i]);
  return argmax(perturbedLogits);
}

function selectWithSoftmax(
  candidates: string[],
  priorities: Map<string, number>,
  teamSize: number,
  temperature: number = 1.0,
  rng?: SeededRandom
): string[] {
  const logits = candidates.map(c => 
    Math.log(priorities.get(c) || 0.001) / temperature
  );
  
  return gumbelSoftmax(logits, teamSize, temperature, rng)
    .map(idx => candidates[idx]);
}
```

#### 4. Constraint Checking

Fairness constraints ensure acceptable distribution:

**Gini Coefficient** (inequality measure):

```
G = (Σ Σ |x_i - x_j|) / (2n² * mean(x))

Threshold: G ≤ 0.25
```

**Coefficient of Variation** (relative std dev):

```
CV = σ / μ

Threshold: CV ≤ 0.30
```

**Min/Max Rates** (relative to mean):

```
minRate ≥ 0.8 * meanRate
maxRate ≤ 1.2 * meanRate
```

**Implementation:**

```typescript
function checkFairnessConstraints(
  assignmentCounts: Map<string, number>,
  schedulingDays: Map<string, number>,
  constraints: FairnessConstraints
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  
  // Calculate rates
  const rates = Array.from(assignmentCounts.entries()).map(
    ([id, count]) => count / (schedulingDays.get(id) || 1)
  );
  
  // Check Gini
  const gini = calculateGini(rates);
  if (gini > constraints.maxGiniCoefficient) {
    violations.push({
      type: 'gini',
      severity: 'critical',
      message: `Gini coefficient ${gini.toFixed(3)} exceeds ${constraints.maxGiniCoefficient}`,
      actualValue: gini,
      threshold: constraints.maxGiniCoefficient
    });
  }
  
  // Check CV
  const cv = calculateCV(rates);
  if (cv > constraints.maxCoefficientOfVariation) {
    violations.push({
      type: 'cv',
      severity: 'warning',
      message: `CV ${cv.toFixed(3)} exceeds ${constraints.maxCoefficientOfVariation}`,
      actualValue: cv,
      threshold: constraints.maxCoefficientOfVariation
    });
  }
  
  // Check min/max rates
  const mean = rates.reduce((a, b) => a + b) / rates.length;
  rates.forEach((rate, idx) => {
    if (rate < constraints.minAssignmentRate * mean) {
      violations.push({ /* min rate violation */ });
    }
    if (rate > constraints.maxAssignmentRate * mean) {
      violations.push({ /* max rate violation */ });
    }
  });
  
  return violations;
}
```

---

## Algorithm Details

### Virtual History for New Participants

**Problem:** New joiners have no assignment history, causing over-assignment.

**Solution:** Virtual history initialization

```typescript
// Calculate average rate of existing participants
const existingRates = people
  .filter(p => getAssignmentCount(p) > 0)
  .map(p => getAssignmentCount(p) / getDaysPresent(p));

const avgRate = mean(existingRates);

// Initialize new person with average rate
initializeBayesianState(newPerson.id, avgRate, joinDate);
```

**Effect:** New person starts with "average" fairness debt, preventing over-selection.

---

### Mentor-Mentee Pairing

**Requirement:** Each team must have ≥1 experienced person.

**Algorithm:**

```typescript
function selectTeamWithMentor(
  candidates: string[],
  priorities: Map<string, number>,
  teamSize: number,
  mentors: Set<string>
): string[] {
  // 1. Ensure at least one mentor available
  const availableMentors = candidates.filter(c => mentors.has(c));
  if (availableMentors.length === 0) {
    throw new Error('No mentors available');
  }
  
  // 2. Select first team member from mentors only
  const selectedMentor = selectWithSoftmax(
    availableMentors,
    priorities,
    1,
    temperature
  )[0];
  
  // 3. Select remaining team members from all candidates
  const remaining = candidates.filter(c => c !== selectedMentor);
  const restOfTeam = selectWithSoftmax(
    remaining,
    priorities,
    teamSize - 1,
    temperature
  );
  
  return [selectedMentor, ...restOfTeam];
}
```

---

### No Consecutive Weeks

**Requirement:** Prevent same person in back-to-back weeks.

**Algorithm:**

```typescript
function enforceNoConsecutive(
  candidates: string[],
  lastWeekAssigned: Set<string>
): string[] {
  // Filter out people assigned last week
  return candidates.filter(c => !lastWeekAssigned.has(c));
}
```

**Edge Case:** If filtered list is too small (< teamSize + substitutes):

```
1. Warn user
2. Allow consecutive assignment for fairness
3. Log warning in schedule
```

---

### Cross-Year Fairness Tracking

**Problem:** Fairness resets at year boundary, causing inequity.

**Solution:** Cross-year fairness debt

```typescript
interface FairnessMetrics {
  crossYearFairnessDebt: number; // Carried from previous year
}

// At year transition
function calculateCrossYearDebt(
  person: Person,
  prevYearSchedules: Schedule[]
): number {
  const expectedAssignments = /* based on time present */;
  const actualAssignments = getAssignmentCount(person, prevYearSchedules);
  
  // Debt = underassignment (positive) or overassignment (negative)
  return expectedAssignments - actualAssignments;
}

// In priority calculation
priority *= (1 + crossYearDebt * DECAY_FACTOR);
```

**Decay Factor (0.8):** Prevents perpetual debt accumulation.

---

## State Management

### React State

**Component-Level State:**

```typescript
function ScheduleTab() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  
  // ...
}
```

**Custom Hooks:**

```typescript
function useLocalKV<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue] as const;
}
```

**No Global State Library:**
- Kept intentionally simple
- Props passed through component tree
- File storage acts as "database"

---

### Fairness Engine State

**Bayesian States (per person):**

```typescript
class DynamicFairnessEngine {
  private bayesianStates: Map<string, BayesianState>;
  
  // Updated after each assignment
  updateAfterAssignment(personId: string, assigned: boolean, date: string) {
    const state = this.bayesianStates.get(personId);
    const newObservation = assigned ? 1.0 : 0.0;
    const updatedState = updateBayesianState(state, newObservation, date);
    this.bayesianStates.set(personId, updatedState);
  }
}
```

**Accumulated Assignments (during generation):**

```typescript
class AdaptiveFairnessManager {
  private accumulatedAssignments: Map<string, number>;
  
  // Tracks assignments during multi-week generation
  // Prevents same person being selected every week
}
```

---

## Persistence Strategy

### File System Access API

Modern browser API for local file access:

```typescript
async function selectDataFolder(): Promise<boolean> {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    
    // Store handle for later use
    await setStorageItem('dataFolderHandle', dirHandle);
    return true;
  } catch (e) {
    return false; // User cancelled
  }
}
```

**Benefits:**
- No server required
- User maintains full control
- Privacy-first (data never leaves device)
- Easy backup (just copy folder)

**Limitations:**
- Browser support (Chrome, Edge, Safari 15.2+)
- No mobile browser support
- Permission prompts

---

### JSON Schema

**YearData File Structure:**

```json
{
  "year": 2025,
  "people": [
    {
      "id": "uuid-1234",
      "name": "Alice Schmidt",
      "arrivalDate": "2025-01-15",
      "expectedDepartureDate": "2025-12-31",
      "actualDepartureDate": null,
      "programPeriods": [
        {
          "startDate": "2025-01-15",
          "endDate": null,
          "departureReason": null
        }
      ],
      "experienceLevel": "new",
      "mentorshipAssignments": [],
      "fairnessMetrics": {
        "person": "Alice Schmidt",
        "temporalFairnessScore": 1.0,
        "assignmentsPerDayPresent": 0.0145,
        "crossYearFairnessDebt": -1.2,
        "mentorshipBurdenScore": 0.0,
        "recentAssignmentBalance": 1.0,
        "lastUpdated": "2025-12-02T10:30:00Z"
      }
    }
  ],
  "schedules": [
    {
      "id": "schedule-uuid",
      "startDate": "2025-01-06",
      "weeks": 12,
      "createdAt": "2025-01-01T08:00:00Z",
      "assignments": [
        {
          "weekNumber": 1,
          "weekStartDate": "2025-01-06",
          "assignedPeople": ["uuid-1234", "uuid-5678"],
          "substitutes": ["uuid-9012", "uuid-3456"],
          "fairnessScores": [1.05, 0.98],
          "hasMentor": true,
          "comment": null,
          "isEmergency": false
        }
      ]
    }
  ],
  "lastModified": "2025-12-02T10:30:00Z"
}
```

---

## Performance Considerations

### Computational Complexity

**Schedule Generation:**

```
Time Complexity: O(W × P²)

Where:
  W = number of weeks
  P = number of active people

Breakdown:
- For each week (W):
  - Calculate priorities (O(P))
  - Softmax selection (O(P log P))
  - Constraint checking (O(P²))
```

**Stress Test Results:**

| People | Weeks | Generation Time |
|--------|-------|-----------------|
| 10     | 25    | ~50ms          |
| 50     | 52    | ~500ms         |
| 100    | 52    | ~2s            |

**Optimization Strategies:**

1. **Memoization**: Cache fairness calculations
2. **Early Termination**: Stop if constraints violated
3. **Incremental Updates**: Only recalculate changed metrics

---

### Memory Usage

**Typical Memory Footprint:**

```
YearData (100 people, 52 weeks):
  - People: ~100 KB
  - Schedules: ~500 KB
  - Total: ~600 KB

In-Memory Structures:
  - Bayesian States: ~10 KB
  - Priority Map: ~5 KB
  - Selection History: ~20 KB
```

**Optimization:**
- JSON compression for exports
- Lazy loading of historical data
- Garbage collection of old schedules

---

## Security & Privacy

### Data Privacy

**Privacy-First Design:**
- ✅ All data stored locally
- ✅ No server communication
- ✅ No analytics or tracking
- ✅ No user accounts
- ✅ User controls data folder

**GDPR Compliance:**
- User consent via folder selection
- Right to erasure (delete folder)
- Data portability (JSON export)
- No data processing by third parties

---

### Input Validation

**All user inputs validated:**

```typescript
function validatePersonData(data: Partial<Person>) {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Name required');
  }
  
  if (!data.arrivalDate) {
    errors.push('Arrival date required');
  }
  
  if (data.expectedDepartureDate) {
    if (new Date(data.expectedDepartureDate) <= new Date(data.arrivalDate)) {
      errors.push('Departure must be after arrival');
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

### Error Handling

**Defensive Programming:**

```typescript
try {
  const schedule = generateSchedule(options);
  return schedule;
} catch (error) {
  console.error('Generation failed:', error);
  toast.error('Schedule generation failed. Please try again.');
  
  // Log to local storage for debugging
  logError({
    context: 'generateSchedule',
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  return null;
}
```

---

## Scalability

### Current Limits

**Tested Scenarios:**
- ✅ 100 people, 52 weeks
- ✅ 50% annual turnover
- ✅ 10,000+ total assignments

**Theoretical Limits:**
- **People**: 500+ (performance degrades)
- **Weeks**: 104 (2 years)
- **Schedules**: Unlimited (stored separately)

---

### Scaling Strategies

**For Larger Deployments:**

1. **Database Backend**: Replace file storage with SQLite/PostgreSQL
2. **Web Workers**: Offload computation to background threads
3. **Pagination**: Load schedules on-demand
4. **Caching**: Redis for frequently accessed data
5. **Server-Side Generation**: Move computation to server

**Multi-Instance Support:**

```
Current: Single-user desktop app
Future: Multi-tenant web service
  - User authentication
  - Organization separation
  - Role-based access control
  - Real-time collaboration
```

---

## Future Architecture

### Planned Enhancements

#### 1. Cloud Synchronization (Optional)

```
Local Storage ←→ Cloud Sync (optional)
  ↓                    ↓
File System        Cloud Storage
                   (user's choice)
```

**Benefits:**
- Multi-device access
- Automatic backups
- Sharing capabilities

**Challenges:**
- Maintain privacy-first approach
- Handle sync conflicts
- Support offline mode

---

#### 2. Real-Time Collaboration

```
User A ←→ WebSocket Server ←→ User B
  ↓              ↓              ↓
Local         Central         Local
Cache          State          Cache
```

**Features:**
- Live schedule updates
- Conflict resolution
- Change history
- User presence

---

#### 3. Machine Learning Enhancements

**Predictive Analytics:**

```typescript
// Predict departure dates
function predictDeparture(person: Person): Date {
  // ML model based on:
  // - Historical tenure data
  // - Program completion rates
  // - Seasonal patterns
}

// Optimize team composition
function optimizeTeamSkills(
  people: Person[],
  requiredSkills: Skill[]
): string[] {
  // Multi-objective optimization:
  // - Fairness
  // - Skill coverage
  // - Learning opportunities
}
```

---

#### 4. Multi-Task Support

```typescript
interface Task {
  id: string;
  name: string;
  requiredPeople: number;
  requiredSkills: Skill[];
  frequency: 'weekly' | 'biweekly' | 'monthly';
}

// Generate schedules for multiple tasks
function generateMultiTaskSchedule(
  tasks: Task[],
  people: Person[],
  weeks: number
): MultiTaskSchedule
```

---

## Design Patterns

### Factory Pattern

```typescript
function createFairnessEngine(
  constraints: FairnessConstraints,
  seed?: number
): DynamicFairnessEngine {
  return new DynamicFairnessEngine(constraints, seed);
}
```

### Strategy Pattern

```typescript
interface SelectionStrategy {
  select(candidates: string[], priorities: Map<string, number>): string[];
}

class SoftmaxSelection implements SelectionStrategy { }
class GreedySelection implements SelectionStrategy { }
class RandomSelection implements SelectionStrategy { }
```

### Observer Pattern

```typescript
// React's built-in observer (useState/useEffect)
useEffect(() => {
  console.log('Schedules changed:', schedules);
}, [schedules]);
```

### Builder Pattern

```typescript
const schedule = new ScheduleBuilder()
  .startDate('2025-01-06')
  .weeks(12)
  .people(activePeople)
  .enforceNoConsecutive(true)
  .requireMentor(true)
  .build();
```

---

## Testing Architecture

### Test Pyramid

```
      /\
     /  \    10 E2E Tests
    /----\
   /      \  50 Integration Tests
  /--------\
 /          \ 100 Unit Tests
/____________\
```

**Unit Tests** (fairness/, lib/):
- Pure function testing
- Edge case coverage
- Deterministic results

**Integration Tests** (Test/):
- Full workflow testing
- Multi-component interaction
- Realistic scenarios

**Stress Tests** (Test/stress-*.test.ts):
- Performance validation
- Extreme scenarios
- Long-running simulations

---

## Conclusion

The GießPlan architecture balances:

- **Simplicity**: No unnecessary complexity
- **Sophistication**: Advanced fairness algorithms where needed
- **Performance**: Fast enough for real-world use
- **Privacy**: User data stays local
- **Testability**: Comprehensive test coverage
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add features

The system demonstrates that sophisticated scheduling algorithms can be implemented in a browser-based application without sacrificing user experience or data privacy.

---

<div align="center">

**Questions about architecture?** [Open a discussion](https://github.com/Krialder/gieplan-plant-watering-scheduler/discussions)

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#architecture-guide)

</div>
