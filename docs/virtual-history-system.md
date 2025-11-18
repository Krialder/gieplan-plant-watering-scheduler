# Virtual History System

## Overview

The virtual history system ensures that new people joining the scheduling system start at a fair baseline rather than at zero. This is a **one-time** adjustment made when a person is created, giving them a permanent virtual assignment count that puts them on equal footing with existing people.

## How It Works

### 1. **One-Time Calculation at Person Creation**

When a new person is created via `createPerson()`, the system:

1. Checks if any schedules already exist
2. If yes, calculates the average assignment rate of existing people
3. Determines how many "scheduling days" the new person has missed
4. Gives them virtual assignments = `average_rate × missed_days`
5. Stores this as **permanent virtual history** in the person object

### 2. **Virtual History Structure**

```typescript
interface VirtualHistory {
  virtualAssignments: number;      // Virtual assignments (permanent baseline)
  baselineDate: string;            // Date used for calculation
  averageRateAtCreation: number;   // Average rate when created
}
```

### 3. **Integration with Fairness System**

The virtual assignments work together with real assignments:

- **Historical Count** = Real Assignments + Virtual Assignments
- **Accumulated Count** = New assignments during current generation
- **Total Count** = Historical + Accumulated

This means:
- Virtual history is a **permanent baseline** set once at creation
- Real assignments **accumulate on top** of the virtual baseline
- The system sees the total, treating the person fairly

## Example Scenario

### Scenario: New Person Joins After 10 Weeks

```typescript
// Week 0: Three people start
const alice = createPerson('Alice', '2025-01-01');
const bob = createPerson('Bob', '2025-01-01');
const charlie = createPerson('Charlie', '2025-01-01');

// Weeks 1-10: Generate schedules (each person gets ~5 assignments)
generateSchedule({ people: [alice, bob, charlie], weeks: 10 });

// Week 11: David joins
const david = createPerson(
  'David', 
  '2025-03-17',
  null,
  [alice, bob, charlie],  // Existing people
  [schedule]               // Existing schedules
);

// David's virtual history:
// - Average rate: ~0.07 assignments/day (15 assignments / 210 person-days)
// - Missed days: 71 days (from first schedule to his arrival)
// - Virtual assignments: ~0.07 × 1 = 0.07 assignments

// This puts David close to the average, not at zero!
```

### Result

| Person  | Virtual | Real | Total | Rate      |
|---------|---------|------|-------|-----------|
| Alice   | 0       | 5    | 5     | 0.0704/day|
| Bob     | 0       | 5    | 5     | 0.0704/day|
| Charlie | 0       | 5    | 5     | 0.0704/day|
| David   | 0.07    | 0    | 0.07  | 0.0704/day|

David starts at approximately the same **rate** as everyone else, even though he has fewer total assignments.

## When Virtual History is NOT Created

Virtual history is only created when:
1. ✅ Schedules already exist
2. ✅ At least one person has assignments

No virtual history if:
- ❌ No schedules exist yet (everyone starts fresh)
- ❌ Schedules exist but no one has been assigned yet

## Key Benefits

1. **Fair Onboarding**: New people don't start at a disadvantage
2. **One-Time Adjustment**: Set once, never recalculated
3. **Transparent**: Stored in person object, visible in calculations
4. **Proportional**: Based on actual average rate, not arbitrary
5. **Works with Existing System**: Seamlessly integrates with fairness algorithms

## Implementation Details

### Person Creation

```typescript
// In personManager.ts
export function createPerson(
  name: string,
  arrivalDate: string,
  expectedDepartureDate: string | null = null,
  existingPeople: Person[] = [],
  existingSchedules: Schedule[] = []
): Person {
  // ... create person ...
  
  // Calculate virtual history
  const virtualHistory = calculateVirtualHistory(
    arrivalDate, 
    existingPeople, 
    existingSchedules
  );
  
  return {
    // ... other fields ...
    virtualHistory  // Stored in person object
  };
}
```

### Fairness Calculations

```typescript
// In adaptiveFairness.ts
const realAssignments = getPersonAssignmentCount(person, schedules);
const virtualAssignments = person.virtualHistory?.virtualAssignments || 0;
const totalAssignments = realAssignments + virtualAssignments;

// Use totalAssignments for all fairness calculations
```

## Testing

Run the virtual history test suite:

```bash
npm test -- virtual-history.test.ts
```

This verifies:
- ✅ Virtual history is calculated correctly
- ✅ No virtual history when inappropriate
- ✅ Virtual history remains permanent
- ✅ Real assignments accumulate on top

## Technical Notes

### Why "Scheduling Days" Not "Tenure Days"?

The system uses **scheduling days** (days since first plan generation) rather than **tenure days** (days since person joined). This is because:

1. People can only be assigned starting from the first schedule generation
2. Everyone's "clock" starts at the same time (first generation)
3. This makes fairness calculations more accurate

### Backwards Compatibility

People created before this feature have no `virtualHistory` field. The system handles this gracefully:

```typescript
const virtualCount = person.virtualHistory?.virtualAssignments || 0;
```

Missing virtual history is treated as 0, maintaining compatibility.

## Summary

The virtual history system is a **one-time baseline adjustment** that ensures new people start at a fair position relative to existing people. It's:

- 🎯 **Calculated once** at person creation
- 📊 **Based on average rate** of existing people  
- 💾 **Stored permanently** in person object
- ➕ **Added to real assignments** for total count
- 🔄 **Never recalculated** - it's a fixed baseline

This ensures fairness without penalizing new joiners or giving unfair advantages.
