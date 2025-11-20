# Dynamic Fairness System

Mathematical fairness engine with provable convergence guarantees for the plant watering scheduler.

## Overview

This module implements four mathematical frameworks for ensuring long-term fairness:

1. **Penalized Priority** - L4 regularization for aggressive deficit correction
2. **Bayesian Random Walk** - Kalman filter with drift correction
3. **Fairness Constraints** - Mathematical bounds with violation detection
4. **Softmax Selection** - Probability-based selection with temperature control

## Critical Fairness Principle: Rate-Based, Not Cumulative

**The system prevents "catch-up" behavior for new people by measuring fairness as RATE, not cumulative totals.**

### The Problem with Cumulative Fairness

Traditional fairness systems measure cumulative deficits:
```
deficit = expected_total_assignments - actual_total_assignments
```

This creates unfair "catch-up" pressure:
- Alice has been here 100 days, has 10 assignments
- Bob (new) has been here 10 days, has 0 assignments
- System sees Bob is "behind" by 1 assignment
- Bob gets over-scheduled to "catch up" to Alice's cumulative total

### The Solution: Rate-Based Fairness

This system measures assignment RATE (assignments per time in pool):
```
rate = total_assignments / days_in_scheduling_pool
deficit = average_rate - person_rate
```

Fair outcome:
- Alice: 10 assignments / 100 days = 0.1 per day
- Bob: 1 assignment / 10 days = 0.1 per day
- **Both have equal rates → both are treated fairly**

No catch-up needed! New people integrate smoothly.

## Virtual History System

When a person joins after schedules have already been generated, they need a fair starting point.

### Without Virtual History (OLD - causes catch-up)
```
Person A: 100 days, 10 real assignments → rate = 0.1
Person B (new): 1 day, 0 assignments → rate = 0.0
System sees B as "behind" → over-schedules B to catch up
```

### With Virtual History (CURRENT - prevents catch-up)
```
Person B joins when average rate = 0.1 per day
Person B's initial Bayesian state: prior_mean = 0.1 (baseline from existing members)
Person B starts with same expected rate as everyone else
No catch-up pressure - smooth integration
```

### Implementation

The `initializeBayesianStateWithBaseline()` function in `bayesianState.ts` sets new people's initial rate to match the current average:

```typescript
// New person joins existing system
const avgRate = calculateAverageRate(existingPeople);
const state = initializeBayesianStateWithBaseline(
  newPersonId,
  avgRate,  // Start at current average, not zero
  joinDate,
  true      // High uncertainty since no observations yet
);
```

## Installation

```typescript
import { DynamicFairnessEngine, createFairnessEngine } from './fairness';

const engine = createFairnessEngine();
```

## Quick Start

```typescript
// Initialize people
engine.initializePerson('person1', 0.1, '2025-01-01');
engine.initializePerson('person2', 0.1, '2025-01-01');

// Select team
const team = engine.selectTeam(
  ['person1', 'person2', 'person3'],
  [2.5, 1.0, 0.5],  // deficits
  0.02,              // variance
  2                  // team size
);

// Update after assignment
engine.updateAfterAssignment('person1', true, 7, 0.1);

// Check fairness constraints
const { metrics, violations, actions } = engine.checkAndCorrect(
  [0.10, 0.12, 0.08],  // rates
  [1.5, -0.5, 2.0],    // deficits
  [90, 90, 90],        // tenures
  ['p1', 'p2', 'p3']   // person IDs
);
```

## API Reference

### DynamicFairnessEngine

#### Methods

##### `initializePerson(personId, initialRate, date)`
Initialize Bayesian state for a person.

##### `updateAfterAssignment(personId, assigned, daysElapsed, idealRate)`
Update Bayesian state after an assignment decision.

##### `calculatePersonPriority(deficit, tenure): number`
Calculate penalized priority score.

##### `selectTeam(personIds, deficits, variance, teamSize): string[]`
Select team using adaptive temperature softmax.

##### `selectTeamWithTemperature(personIds, deficits, temperature, teamSize): string[]`
Select team with fixed temperature parameter.

##### `checkAndCorrect(rates, deficits, tenures, personIds)`
Check fairness constraints and generate corrective actions.

##### `getPersonConfidenceInterval(personId, confidenceLevel = 0.95)`
Get confidence interval for person's rate estimate.

##### `getCorrectiveAction(personId): CorrectiveAction | null`
Get active corrective action for person.

##### `reset()`
Clear all engine state.

## Mathematical Guarantees

### Convergence Theorem

Under this system:

```
lim(T→∞) [(1/T) · Σ(t=1 to T) (r_i(t) - r̄)] = 0  (w.p. 1)
```

All assignment rates converge to the ideal rate over time.

### Fairness Metrics

- **Gini Coefficient** (target < 0.1): Inequality measure
- **Coefficient of Variation** (target < 0.2): Relative dispersion
- **Theil Index** (target < 0.05): Entropy-based fairness
- **Variance**: Distribution spread

## Configuration

### Default Constraints

```typescript
{
  maxCumulativeDeficit: 2.0,   // B(t) = 2.0 * sqrt(tenure)
  maxVariance: 0.05,            // Maximum rate variance
  rollingWindowWeeks: 26        // 6-month rolling window
}
```

### Temperature Control

```typescript
// Deterministic (always select highest deficit)
engine.selectTeamWithTemperature(ids, deficits, 0.2, 2);

// Balanced
engine.selectTeamWithTemperature(ids, deficits, 1.0, 2);

// Random (more exploration)
engine.selectTeamWithTemperature(ids, deficits, 5.0, 2);
```

## Testing

Run tests:

```bash
npm test fairness
```

Run specific test file:

```bash
npm test fairness/test/penalizedPriority.test.ts
```

## Module Structure

```
fairness/
├── index.ts                    # Main engine
├── types.ts                    # Type definitions
├── penalizedPriority.ts        # L4 penalty system
├── bayesianState.ts            # Kalman filter
├── fairnessConstraints.ts      # Constraint checking
├── softmaxSelection.ts         # Probability selection
└── test/
    ├── penalizedPriority.test.ts
    ├── bayesianState.test.ts
    ├── fairnessConstraints.test.ts
    ├── softmaxSelection.test.ts
    └── integration.test.ts
```

## Performance Characteristics

- **Time Complexity**: O(n) for selection, O(n) for updates
- **Space Complexity**: O(n) for state storage
- **Convergence Rate**: Variance decreases as O(1/√t)

## References

1. Kalman (1960) - Kalman Filtering
2. Boyd & Vandenberghe (2004) - Convex Optimization
3. Dwork et al. (2012) - Fairness Through Awareness
4. Hardt et al. (2016) - Equality of Opportunity

## License

Part of the GießPlan Plant Watering Scheduler project.
