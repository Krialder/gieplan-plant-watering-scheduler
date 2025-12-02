# Changelog

All notable changes to the GießPlan Plant Watering Schedule Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-02

### 🎉 Initial Release

**IHK Abschlussprojekt: Fachinformatiker/-in für Anwendungsentwicklung**

Complete plant watering schedule management system for vocational rehabilitation programs with high participant turnover.

### Added

#### Core Features
- **People Management System**
  - Create, update, and delete participants
  - Track arrival and departure dates
  - Support multiple program periods per person
  - Automatic experience level classification
  - Mentorship relationship tracking

- **Intelligent Schedule Generation**
  - Multi-week schedule generation (1-52 weeks)
  - Advanced fairness algorithms with Bayesian state tracking
  - Mentor-mentee pairing enforcement
  - Consecutive week prevention
  - Substitute assignment support
  - Emergency override capabilities

- **Advanced Fairness Engine**
  - Bayesian Random Walk state tracking
  - Penalized Priority calculation with time-weighting
  - Gumbel-Softmax stochastic selection
  - Automated constraint checking (Gini coefficient, CV)
  - Cross-year fairness debt tracking
  - Virtual history for new participants
  - Corrective action generation

- **Data Management**
  - File-based JSON storage with File System Access API
  - Import/Export functionality (JSON, CSV, Excel)
  - Multi-year data persistence
  - Automatic backup capabilities
  - Schedule consolidation and cleanup

- **User Interface**
  - Modern React-based SPA
  - Responsive design with TailwindCSS
  - Multiple theme support (Light, Dark, Twilight)
  - Four main tabs: People, Schedule, Manual, Data
  - Real-time updates with optimistic UI
  - Comprehensive error handling
  - Toast notifications

#### Technical Implementation
- **Frontend**: React 19.0, TypeScript 5.7, Vite 6.3
- **Styling**: TailwindCSS 4.1, Radix UI components
- **Testing**: Vitest 4.0 with 100+ test cases
- **Algorithms**: Bayesian inference, Kalman filtering, Softmax selection
- **Code Quality**: Comprehensive JSDoc, strict TypeScript, ESLint

#### Documentation
- Complete API reference (docs/API.md)
- Architecture guide with mathematical formulas (docs/ARCHITECTURE.md)
- Testing guide with examples (docs/TESTING.md)
- IHK project documentation (docs/IHK_PROJECT.md)
- User guide for non-technical users
- Deployment guide

#### Testing & Quality Assurance
- 100+ unit tests with 85%+ coverage
- Integration tests for full workflows
- Stress tests (100 people, 52 weeks)
- Performance benchmarks documented
- Reproducible randomness with seeded PRNG

### Project Context

**Entwickelt als IHK-Abschlussprojekt** für die Ausbildung zum Fachinformatiker für Anwendungsentwicklung.

**Auftraggeber**: Rotkreuz-Institut BBW (Berufsbildungswerk)

**Projektzeitraum**: [Projektstart] - Dezember 2025

**Projektumfang**: ~15.000 Zeilen Code, 30+ Komponenten, 20+ Type Definitions

### System Requirements
- Node.js 18.0.0+
- Modern browser (Chrome 86+, Edge 86+, Firefox 91+, Safari 15.2+)
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space

### Known Limitations
- File System Access API required (no mobile browser support)
- Single-user local operation only (no cloud sync in v1.0)
- German language UI only (English planned for v2.0)

---

## [Unreleased]

### Planned for v2.0
- [ ] Multi-task support (beyond plant watering)
- [ ] Calendar integration (iCal export)
- [ ] Email notifications
- [ ] Multi-language support (DE/EN)
- [ ] Cloud synchronization options
- [ ] Advanced reporting and analytics
- [ ] Role-based access control

---

## Version History

- **v1.0.0** (2025-12-02) - Initial Release (IHK Abschlussprojekt)

---

**Projekt-Repository**: [github.com/Krialder/gieplan-plant-watering-scheduler](https://github.com/Krialder/gieplan-plant-watering-scheduler)

**Projektdokumentation**: Siehe [docs/IHK_PROJECT.md](docs/IHK_PROJECT.md)
