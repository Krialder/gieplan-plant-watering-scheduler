# Mathematical Analysis: New Person Fairness Problem

## Problem Statement

When a new person joins an existing watering schedule system, they are getting assigned **too frequently**, resulting in a higher assignment rate than existing people. We need a mathematically sound solution that ensures:

1. **Rate equality**: All people converge to the same `assignments/day` ratio
2. **No history requirement**: New people don't need fake history or virtual assignments
3. **Long-term stability**: The solution works over years, not just weeks
4. **Smooth integration**: No abrupt transitions or discontinuities

---

## Current System Behavior

### Test Case Data

**Initial State (3 existing people, 10 weeks):**
- Hugs, Kompono, Jay each joined: 2025-01-01
- Schedule generated: 2025-11-18 (322 days later)
- Each receives: 5 assignments
- Rate: `5/322 = 0.0155` assignments/day

**New Person Joins:**
- Neu joins: 2025-11-18
- Second schedule starts: 2026-01-27 (70 days after Neu joins)
- Period: 10 more weeks (70 days)

**Expected Outcome (for rate equality):**
```
Existing people: 462 total days, rate 0.0155 → ~7.2 assignments each
New person:     141 total days, rate 0.0155 → ~2.2 assignments
```

**Actual Outcome:**
```
Existing people: 10 assignments each (rate: 10/462 = 0.0216)
New person:       5 assignments    (rate:  5/141 = 0.0355) ❌
```

**Problem:** Neu's rate is **64% higher** than the others!

---

## Mathematical Root Cause

### Current Formula (Rate-Based Fairness)

```typescript
systemRate = totalAssignments / totalSchedulingDays
expected_i = schedulingDays_i × systemRate
deficit_i = expected_i - actual_i
priority_i = f(deficit_i)
```

### Why This Fails for New People

During the second generation (10 weeks), let's trace week 1:

**Week 1 (2026-01-27):**

Participating people at start: Hugs, Kompono, Jay (Neu has 0 assignments so excluded from rate calc)

```
totalSchedulingDays = 392 + 392 + 392 = 1176 days (3 people)
totalAssignments = 5 + 5 + 5 = 15 assignments
systemRate = 15 / 1176 = 0.01276 assignments/day
```

For Neu (70 days since joining):
```
expected_Neu = 70 × 0.01276 = 0.893 assignments
actual_Neu = 0 assignments
deficit_Neu = 0.893 - 0 = +0.893 (POSITIVE)
```

For existing people (392 days):
```
expected_existing = 392 × 0.01276 = 5.00 assignments
actual_existing = 5 assignments
deficit_existing = 5.00 - 5 = 0.00 (NEUTRAL)
```

**Result:** Neu has highest deficit → gets selected!

**After Neu gets 1 assignment:**
Now Neu is "participating" (has accumulated assignment), so they're included in rate calculation:

```
totalSchedulingDays = 392 + 392 + 392 + 70 = 1246 days
totalAssignments = 5 + 5 + 5 + 1 = 16 assignments
systemRate = 16 / 1246 = 0.01284 assignments/day
```

For week 2, Neu has 77 days:
```
expected_Neu = 77 × 0.01284 = 0.989 assignments
actual_Neu = 1 assignment
deficit_Neu = 0.989 - 1 = -0.011 (slightly negative)
```

But existing people also have small deficits, and as weeks progress, Neu's scheduling days grow faster than their assignments, keeping them in the high-priority group.

---

## The Core Mathematical Issue

The formula `expected = schedulingDays × systemRate` has a **hidden bias** for people with fewer scheduling days:

### Relative Deficit Magnitude

For person with `d` scheduling days and system rate `r`:
```
expected = d × r
deficit = d × r - assignments
relative_deficit = deficit / d = r - (assignments / d)
```

The **absolute deficit** grows linearly with `d`, but the **selection** is based on absolute deficit (via penalized priority).

### Growth Rate Problem

During an N-week generation period:
- Existing person: `schedulingDays` grows by N×7 days
- New person: `schedulingDays` ALSO grows by N×7 days
- But new person starts with small base, so N×7 is a **larger percentage** of their total

This creates a **compound interest effect** where new people accumulate deficit faster relative to their base.

---

## Mathematical Solution

### Option 1: Normalize by Scheduling Days (Relative Deficit)

Instead of using absolute deficit, use **relative deficit**:

```typescript
expected_i = schedulingDays_i × systemRate
deficit_i = expected_i - actual_i
relative_deficit_i = deficit_i / schedulingDays_i
priority_i = f(relative_deficit_i)
```

**This equalizes the "need per day" rather than absolute need.**

### Option 2: Fixed Target Rate (Established People Only)

Calculate system rate from people who have been present for "significant" time (e.g., ≥ 14 days):

```typescript
establishedPeople = people.filter(p => schedulingDays(p) >= 14)
systemRate = sum(assignments(p)) / sum(schedulingDays(p)) for p in establishedPeople

// Use this FIXED rate for everyone
expected_i = schedulingDays_i × systemRate
```

**Problem:** Once new person reaches 14 days, they affect the rate calculation and the problem persists.

### Option 3: Initial Deficit Offset (Bootstrap Fairness)

Give new people a **negative initial deficit** as if they already received their fair share:

```typescript
if (schedulingDays_i < threshold AND historicalAssignments == 0):
    // Assume they already got systemRate assignments per day
    expected_i = schedulingDays_i × systemRate
    // But credit them as if they already received that amount
    deficit_i = expected_i - (actual_i + OFFSET)
    where OFFSET = systemRate × schedulingDays_i × 0.5
    // Effectively: deficit = -0.5 × expected
```

This gives them **negative deficit initially**, preventing immediate selection.

---

## Recommended Solution: **Relative Deficit with Minimum Threshold**

### Formula

```typescript
// 1. Calculate system rate from ALL participating people
systemRate = totalAssignments / totalSchedulingDays

// 2. Calculate expected and deficit normally
expected_i = schedulingDays_i × systemRate
deficit_i = expected_i - actual_i

// 3. Normalize deficit by scheduling days (relative need)
relative_deficit_i = deficit_i / max(schedulingDays_i, MIN_DAYS)
where MIN_DAYS = 7  // Prevents division by very small numbers

// 4. Calculate priority from relative deficit
priority_i = f(relative_deficit_i)
```

### Why This Works

1. **Equal opportunity:** People with 10 days and 0 assignments have same relative need as people with 100 days and 0 assignments
2. **Proportional growth:** As scheduling days increase, absolute deficit must also increase proportionally to maintain same priority
3. **No discontinuity:** Works from day 1 through years
4. **Mathematically sound:** Treats deficit as a **rate** (deficit per day) rather than absolute value

### Proof of Fairness

For perfect fairness, all people should have:
```
assignments_i / schedulingDays_i = systemRate (constant)
```

Rearranging:
```
assignments_i = schedulingDays_i × systemRate = expected_i
deficit_i = 0
relative_deficit_i = 0
```

**Therefore, when everyone has relative_deficit = 0, the system is in perfect equilibrium.**

### Example

Week 1 of second generation:

**Existing person (392 days, 5 assignments):**
```
expected = 392 × 0.01276 = 5.00
deficit = 5.00 - 5 = 0.00
relative_deficit = 0.00 / 392 = 0.0000
```

**New person (70 days, 0 assignments):**
```
expected = 70 × 0.01276 = 0.893
deficit = 0.893 - 0 = 0.893
relative_deficit = 0.893 / 70 = 0.01276
```

**Comparison:** New person has higher relative deficit (0.01276 vs 0.0000), so they get selected.

But once they get 1 assignment:
```
deficit = 0.893 - 1 = -0.107
relative_deficit = -0.107 / 70 = -0.00153
```

Now they have **negative** relative deficit, so they won't be selected again until their deficit catches up.

---

## Implementation Plan

### Phase 1: Switch to Relative Deficit

```typescript
calculateEnhancedPriority(person, allPeople, schedules, evaluationDate) {
  const schedulingDays = this.calculateSchedulingDays(person.id, evaluationDate);
  const totalAssignments = historical + accumulated;
  
  // Calculate system rate from participating people
  const systemRate = calculateSystemRate(allPeople);
  
  // Expected based on rate
  const expected = schedulingDays * systemRate;
  const deficit = expected - totalAssignments;
  
  // NEW: Normalize by scheduling days (with minimum threshold)
  const MIN_DAYS = 7;
  const relative_deficit = deficit / Math.max(schedulingDays, MIN_DAYS);
  
  // Use penalized priority on RELATIVE deficit
  return calculatePenalizedPriority(relative_deficit, schedulingDays);
}
```

### Phase 2: Test & Validate

Run test case:
- Expected: Neu gets ~2-3 assignments (rate ≈ 0.0155-0.0216)
- CV should be < 10%

### Phase 3: Long-term Monitoring

Verify behavior over multiple generations and year-long periods.

---

## Alternative: Hybrid Approach

For ultra-conservative fairness, combine relative deficit with a dampening factor for new people:

```typescript
const relative_deficit = deficit / Math.max(schedulingDays, 7);

// Dampen priority for very new people
if (schedulingDays < 14) {
  const dampening = schedulingDays / 14;  // 0 to 1 over 14 days
  return relative_deficit * dampening;
}

return relative_deficit;
```

This creates a **soft ramp-up** period for new people.

---

## Conclusion

The mathematical solution is to use **relative deficit (deficit per day)** instead of absolute deficit. This ensures that priority is based on **rate imbalance** rather than total count imbalance, which naturally gives all people equal footing regardless of when they joined.

**Key Equation:**
```
priority_i = f(deficit_i / schedulingDays_i)
```

Where `deficit_i = (schedulingDays_i × systemRate) - actual_assignments_i`

This is mathematically equivalent to prioritizing based on:
```
priority_i = f(systemRate - currentRate_i)
```

Which is exactly what we want: people with lower current rates get higher priority until all rates converge.
