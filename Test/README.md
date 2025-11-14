# Test Directory (`Test/`)

Test suite for the GießPlan application using Vitest.

## Overview

This directory contains comprehensive tests for the core business logic, algorithms, and utilities. The test suite ensures correctness, fairness, and reliability of the scheduling system.

## Test Files

### Core Functionality Tests

#### `scheduleEngine.test.ts`
Tests for the schedule generation engine.

**Test Coverage:**
- Schedule generation with various participant counts
- Week assignment logic
- Mentor-mentee pairing
- Availability checking during active periods
- Partial participation period handling
- Edge cases (empty lists, single person, etc.)

**Key Test Scenarios:**
```typescript
- "generates schedule with fair distribution"
- "pairs experienced with new people"
- "respects arrival and departure dates"
- "handles overlapping participation periods"
- "validates schedule completeness"
```

#### `fairnessEngine.test.ts`
Tests for the fairness calculation system.

**Test Coverage:**
- Temporal fairness score calculation
- Assignments per day present metric
- Cross-year fairness debt tracking
- Mentorship burden scoring
- Recent assignment balance
- Fairness metric updates

**Key Test Scenarios:**
```typescript
- "calculates temporal fairness correctly"
- "tracks fairness debt across periods"
- "accounts for mentorship burden"
- "handles people with no assignments"
- "updates fairness metrics after assignment"
```

#### `personManager.test.ts`
Tests for person lifecycle management.

**Test Coverage:**
- Adding new people
- Updating person details
- Removing people
- Handling departures
- Getting active people for a date
- Program period management
- Experience level transitions

**Key Test Scenarios:**
```typescript
- "adds person with valid data"
- "prevents duplicate names"
- "updates person details correctly"
- "handles departure with reason"
- "returns only active people for date range"
- "manages multiple program periods"
```

#### `dateUtils.test.ts`
Tests for date manipulation utilities.

**Test Coverage:**
- ISO week number calculation
- Week start date calculation
- Week range generation
- Date range checking
- Date parsing and formatting
- Edge cases (year boundaries, leap years)

**Key Test Scenarios:**
```typescript
- "calculates correct ISO week numbers"
- "gets Monday for any week number"
- "generates correct week list for range"
- "handles year boundary weeks correctly"
- "validates date range inclusion"
```

### Integration Tests

#### `simple.test.ts`
Basic integration tests with simple scenarios.

**Purpose:**
- Quick smoke tests
- Basic workflow validation
- Simple use cases

#### `debug-8-people.test.ts` and `debug-10-people.test.ts`
Focused debugging tests with specific participant counts.

**Purpose:**
- Reproduce specific issues
- Test with realistic data sets
- Verify fixes for edge cases

### Advanced Fairness Tests

#### `progressive-fairness.test.ts`
Tests progressive fairness debt accumulation.

**Test Coverage:**
- Fairness debt building over time
- Debt resolution through assignments
- Multi-period fairness tracking
- Long-term fairness balance

**Key Test Scenarios:**
```typescript
- "accumulates debt for under-assigned people"
- "reduces debt when assigned"
- "maintains fairness across multiple schedules"
- "prioritizes people with highest debt"
```

### Stress Tests

#### `stress.test.ts`
High-load and edge case stress tests.

**Test Coverage:**
- Large participant counts (50+, 100+)
- Long time periods (full year, multi-year)
- Frequent arrivals and departures
- Complex mentor-mentee chains
- Performance benchmarks

**Key Test Scenarios:**
```typescript
- "handles 100 people efficiently"
- "generates year-long schedule"
- "manages high turnover (weekly departures)"
- "maintains fairness with complex relationships"
- "completes in reasonable time"
```

#### `stress-progressive-fairness.test.ts`
Stress tests specifically for fairness algorithm.

**Test Coverage:**
- Fairness at scale
- Long-term fairness convergence
- Extreme imbalance correction
- Multi-year fairness tracking

### Test Results

#### `stress-results/`
Directory containing saved stress test results.

**Files:**
- `stress-test-2025-11-11T14-19-51.json` - Example stress test output

**Purpose:**
- Performance tracking over time
- Regression detection
- Benchmarking improvements

## Test Setup

### `setup.ts`
Global test configuration and setup.

**Configuration:**
- Test environment setup
- Global mocks
- Test utilities
- Common test data

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npx vitest scheduleEngine.test.ts
```

### Specific Test Pattern
```bash
npx vitest -t "fairness"
```

## Test Structure

### Typical Test File Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from '@/lib/module';

describe('Module Name', () => {
  // Setup
  beforeEach(() => {
    // Reset state, mocks, etc.
  });

  describe('functionToTest', () => {
    it('should handle normal case', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    it('should handle edge case', () => {
      const result = functionToTest(edgeInput);
      expect(result).toBe(edgeExpected);
    });

    it('should throw error on invalid input', () => {
      expect(() => functionToTest(invalidInput)).toThrow();
    });
  });
});
```

## Testing Guidelines

### What to Test

**Do test:**
- Business logic and algorithms
- Data transformations
- Edge cases and error conditions
- Integration between modules
- Performance-critical paths

**Don't test:**
- UI component rendering (use E2E for that)
- Third-party library internals
- Trivial getters/setters
- Configuration files

### Test Naming

Use descriptive test names:
```typescript
// ✅ Good
it('should prioritize under-assigned people in schedule generation')

// ❌ Bad  
it('test schedule')
```

### Test Organization

Group related tests:
```typescript
describe('ScheduleEngine', () => {
  describe('generation', () => {
    it('test 1', ...);
    it('test 2', ...);
  });
  
  describe('validation', () => {
    it('test 3', ...);
    it('test 4', ...);
  });
});
```

### Assertions

Use clear, specific assertions:
```typescript
// ✅ Good
expect(result.weeks).toHaveLength(52);
expect(result.weeks[0].assignedPeople).toContain('person1');

// ❌ Bad
expect(result).toBeTruthy();
```

### Test Data

Create reusable test data:
```typescript
const mockPerson = (): Person => ({
  id: 'test-id',
  name: 'Test Person',
  arrivalDate: '2025-01-01',
  // ... other fields
});

const mockSchedule = (): Schedule => ({
  // ... schedule data
});
```

### Mocking

Mock external dependencies:
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/fileStorage', () => ({
  saveYearDataToFile: vi.fn(),
  loadYearDataFromFile: vi.fn(() => mockData),
}));
```

## Coverage Goals

Target coverage levels:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Critical modules (scheduleEngine, fairnessEngine):
- **All metrics**: > 90%

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch merges
- Scheduled nightly runs (stress tests)

## Performance Benchmarks

Key performance targets:
- Schedule generation (10 people, 1 year): < 100ms
- Schedule generation (50 people, 1 year): < 500ms
- Schedule generation (100 people, 1 year): < 2s
- Fairness calculation (1 person): < 10ms
- Fairness calculation (100 people): < 500ms

## Debugging Tests

### Failed Test
```bash
# Run specific test
npx vitest -t "test name"

# Run with console output
npx vitest --reporter=verbose

# Debug in UI
npm run test:ui
```

### Performance Issues
```bash
# Run with profiling
npx vitest --reporter=verbose --pool=vmThreads

# Check stress test results
cat Test/stress-results/latest.json
```

## Adding New Tests

1. **Create test file**
   ```
   Test/myFeature.test.ts
   ```

2. **Import dependencies**
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { myFunction } from '@/lib/myModule';
   ```

3. **Write tests**
   ```typescript
   describe('MyFeature', () => {
     it('should work correctly', () => {
       expect(myFunction()).toBe(expected);
     });
   });
   ```

4. **Run and verify**
   ```bash
   npm test
   ```

5. **Check coverage**
   ```bash
   npm run test:coverage
   ```

## Best Practices

- Write tests before fixing bugs (TDD)
- Keep tests simple and focused
- One assertion per test (when possible)
- Use descriptive test names
- Clean up after tests (no side effects)
- Mock external dependencies
- Test edge cases and error conditions
- Maintain test performance (fast feedback)
- Update tests when refactoring
- Review test coverage regularly
