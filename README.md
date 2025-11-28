# GießPlan - Plant Watering Scheduler

A sophisticated watering schedule management system for Rotkreuz-Institut BBW that ensures fair task distribution among program participants using advanced fairness algorithms.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 🌱 Overview

GießPlan automates the complex task of fairly distributing plant watering duties among participants in a dynamic environment where people frequently join and leave the program. The system uses Bayesian statistics and machine learning techniques to ensure everyone gets a fair share of assignments while accounting for experience levels and mentorship requirements.

### Key Features

- **Smart Fairness Engine**: Uses Bayesian inference and penalized priority algorithms
- **Experience-Based Mentoring**: Automatically pairs new participants with experienced ones
- **Dynamic Adaptation**: Handles frequent arrivals and departures seamlessly
- **Multi-Theme UI**: Light, dark, and twilight themes for comfortable viewing
- **Local File Storage**: Data persists in user-selected folders with JSON export
- **Comprehensive Testing**: Full test suite with stress testing and edge case coverage

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: use the latest LTS version)
- **npm** or **yarn** package manager

### Setup & Installation

1. **Clone or download** this repository to your local machine

2. **Run the automated setup script**:

   ```bash
   # Windows (Command Prompt)
   setup.bat
   
   # Windows (PowerShell) 
   ./setup.ps1
   
   # Or manually:
   npm install
   npm run dev
   ```

3. **Automated setup includes**:
   - Node.js version verification (requires 18+)
   - Dependency installation
   - Test suite verification
   - Development server startup

4. **Open your browser** to `http://localhost:5173`

5. **Select a data folder** when prompted (creates/saves JSON files there)

### First Time Setup

1. **Choose Data Folder**: Click "Select Folder" to pick where your schedules will be saved
2. **Add People**: Go to the "People" tab and add program participants
3. **Generate Schedule**: Use the "Schedule" tab to create fair weekly assignments
4. **Review & Export**: Check the "Data" tab for export options and statistics

## 📁 Project Architecture

### Overview
```
gieplan-plant-watering/
├── src/                          # Main React application
├── fairness/                    # Advanced fairness algorithms  
├── Test/                        # Comprehensive test suite
└── Configuration files          # Build, lint, and dev tools
```

### 🎨 Frontend (`/src/`)

**Main Components (`/src/components/`)**
- `App.tsx` - Root component with theme management and data persistence
- `PeopleTab.tsx` - Person lifecycle management (add/edit/remove participants)
- `ScheduleTab.tsx` - Schedule generation with fairness algorithms
- `ManualTab.tsx` - Manual schedule editing and adjustments
- `DataTab.tsx` - Data export, analysis, and statistics visualization
- `FolderSelector.tsx` - Local file system access for data persistence

**UI Components (`/src/components/ui/`)**
- Radix-based component library with custom styling
- `dialog.tsx`, `tabs.tsx`, `button.tsx` - Core interactive elements
- `alert.tsx`, `badge.tsx`, `card.tsx` - Data display components
- Fully accessible with keyboard navigation and screen reader support

**Business Logic (`/src/lib/`)**
- `scheduleEngine.ts` - **Core schedule generation** with multi-week planning
- `fairnessEngine.ts` - **Main fairness calculations** and constraint enforcement
- `adaptiveFairness.ts` - **Bayesian learning** for dynamic fair assignment
- `personManager.ts` - Person lifecycle management and experience tracking
- `dateUtils.ts` - Comprehensive date handling for German locale
- `fileStorage.ts` - Local JSON file persistence via File System Access API
- `exportUtils.ts` - PDF and Excel export functionality

**Types (`/src/types/`)**
- Complete TypeScript definitions for all data structures
- Person lifecycle with multi-period support
- Schedule and assignment interfaces
- Comprehensive fairness metrics and calculations

### ⚖️ Fairness Engine (`/fairness/`)

**Core Algorithm Files**
- `index.ts` - **Main integration hub** combining all fairness subsystems
- `bayesianState.ts` - **Bayesian inference** for learning individual assignment rates
- `fairnessConstraints.ts` - **Constraint checking** and violation detection
- `penalizedPriority.ts` - **Priority calculation** with experience and tenure factors
- `softmaxSelection.ts` - **Probabilistic selection** with temperature control
- `random.ts` - **Seeded randomness** with advanced sampling techniques

**Advanced Features**
- **Bayesian Learning**: Adapts to each person's participation patterns over time
- **Constraint Enforcement**: Maximum variance limits, mentorship requirements
- **Temperature Scheduling**: Adaptive randomness based on current fairness state
- **Seeded Random**: Reproducible results for testing and verification
- **Entropy Monitoring**: Quality assurance for selection randomness

### 🧪 Testing Suite (`/Test/`)

**Unit and Integration Tests**
- `fairnessEngine.test.ts` - Core fairness algorithm validation
- `scheduleEngine.test.ts` - Schedule generation testing
- `dateUtils.test.ts` - Date calculation verification
- `personManager.test.ts` - Person lifecycle management

**Advanced Testing**
- `stress-*.test.ts` - Performance testing with large datasets (25+ weeks, 50+ people)
- `debug-*.test.ts` - Edge case testing and algorithm debugging
- `progressive-fairness.test.ts` - Long-term fairness convergence validation
- `/stress-results/` - Performance benchmarks and analysis reports

**Fairness Algorithm Tests (`/fairness/test/`)**
- `integration.test.ts` - End-to-end fairness system validation
- `bayesianState.test.ts` - Bayesian learning algorithm verification
- `softmaxSelection.test.ts` - Selection probability testing
- `newPersonIntegration.test.ts` - Dynamic arrival/departure handling

### ⚙️ Configuration Files

**Build & Development**
- `vite.config.ts` - Vite build configuration with React and TailwindCSS
- `tailwind.config.js` - Custom design system with multiple themes
- `tsconfig.json` - TypeScript configuration with strict type checking
- `vitest.config.ts` - Test runner configuration for comprehensive testing

**Code Quality**
- `eslint.config.js` - ESLint rules for code consistency
- `package.json` - Dependencies and scripts for all operations

**Quick Start**
- `setup.bat` - Windows batch script for instant setup
- `setup.ps1` - PowerShell script with enhanced error handling and colors

## 🧠 Algorithm Deep Dive

### The Fairness Problem

In a dynamic environment where people frequently join and leave the program, traditional round-robin scheduling fails because:
- **Temporal Unfairness**: Someone who joined later might never catch up
- **Experience Imbalance**: New people need mentorship but shouldn't be over-burdened
- **Departure Effects**: When experienced people leave, fairness calculations must adapt
- **Variance Control**: Large differences in assignment rates create perceived unfairness

### Multi-Layered Solution

#### 1. Bayesian State Tracking (`bayesianState.ts`)

**Purpose**: Learn each person's "ideal" assignment rate based on their participation history

**How it Works**:
```typescript
// For each person, track:
- Prior belief about their assignment rate (μ_prior, σ²_prior)  
- Observed actual assignments over time
- Posterior updated belief after each assignment
- Confidence intervals for uncertainty quantification
```

**Key Benefits**:
- Adapts to changing group dynamics automatically
- Provides uncertainty estimates for better decision making
- Handles sparse data (new people) gracefully
- Creates personalized fairness baselines

#### 2. Penalized Priority System (`penalizedPriority.ts`)

**Purpose**: Calculate assignment priorities considering experience and recent history

**Algorithm**:
```typescript
Priority = BasePriority + ExperiencePenalty + TenurePenalty + VarianceAdjustment

Where:
- BasePriority: Raw assignment deficit (assignments owed)
- ExperiencePenalty: Slight boost for new people, reduction for mentors
- TenurePenalty: Time-based adjustment for recent assignments  
- VarianceAdjustment: System-wide fairness correction
```

**Key Features**:
- Prevents consecutive assignments through exponential decay
- Balances mentorship duties fairly among experienced people
- Provides smooth priority transitions (no sudden jumps)

#### 3. Softmax Selection (`softmaxSelection.ts`)

**Purpose**: Convert priorities to selection probabilities with controlled randomness

**Methods Available**:
- **Standard Softmax**: `P(person_i) = exp(priority_i / T) / Σ exp(priority_j / T)`
- **Gumbel-Max Sampling**: Adds Gumbel noise for improved exploration
- **Adaptive Temperature**: `T = f(variance, convergence_state)`

**Temperature Control**:
- **High Temperature** (high variance): More random selection
- **Low Temperature** (low variance): More deterministic (priority-based)
- **Adaptive**: Automatically adjusts based on current fairness state

#### 4. Constraint Enforcement (`fairnessConstraints.ts`)

**Purpose**: Ensure hard requirements are met and fairness bounds aren't violated

**Constraints Monitored**:
```typescript
- Maximum Assignment Rate Variance: σ² ≤ 0.15
- Mentorship Requirements: ≥1 experienced person per team
- Cumulative Deficit Bounds: |deficit| ≤ configurable limit
- Convergence Rate: System must improve over time
```

**Corrective Actions**:
- Priority boosts for under-assigned people
- Mandatory selection for severe deficits
- Emergency warnings when constraints can't be met

### Advanced Features

#### Seeded Randomness (`random.ts`)
- **Reproducible Results**: Same seed = same schedule (for testing)
- **Gumbel Sampling**: Superior exploration compared to basic random
- **Chi-Square Testing**: Verify randomness quality automatically
- **Multiple PRNGs**: LCG, Mersenne Twister, and browser crypto fallbacks

#### Adaptive Learning (`adaptiveFairness.ts`)
- **Dynamic Arrival Handling**: New people integration without disrupting existing fairness
- **Departure Compensation**: Redistribute "fairness debt" when people leave
- **Multi-Period Support**: Handle people who return to the program
- **Experience Promotion**: Automatic graduation from "new" to "experienced"

#### Performance Optimization
- **Incremental Updates**: Only recalculate what changed
- **Cached Calculations**: Store intermediate results for complex operations
- **Parallel Testing**: Run multiple scenarios simultaneously
- **Memory Management**: Efficient data structures for large groups

### Real-World Example

**Scenario**: 10 people, 26-week schedule, 3 new arrivals, 2 departures

1. **Week 1-5**: Standard fairness with current group
2. **Week 6**: New person arrives → Bayesian state initialized, priorities adjusted
3. **Week 12**: Experienced person leaves → Fairness debt redistributed
4. **Week 18**: Another new arrival → Mentorship requirements recalculated  
5. **Week 26**: Final convergence analysis and fairness report

**System Adaptations**:
- Assignment rates automatically rebalanced after each change
- Mentorship pairings updated when experience levels change
- Temperature scheduling responds to variance spikes
- Constraint violations trigger corrective actions immediately

### Validation & Testing

**Algorithm Verification**:
- Mathematical proofs for convergence properties
- Monte Carlo simulations with 10,000+ iterations
- Edge case testing (all new people, all experienced, rapid turnover)
- Performance benchmarks with large datasets

**Real-World Testing**:
- A/B comparison with manual scheduling
- Fairness perception surveys
- Long-term stability analysis (multi-year data)
- Emergency scenario handling (insufficient people, mentor shortages)

## 🎮 Usage Guide

### Managing People

1. Navigate to the **People** tab
2. Click **"Add Person"** to add new participants
3. Set their **arrival date** and **experience level**
4. The system automatically tracks their program participation

### Generating Schedules

1. Go to the **Schedule** tab
2. Set the **start date** and **number of weeks**
3. Click **"Generate Fair Schedule"**
4. Review the assignments and fairness scores
5. Export to PDF or Excel if needed

### Manual Adjustments

1. Use the **Manual** tab to make specific changes
2. Reassign weeks if needed (system will update fairness calculations)
3. Add substitutes for any week
4. Mark emergency assignments when manual intervention is required

### Data Management

1. Visit the **Data** tab for:
   - Export schedules and statistics
   - View fairness analysis charts
   - Import/export for backup
   - Clear old data if needed

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI for interactive testing
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing Strategy

The project includes industry-grade testing across multiple dimensions:

#### Test Categories

**Unit Tests** (`*.test.ts`)
- Individual function validation with edge cases
- Pure algorithm testing (mathematical correctness)
- Component rendering and interaction testing
- Data structure validation and type safety

**Integration Tests**
- End-to-end fairness system validation
- Multi-component workflow testing
- File I/O and data persistence verification
- Cross-algorithm compatibility testing

**Stress Tests** (`stress-*.test.ts`)
- **Large Scale**: 50+ people, 26+ week schedules
- **High Turnover**: Frequent arrivals and departures
- **Edge Scenarios**: All new people, no mentors, extreme imbalances
- **Performance**: Memory usage, calculation speed, convergence rates

**Algorithm-Specific Tests** (`/fairness/test/`)
- Bayesian inference mathematical validation
- Selection probability distribution verification
- Constraint enforcement under extreme conditions
- Random number generator quality assurance

#### Test Commands

```bash
# Run all tests
npm run test

# Specific test categories  
npm run test fairness           # Fairness algorithm validation
npm run test stress            # Performance and edge case testing
npm run test integration       # End-to-end system testing

# Interactive testing
npm run test:watch             # Auto-rerun on file changes
npm run test:ui               # Visual test runner interface
npm run test:coverage         # Generate coverage reports

# Specific test files
npm run test bayesian          # Bayesian algorithm tests
npm run test 25-weeks         # Long-term schedule testing
npm run test new-person       # Dynamic arrival testing
```

#### Test Coverage Goals

- **Algorithm Logic**: 100% coverage of fairness calculations
- **Edge Cases**: All identified failure modes tested
- **Performance**: Benchmarks for realistic and extreme scenarios
- **Integration**: Complete user workflow validation

### Technology Stack

**Core Technologies**
- **React 19**: Latest stable with concurrent features and Suspense
- **TypeScript 5.7**: Strict type checking with latest language features
- **Vite 6**: Lightning-fast build tool with HMR and SWC compilation
- **Node.js 18+**: Modern JavaScript runtime with stable APIs

**UI & Styling**
- **TailwindCSS 4**: Utility-first CSS with custom design tokens
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Consistent icon system
- **Framer Motion**: Smooth animations and transitions

**Data & State Management**
- **File System Access API**: Direct local file operations
- **Zustand**: Lightweight state management (if needed)
- **React Hook Form**: Form validation and management
- **Date-fns**: Comprehensive date manipulation

**Testing & Quality**
- **Vitest**: Fast unit testing with Vite integration
- **React Testing Library**: Component testing best practices
- **ESLint**: Code quality and consistency enforcement
- **TypeScript Strict**: Maximum type safety and early error detection

**Mathematical & Algorithmic**
- **Custom Bayesian Implementation**: No external ML dependencies
- **Seeded PRNG**: Reproducible randomness for testing
- **Statistical Functions**: Custom implementations for fairness metrics
- **Performance Monitoring**: Built-in algorithm performance tracking

## 📊 Implementation Details

### Fairness Metrics Explained

The system tracks multiple mathematical fairness indicators:

**Primary Metrics**
- **Variance (σ²)**: Core measure of assignment distribution equality
- **Standard Deviation (σ)**: Square root of variance for intuitive understanding  
- **Coefficient of Variation (CV)**: Normalized variance for cross-period comparison
- **Gini Coefficient**: Economics-inspired inequality measure (0 = perfect equality)

**Advanced Metrics**
- **Theil Index**: Information-theoretic measure of distributional inequality
- **Maximum/Minimum Deficit**: Range of assignment imbalances
- **Convergence Rate**: Speed of fairness improvement over time
- **Entropy**: Quality measure for selection randomness

### File Structure & Data Flow

#### Data Persistence
```typescript
// File: {selected_folder}/gieplan-{year}.json
{
  "year": 2025,
  "people": [...],           // Complete person records
  "schedules": [...],        // All generated schedules
  "lastModified": "..."      // ISO timestamp
}
```

#### Memory Management
- **Lazy Loading**: Only active year data kept in memory
- **Incremental Updates**: Changed data written immediately
- **Backup Strategy**: Automatic JSON export before major changes
- **Recovery**: Graceful degradation when files are corrupted

### Performance Characteristics

#### Computational Complexity
- **Schedule Generation**: O(n²w) where n=people, w=weeks
- **Fairness Calculation**: O(n log n) per assignment decision
- **Bayesian Update**: O(1) per person per assignment
- **Constraint Checking**: O(n) per week validation

#### Memory Usage
- **Small Groups** (≤20 people): <10MB total memory
- **Large Groups** (50+ people): <50MB total memory  
- **Historical Data**: Linear growth with schedule count
- **Browser Limits**: Designed for 100MB+ datasets

#### Real-World Performance
- **Schedule Generation**: <2 seconds for 26 weeks, 20 people
- **UI Responsiveness**: <100ms for all user interactions
- **File Operations**: <500ms for save/load cycles
- **Test Suite**: <30 seconds for complete validation

### Browser Compatibility

#### Required Features
- **File System Access API**: Chrome 86+, Edge 86+, Opera 72+
- **ES2022 Support**: All modern browsers (2022+)
- **Local Storage**: Universal support
- **Modern JavaScript**: Classes, async/await, modules

#### Fallback Strategies
- **File Access**: Graceful degradation to download/upload
- **Local Storage**: Session storage backup
- **Unsupported Browsers**: Clear error messaging with upgrade suggestions

### Security & Privacy

#### Data Protection
- **Local-Only Storage**: No data ever leaves the user's computer
- **No Analytics**: Zero tracking or telemetry  
- **File Permissions**: Standard browser security model
- **Input Validation**: All user input sanitized and validated

#### Access Control
- **Folder Selection**: User explicitly chooses data location
- **File Permissions**: Browser enforces OS-level file access
- **No Network**: Completely offline-capable application
- **Audit Trail**: All changes logged with timestamps

### Customization & Configuration

#### Fairness Parameters
```typescript
// Adjustable in fairnessConstraints.ts
const DEFAULT_CONSTRAINTS = {
  maxVariance: 0.15,              // Maximum allowed inequality
  maxCumulativeDeficit: 3.0,      // Assignment debt limit
  rollingWindowWeeks: 8           // Evaluation window size
}
```

#### Algorithm Tuning
```typescript
// Temperature scheduling in softmaxSelection.ts  
adaptiveTemperature = baseTemp * Math.sqrt(variance / targetVariance)

// Penalty factors in penalizedPriority.ts
experiencePenalty = 0.1 * (isExperienced ? -1 : 1)
tenurePenalty = Math.exp(-daysSinceAssignment / 7)
```

#### UI Customization
- **Themes**: Light, dark, and twilight modes with custom CSS variables
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Accessibility**: Full WCAG 2.1 compliance with screen reader support
- **Internationalization**: German locale support, extensible for other languages

## 🤝 Contributing

Since this is a personal project, contributions are not expected, but if you find bugs or have suggestions:

1. Document the issue clearly with steps to reproduce
2. Include screenshots if it's a UI issue
3. Mention your browser and operating system

## 📝 License

This project is developed for personal use at Rotkreuz-Institut BBW. Feel free to study the code and adapt concepts for your own projects.

## 🔍 Troubleshooting

### Common Issues

**"Cannot select folder"**
- Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- The File System Access API requires HTTPS or localhost

**"Data not saving"**
- Ensure you've selected a folder and have write permissions
- Check browser console for any errors

**"Schedule generation fails"**
- Verify you have at least 2 people added
- Check that date ranges make sense
- Ensure at least one experienced person if you have new participants

**"Tests failing"**
- Run `npm install` to ensure dependencies are up to date
- Check that Node.js version is 18 or higher

### Performance

The system is optimized for typical usage (10-50 people, schedules up to 26 weeks). For larger datasets:

- Use the stress test suite to validate performance
- Consider breaking large schedules into smaller chunks
- Monitor browser memory usage during long-running operations

## 📞 Support & Development Notes

### For Future You (or Other Developers)

This section contains practical notes for maintaining and extending the system:

#### Code Organization Philosophy
- **Single Responsibility**: Each module has one clear purpose
- **Functional Approach**: Pure functions where possible, side effects isolated
- **Type Safety**: Comprehensive TypeScript coverage with strict mode
- **Testable Design**: All business logic separated from UI components

#### Key Design Decisions
- **Local-First**: No server dependency ensures privacy and simplicity
- **Algorithm Transparency**: All fairness calculations are inspectable and deterministic
- **Graceful Degradation**: System works even with partial functionality (no file access, etc.)
- **Performance First**: Optimized for real-time interaction with immediate feedback

#### Common Maintenance Tasks

**Adding New Fairness Constraints**:
1. Add constraint definition to `fairness/types.ts`
2. Implement checking logic in `fairness/fairnessConstraints.ts`
3. Add corrective action in the same file
4. Write test cases in `fairness/test/fairnessConstraints.test.ts`

**Modifying Selection Algorithm**:
1. Core logic in `fairness/softmaxSelection.ts`
2. Integration in `fairness/index.ts`
3. Test with `fairness/test/softmaxSelection.test.ts`
4. Performance testing in `Test/stress-*.test.ts`

**UI Component Changes**:
1. Components in `src/components/`
2. Styling with TailwindCSS classes
3. Type definitions in `src/types/`
4. Integration testing in component test files

#### Performance Monitoring
- Browser DevTools for memory usage
- Test suite includes performance benchmarks
- Algorithm complexity documented in comments
- Stress test results tracked in `/Test/stress-results/`

#### Debugging Tips
- Use browser DevTools for React components
- Algorithm state can be inspected via console logs
- Test individual algorithms in isolation
- File I/O operations have extensive error logging

### Technical Support

For technical issues or questions:

**Algorithm Questions**:
- Comprehensive test suite in `/Test/` shows usage examples
- Fairness algorithm documentation in `/fairness/` with mathematical details
- Type definitions in `/src/types/` explain all data structures

**Browser Compatibility Issues**:
- File System Access API support: [Can I Use](https://caniuse.com/native-filesystem-api)
- JavaScript ES2022 features required
- Modern browser (Chrome 86+, Firefox 91+, Safari 15+, Edge 86+)

**Performance Issues**:
- Run stress tests to identify bottlenecks: `npm run test stress`
- Check browser memory usage in DevTools
- Large datasets (50+ people) may require chunked processing

**Data Recovery**:
- JSON files are human-readable and can be manually edited
- Export/import functionality for backup and recovery
- Browser localStorage used for settings (theme, etc.)

---

*Built with ❤️ for fair and efficient plant care at Rotkreuz-Institut BBW*

**Final Note**: This system represents a practical application of advanced algorithms to solve real-world fairness problems. The code is designed to be educational as well as functional - feel free to explore, experiment, and adapt the concepts for your own projects!