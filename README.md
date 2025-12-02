# GießPlan - Plant Watering Schedule Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![IHK](https://img.shields.io/badge/IHK-Abschlussprojekt-success.svg)](docs/IHK_PROJECT.md)

A sophisticated scheduling system for managing fair weekly plant watering assignments in high-turnover vocational rehabilitation programs. Features Bayesian fairness algorithms, mentor-mentee pairing, and adaptive workload distribution.

**IHK Abschlussprojekt** für **Fachinformatiker/-in für Anwendungsentwicklung**  
📄 [Complete Project Documentation](docs/IHK_PROJECT.md)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Testing](#testing)
- [IHK Project](#ihk-project)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**GießPlan** manages weekly plant watering schedules for Rotkreuz-Institut BBW's vocational rehabilitation program, solving complex challenges:

- **High turnover**: Handles frequent participant arrivals/departures
- **Fair distribution**: Bayesian algorithms ensure equitable workload
- **Mentorship**: Automatic pairing of experienced participants with newcomers
- **Multi-period tracking**: Tracks participants across program breaks and re-entries
- **Fairness debt**: Historical tracking ensures long-term equity
- **Emergency handling**: Works with insufficient participants or mentors

---

## ✨ Features

### Core Functionality

- **👥 People Management**: Track arrivals/departures, experience levels, mentorship relationships, fairness metrics
- **📅 Schedule Generation**: Multi-week fairness-optimized schedules with gap detection, mentor pairing, consecutive week prevention
- **⚖️ Fairness Engine**: Bayesian Random Walk, Penalized Priority, Gumbel-Softmax selection, constraint checking, cross-year tracking
- **📊 Data Management**: File-based JSON storage, import/export (JSON/CSV/Excel), multi-year persistence
- **🎨 Modern UI**: Responsive TailwindCSS design, multiple themes, real-time updates, comprehensive error handling

### Advanced Algorithms

- **Adaptive Temperature**: Dynamic stochasticity control
- **Virtual History**: Fair onboarding for new participants  
- **Bayesian Uncertainty**: Confidence interval quantification
- **Stress Tested**: Validated for 100+ people, 52 weeks

**Key Metrics**: 15,000+ LOC • 100+ Tests • 85%+ Coverage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0+ • npm 8.0.0+ • Modern browser

### Installation & Run

**Automated Setup (Windows):**
```powershell
.\setup.ps1  # PowerShell
setup.bat    # Command Prompt
.\run.ps1    # Start dev server
```

**Manual Setup:**
```bash
git clone https://github.com/Krialder/gieplan-plant-watering-scheduler.git
cd gieplan-plant-watering-scheduler
npm install
npm run dev  # Opens at http://localhost:5173
```

**Production Build:**
```bash
npm run build
npm run preview
```

### Troubleshooting

**Port conflict:**
```bash
# Change port in vite.config.ts or kill process
```

**Module errors:**
```bash
rm -rf node_modules package-lock.json; npm install
```

---

## 🎓 Usage

### Basic Workflow

1. **Setup**: Select data folder → Creates `yearData_YYYY.json` files
2. **Add People**: People tab → Add Person → Enter name and arrival date
3. **Generate Schedule**: Schedule tab → Set dates and weeks → Configure options → Generate
4. **Review**: View assignments → Add comments → Adjust if needed
5. **Export**: Data tab → Export as JSON/CSV/Excel

### Key Options

**Schedule Generation:**
- Prevent consecutive weeks
- Require mentor in each team
- Include future arrivals
- 1-52 weeks, any start date

**Automatic Features:**
- Experience level after 90 days + 4 assignments
- Fairness tracking across years
- Underassigned people prioritized

---

## 🏗️ Architecture

### High-Level Overview

```
React UI (People/Schedule/Manual/Data Tabs)
           ↓
Business Logic (scheduleEngine, personManager, fileStorage)
           ↓
Fairness Engine (AdaptiveFairnessManager)
  ├── Bayesian State (Random Walk, Confidence)
  ├── Penalized Priority (Fairness, Mentorship)
  ├── Softmax Selection (Stochastic, Temperature)
  └── Constraint Checking (Gini, CV, Rates)
           ↓
Data Persistence (JSON: yearData_YYYY.json)
```

### Technology Stack

**Frontend**: React 19 • TypeScript 5.7 • TailwindCSS 4.1 • Radix UI  
**Build**: Vite 6.3 • ESLint  
**Testing**: Vitest 4.0 • Testing Library • 100+ tests  
**Libraries**: date-fns • uuid • recharts • sonner

See [Architecture Guide](docs/ARCHITECTURE.md) for detailed design and algorithms.

---

## 📚 Documentation

### For Users

- 📖 **[User Guide](docs/USER_GUIDE.md)** - Practical guide for program coordinators
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment and hosting

### For Developers

- 📘 **[API Reference](docs/API.md)** - All modules, types, and functions
- 🏗️ **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and fairness algorithms
- 🧪 **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples
- 🤝 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

### For IHK Examiners

- 📄 **[IHK Project Documentation](docs/IHK_PROJECT.md)** - Complete German IHK Abschlussprojekt documentation
- 📋 **[Documentation Index](docs/README.md)** - Overview and navigation
- 📝 **[Changelog](CHANGELOG.md)** - Version history and releases

---

## 🧪 Testing

**Coverage**: 85%+ • **Tests**: 100+ • **Status**: ✅ All Passing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive explorer
npm run test:coverage # Coverage report
```

### Test Categories

- **Unit Tests** (70): Core logic, fairness algorithms, date utilities
- **Integration Tests** (25): Workflows, fairness scenarios, virtual history
- **Stress Tests** (5): 100 people, 52 weeks, high turnover, extreme dynamics

**Key Scenarios**: New person integration • Cross-year fairness • Emergency handling • Bayesian convergence

See [Testing Guide](docs/TESTING.md) for comprehensive documentation.

---

## 🎓 IHK Project

**IHK Abschlussprojekt** for **Fachinformatiker/-in für Anwendungsentwicklung**

- **Organization**: Rotkreuz-Institut BBW
- **Duration**: 70 hours (IHK requirement)
- **Completion**: December 2, 2025
- **Scope**: 15,000+ LOC • 100+ tests • 85%+ coverage

### For IHK Examiners

📄 **[Complete German Documentation](docs/IHK_PROJECT.md)** includes:
- Project overview & objectives
- Requirements analysis (functional & non-functional)
- System architecture & design decisions
- Implementation with code examples
- Testing strategy & results
- 70-hour project timeline
- Lessons learned & future outlook

### Technical Highlights

**Algorithms**: Bayesian Random Walk • Penalized Priority • Gumbel-Softmax • Constraint Checking  
**Quality**: TypeScript strict mode • 100+ tests • Stress tested (100 people, 52 weeks)  
**Standards**: Clean architecture • JSDoc documentation • TDD • Git (150+ commits)

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick Start**:
```bash
git clone https://github.com/YOUR_USERNAME/gieplan-plant-watering-scheduler.git
npm install
npm run dev          # Start development
npm run test:watch   # Run tests
```

**Code Style**: TypeScript strict mode • JSDoc for public APIs • Immutable patterns • 85%+ test coverage

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 📞 Contact

- **Repository**: [github.com/Krialder/gieplan-plant-watering-scheduler](https://github.com/Krialder/gieplan-plant-watering-scheduler)
- **Issues**: [GitHub Issues](https://github.com/Krialder/gieplan-plant-watering-scheduler/issues)
- **IHK Documentation**: [IHK_PROJECT.md](docs/IHK_PROJECT.md)

---

## 🗺️ Roadmap

**v1.x** (Current): ✅ Core scheduling • Fairness algorithms • File persistence • Testing

**v2.0** (Planned): Multi-task support • Calendar export (iCal) • Email notifications • Mobile responsive • Multi-language (DE/EN)

**Future**: Desktop app (Electron) • Mobile app (React Native) • API integration • Real-time collaboration

---

## 📊 Project Stats

- **Type**: IHK Abschlussprojekt - Fachinformatiker/-in Anwendungsentwicklung
- **Code**: 15,000+ lines
- **Tests**: 100+ cases • 85%+ coverage
- **Components**: 30+
- **Documentation**: 650+ pages
- **Tested**: Up to 100 people, 52 weeks
- **Duration**: 70 hours (IHK requirement)

---

<div align="center">

**Made with ❤️ for fair workload distribution**

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#gießplan---plant-watering-schedule-management-system)

</div>
