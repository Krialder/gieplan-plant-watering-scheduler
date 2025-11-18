# Dynamic Fairness System

Mathematical fairness engine with provable convergence guarantees for the plant watering scheduler.

## Overview

This module implements four mathematical frameworks for ensuring long-term fairness:

1. **Penalized Priority** - L4 regularization for aggressive deficit correction
2. **Bayesian Random Walk** - Kalman filter with drift correction
3. **Fairness Constraints** - Mathematical bounds with violation detection
4. **Softmax Selection** - Probability-based selection with temperature control

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
