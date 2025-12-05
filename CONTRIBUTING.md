# Contributing Guide

Guidelines for contributing to GießPlan Plant Watering Schedule Management System.

**IHK Abschlussprojekt**: Fachinformatiker/-in für Anwendungsentwicklung  
📄 [Project Documentation](IHK/02_Dokumentation/Projektdokumentation.md)

---

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/gieplan-plant-watering-scheduler.git
cd gieplan-plant-watering-scheduler

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

### 2. Make Changes

**Code style**:
- TypeScript strict mode
- Functional components (React)
- Pure functions preferred
- Immutable data patterns

**Testing**:
- Add tests for new features
- Maintain 85%+ coverage
- Run `npm test` before committing

### 3. Commit Changes

**Format**:
```
<type>: <description>

[optional body]
[optional footer]
```

**Types**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructure
- `test:` Testing
- `chore:` Maintenance

**Examples**:
```bash
git commit -m "feat: add virtual history for new people"
git commit -m "fix: prevent consecutive week assignments"
git commit -m "docs: update API reference for fairness engine"
```

### 4. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Open Pull Request on GitHub with:
- Clear description
- Related issue number
- Test results
- Screenshots (if UI changes)

---

## Code Style

### TypeScript

**Strict mode** (enforced):
```typescript
// ✅ Good
function createPerson(name: string, arrivalDate: string): Person {
  return {
    id: uuid(),
    name,
    arrivalDate,
    // ... all required fields
  };
}

// ❌ Bad - missing types
function createPerson(name, arrivalDate) {
  return { id: uuid(), name, arrivalDate };
}
```

**Prefer interfaces over types**:
```typescript
// ✅ Good
interface Person {
  id: string;
  name: string;
}

// ❌ Avoid (unless needed)
type Person = {
  id: string;
  name: string;
};
```

### React

**Functional components**:
```typescript
// ✅ Good
export function PeopleTab({ people, onUpdate }: PeopleTabProps) {
  const [selected, setSelected] = useState<string | null>(null);
  return <div>...</div>;
}

// ❌ Bad - class components
export class PeopleTab extends React.Component {
  // ...
}
```

**Custom hooks** for reusable logic:
```typescript
function usePersonSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  return { selected, setSelected };
}
```

### Immutability

**Always return new objects**:
```typescript
// ✅ Good
const updated = updatePerson(person, { name: 'New Name' });

// ❌ Bad
person.name = 'New Name';
```

### Feature Flags

**When developing fairness features**, use the `AdaptiveFairnessManager` feature flag system:

```typescript
// In adaptiveFairness.ts
export const DEFAULT_FEATURE_FLAGS: FairnessFeatureFlags = {
  usePenalizedPriority: true,
  useBayesianUpdates: true,
  useConstraintChecking: true,
  useSoftmaxSelection: false  // New features start disabled
};

// Usage
const manager = new AdaptiveFairnessManager(
  people,
  schedules,
  evaluationDate,
  { ...DEFAULT_FEATURE_FLAGS, useSoftmaxSelection: true }  // Enable for testing
);
```

**Guidelines**:
- New experimental features → Start with flag disabled
- Test thoroughly before enabling by default
- Document flag purpose in code comments
- Consider gradual rollout implications

### Comments

**JSDoc for public APIs**:
```typescript
/**
 * Calculate selection priority with fairness penalties
 * 
 * @param personId - Person identifier
 * @param bayesianState - Current Bayesian state
 * @param schedulingDays - Days available for scheduling
 * @returns Priority score (higher = more deserving)
 */
export function calculatePenalizedPriority(
  personId: string,
  bayesianState: BayesianState,
  schedulingDays: number
): number {
  // Implementation
}
```

**Inline comments** for complex logic:
```typescript
// Calculate Gumbel noise for stochastic selection
const noise = -Math.log(-Math.log(random()));
```

---

## Testing

### Writing Tests

**Structure**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateSchedule } from '@/lib/scheduleEngine';

describe('generateSchedule', () => {
  it('should create fair schedule for 10 people over 25 weeks', () => {
    const result = generateSchedule({
      startDate: '2025-01-06',
      weeks: 25,
      people: mockPeople,
      existingSchedules: [],
      enforceNoConsecutive: true,
      requireMentor: true,
    });

    expect(result.success).toBe(true);
    expect(result.schedule?.assignments).toHaveLength(25);
  });

  it('should prevent consecutive week assignments', () => {
    // Test implementation
  });
});
```

**Coverage requirements**:
- New features: 85%+ coverage
- Bug fixes: Add test reproducing bug
- Refactoring: Maintain existing coverage

**Run tests**:
```bash
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # Interactive UI
```

---

## Documentation

### Update When

- Adding new features → Update README.md, API.md
- Changing architecture → Update ARCHITECTURE.md
- Modifying tests → Update TESTING.md
- User-facing changes → Update USER_GUIDE.md

### Documentation Style

**Concise, clear, practical**:
```markdown
## generateSchedule

Generate multi-week schedule with fairness optimization.

**Parameters**: See ScheduleGenerationOptions
**Returns**: { success, schedule?, errors, warnings }
```

**Code examples** for complex features:
```typescript
const result = generateSchedule({
  startDate: '2025-01-06',
  weeks: 12,
  people: activePeople,
  // ...
});
```

---

## Pull Request Process

### Before Submitting

- ✅ Tests pass: `npm test`
- ✅ Linting clean: `npm run lint`
- ✅ Build succeeds: `npm run build`
- ✅ Documentation updated
- ✅ Commit messages follow format

### PR Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #123

## Changes
- Added feature X
- Fixed bug Y
- Updated docs Z

## Testing
- [ ] Added tests
- [ ] All tests pass
- [ ] Coverage maintained

## Screenshots (if applicable)
[Add screenshots]
```

### Review Process

1. Automated checks run (tests, linting)
2. Code review by maintainer
3. Request changes if needed
4. Approve and merge

**Merge strategy**: Squash and merge (keeps clean history)

---

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # Reusable UI components (Radix UI based)
│   └── dialogs/      # Dialog components
├── lib/              # Core business logic
│   ├── adaptiveFairness.ts      # Fairness coordination with feature flags
│   ├── scheduleEngine.ts        # Schedule generation orchestration
│   ├── personManager.ts         # Person lifecycle management
│   ├── fairnessEngine.ts        # Fairness utilities & compatibility
│   ├── fileStorage.ts           # File System Access API storage
│   ├── storage.ts               # LocalStorage utilities
│   ├── dateUtils.ts             # Date manipulation
│   ├── exportUtils.ts           # Export format conversion
│   └── legacy/                  # Legacy fairnessEngine (backwards compatibility)
├── types/            # TypeScript type definitions
├── hooks/            # Custom React hooks (use-mobile, etc.)
└── styles/           # CSS styles (theme.css)

fairness/             # Standalone fairness module
├── index.ts          # Main exports (DynamicFairnessEngine)
├── bayesianState.ts  # Bayesian random walk
├── penalizedPriority.ts  # Priority calculation
├── softmaxSelection.ts   # Gumbel-Softmax selection
├── fairnessConstraints.ts  # Constraint validation
├── random.ts         # Seeded PRNG utilities
├── types.ts          # Fairness-specific types
└── test/            # Algorithm unit tests

Test/                 # Integration & stress tests
docs/                 # Documentation (API, ARCHITECTURE, TESTING, etc.)
```

---

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/Krialder/gieplan-plant-watering-scheduler/discussions)
- **Bugs**: [GitHub Issues](https://github.com/Krialder/gieplan-plant-watering-scheduler/issues)
- **Documentation**: [docs/README.md](docs/README.md)

---

## Code of Conduct

### Our Standards

- ✅ Be respectful and inclusive
- ✅ Provide constructive feedback
- ✅ Focus on the code, not the person
- ✅ Help others learn and grow

### Unacceptable

- ❌ Harassment or discrimination
- ❌ Personal attacks
- ❌ Trolling or inflammatory comments
- ❌ Spam or off-topic content

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Thank you for contributing!**

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#contributing-guide)

</div>
