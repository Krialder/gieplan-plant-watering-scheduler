# Anhang A: UML-Diagramme

## IHK Abschlussprojekt - GießPlan

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor

---

## Inhaltsverzeichnis

1. [Klassendiagramm - Fairness Engine](#1-klassendiagramm---fairness-engine)
2. [Sequenzdiagramm - Zeitplan-Generierung](#2-sequenzdiagramm---zeitplan-generierung)
3. [Use-Case-Diagramm](#3-use-case-diagramm)
4. [Komponentendiagramm](#4-komponentendiagramm)
5. [Aktivitätsdiagramm - Person hinzufügen](#5-aktivitätsdiagramm---person-hinzufügen)

---

## 1. Klassendiagramm - Fairness Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                «class» AdaptiveFairnessManager                  │
│                (src/lib/adaptiveFairness.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│ - engine: DynamicFairnessEngine                                 │
│ - flags: FairnessFeatureFlags                                   │
│ - people: Person[]                                              │
│ - schedules: Schedule[]                                         │
│ - historicalAssignments: Map<string, number>                    │
│ - accumulatedAssignments: Map<string, number>                   │
│ - firstSchedulingDate: Map<string, string>                      │
├─────────────────────────────────────────────────────────────────┤
│ + selectTeamsAndSubstitutes(): {teamIds, substituteIds, ...}   │
│ + updateState(assignedIds: string[]): void                      │
│ + markPersonAvailableForScheduling(id: string, date: string)    │
│ + calculatePriority(personId: string, weekStartDate: string)    │
│ + calculateEnhancedPriority(person, allPeople, schedules, date) │
│ + checkFairness(people, schedules, date): {warnings, metrics}   │
│ + getFairnessMetrics(people, schedules, date): any              │
│ + getPersonConfidenceInterval(id: string, level: number)        │
│ + updateAfterAssignment(id, assigned, daysElapsed, idealRate)   │
│ + initializeFromPeople(people, schedules, evaluationDate)       │
│ + recalculateFirstSchedulingDates(schedules: Schedule[])        │
│ + getState(): {historicalAssignments, accumulatedAssignments}   │
│ + reset(): void                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ contains
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                «class» DynamicFairnessEngine                    │
│                (fairness/index.ts)                              │
├─────────────────────────────────────────────────────────────────┤
│ - bayesianStates: Map<string, BayesianState>                    │
│ - correctiveActions: Map<string, CorrectiveAction>              │
│ - constraints: FairnessConstraints                              │
│ - varianceHistory: number[]                                     │
│ - metricsHistory: FairnessMetrics[]                             │
│ - rng: SeededRandom                                             │
├─────────────────────────────────────────────────────────────────┤
│ + initializePerson(id: string, initialRate: number, date)       │
│ + updateAfterAssignment(id, assigned, daysElapsed, idealRate)   │
│ + calculatePersonPriority(deficit: number, tenure: number)       │
│ + checkAndCorrect(rates, deficits, tenures, personIds)          │
│ + selectTeam(ids, deficits, variance, teamSize, useGumbel)      │
│ + selectTeamWithTemperature(ids, deficits, temp, size, gumbel)  │
│ + getPersonConfidenceInterval(id: string, level: number)         │
│ + getCorrectiveAction(personId: string): CorrectiveAction       │
│ + clearExpiredActions(currentWeek: number): void                │
│ + getAllBayesianStates(): Map<string, BayesianState>            │
│ + getVarianceHistory(): number[]                                │
│ + getMetricsHistory(): FairnessMetrics[]                        │
│ + isConverging(windowSize: number): boolean                     │
│ + getConvergenceRate(windowSize: number): number                │
│ + getEntropyHistory(): number[]                                 │
│ + getRecentSelections(): string[][]                             │
│ + getAverageEntropy(windowSize: number): number                 │
│ + seedRandom(seed: number): void                                │
│ + getRandomState(): number                                      │
│ + reset(): void                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ uses functions from
        ┌───────────────────┼──────────────────┬─────────────────┐
        │                   │                  │                 │
        ▼                   ▼                  ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
│   «module»   │  │   «module»   │  │   «module»    │  │  «module»    │
│ bayesianState│  │ penalized    │  │  softmax      │  │  fairness    │
│              │  │ Priority     │  │  Selection    │  │ Constraints  │
├──────────────┤  ├──────────────┤  ├───────────────┤  ├──────────────┤
│ initialize   │  │ calculate    │  │ calculate     │  │ check        │
│ BayesianState│  │ Penalized    │  │ Softmax       │  │ Fairness     │
│ ()           │  │ Priority()   │  │ Probabilities │  │ Constraints()│
│ update       │  │ calculate    │  │ ()            │  │ calculate    │
│ BayesianState│  │ PenaltyBoost │  │ selectWith    │  │ Fairness     │
│ ()           │  │ ()           │  │ Softmax()     │  │ Metrics()    │
│ getConfidence│  │ calculate    │  │ selectWith    │  │ apply        │
│ Interval()   │  │ Optimal      │  │ Adaptive      │  │ Corrective   │
│              │  │ Lambda()     │  │ Temperature() │  │ Actions()    │
└──────────────┘  └──────────────┘  └───────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                «interface» Person                               │
│                (src/types/index.ts)                             │
├─────────────────────────────────────────────────────────────────┤
│ + id: string                                                    │
│ + name: string                                                  │
│ + arrivalDate: string                                           │
│ + expectedDepartureDate: string | null                          │
│ + actualDepartureDate: string | null                            │
│ + programPeriods: TimePeriod[]                                  │
│ + experienceLevel: ExperienceLevel                              │
│ + mentorshipAssignments: string[]                               │
│ + fairnessMetrics: FairnessMetrics                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ has
                            ▼
                ┌────────────────────────┐
                │ «interface»            │
                │  FairnessMetrics       │
                ├────────────────────────┤
                │ + person: string       │
                │ + temporalFairness     │
                │   Score: number        │
                │ + assignmentsPerDay    │
                │   Present: number      │
                │ + crossYearFairness    │
                │   Debt: number         │
                │ + mentorshipBurden     │
                │   Score: number        │
                │ + lastUpdated: string  │
                └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           «module» scheduleEngine                               │
│           (src/lib/scheduleEngine.ts)                           │
├─────────────────────────────────────────────────────────────────┤
│ + generateSchedule(options): ScheduleGenerationResult           │
│ + handlePersonDeletion(person, schedules): Schedule[]           │
│ + replacePersonInWeek(schedule, weekIndex, oldId, newId)        │
│ + swapPeopleInSchedules(schedules, id1, id2): Schedule[]        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ creates
                            ▼
                ┌────────────────────────┐
                │ «interface»            │
                │  WeekAssignment        │
                ├────────────────────────┤
                │ + weekNumber: number   │
                │ + weekStartDate: string│
                │ + assignedPeople: []   │
                │ + substitutes: []      │
                │ + hasMentor: boolean   │
                │ + fairnessScores: []   │
                │ + comment?: string     │
                └────────────────────────┘
```

**Erklärung**:
- **AdaptiveFairnessManager**: Klasse für Fairness-Orchestrierung (wraps DynamicFairnessEngine)
  - Hauptmethoden: selectTeamsAndSubstitutes(), checkFairness(), getFairnessMetrics()
  - Verwaltet historische Assignments und First-Scheduling-Dates
- **DynamicFairnessEngine**: Kern-Klasse mit Bayesian State Tracking und umfangreichen Analyse-Methoden
  - Methoden für Selection: selectTeam(), selectTeamWithTemperature()
  - Analyse-Methoden: getAllBayesianStates(), getMetricsHistory(), isConverging(), getConvergenceRate()
  - Entropy-Tracking: getEntropyHistory(), getAverageEntropy()
  - State-Management: seedRandom(), reset()
- **bayesianState, penalizedPriority, softmaxSelection**: Funktionale Module mit reinen Funktionen
- **fairnessConstraints**: Modul mit checkFairnessConstraints(), calculateFairnessMetrics(), applyCorrectiveActions()
- **Person, FairnessMetrics, WeekAssignment**: TypeScript-Interfaces (keine Klassen)
- **scheduleEngine**: Funktionales Modul für Zeitplan-Operationen (keine Klasse)

---

## 2. Sequenzdiagramm - Zeitplan-Generierung

```
User    ScheduleTab.tsx    scheduleEngine    AdaptiveFairness    DynamicFairness    FileStorage
        (Component)        (Module)          Manager (Class)     Engine (Class)     (async)
  │           │                │                    │                   │               │
  │ Click     │                │                    │                   │               │
  │"Generate" │                │                    │                   │               │
  ├──────────>│                │                    │                   │               │
  │           │ generateSchedule()                  │                   │               │
  │           ├───────────────>│                    │                   │               │
  │           │                │ validate inputs    │                   │               │
  │           │                │ (dates, weeks)     │                   │               │
  │           │                │                    │                   │               │
  │           │                │ filter active      │                   │               │
  │           │                │ people for range   │                   │               │
  │           │                │                    │                   │               │
  │           │                │ new AdaptiveFairnessManager()          │               │
  │           │                ├───────────────────>│                   │               │
  │           │                │                    │ new DynamicFairness│              │
  │           │                │                    │ Engine()           │               │
  │           │                │                    ├──────────────────>│               │
  │           │                │                    │                   │               │
  │           │                │  ╔════════════════════════════════╗    │               │
  │           │                │  ║ For Each Week (1..n)           ║    │               │
  │           │                │  ╚════════════════════════════════╝    │               │
  │           │                │                    │                   │               │
  │           │                │ markPersonAvailable│                   │               │
  │           │                │ ForScheduling()    │                   │               │
  │           │                ├───────────────────>│                   │               │
  │           │                │                    │ track entry date  │               │
  │           │                │                    │                   │               │
  │           │                │ selectTeamsAnd     │                   │               │
  │           │                │ Substitutes()      │                   │               │
  │           │                ├───────────────────>│                   │               │
  │           │                │                    │ calculateEnhanced │               │
  │           │                │                    │ Priority()        │               │
  │           │                │                    │ (for each person) │               │
  │           │                │                    │                   │               │
  │           │                │                    │ calculatePerson   │               │
  │           │                │                    │ Priority()        │               │
  │           │                │                    ├──────────────────>│               │
  │           │                │                    │                   │ calculate     │
  │           │                │                    │                   │ Penalized     │
  │           │                │                    │                   │ Priority()    │
  │           │                │                    │<──────────────────┤               │
  │           │                │                    │ finalPriority     │               │
  │           │                │                    │                   │               │
  │           │                │                    │ Sort by priority  │               │
  │           │                │                    │ (deterministic)   │               │
  │           │                │<───────────────────┤                   │               │
  │           │                │ {team, substitutes}│                   │               │
  │           │                │                    │                   │               │
  │           │                │ shuffle assigned   │                   │               │
  │           │                │ people (variety)   │                   │               │
  │           │                │                    │                   │               │
  │           │                │ updateState()      │                   │               │
  │           │                ├───────────────────>│                   │               │
  │           │                │                    │ update()          │               │
  │           │                │                    ├──────────────────>│               │
  │           │                │                    │                   │ updateBayesian│
  │           │                │                    │                   │ State()       │
  │           │                │                    │<──────────────────┤               │
  │           │                │<───────────────────┤                   │               │
  │           │                │                    │                   │               │
  │           │                │  ╔════════════════════════════════╗    │               │
  │           │                │  ║ End For Each Week              ║    │               │
  │           │                │  ╚════════════════════════════════╝    │               │
│           │                │                    │                   │               │
│           │                │ checkFairness()    │                   │               │
│           │                │ (people, schedules,│                   │               │
│           │                │  evaluationDate)   │                   │               │
│           │                ├───────────────────>│                   │               │
│           │                │                    │ calculateEnhanced │               │
│           │                │                    │ Priority() for    │               │
│           │                │                    │ rates & deficits  │               │
│           │                │                    │                   │               │
│           │                │                    │ calculate         │               │
│           │                │                    │ FairnessMetrics() │               │
│           │                │                    │ (internal)        │               │
│           │                │                    │                   │               │
│           │                │<───────────────────┤                   │               │
│           │                │ {warnings,         │                   │               │
│           │                │  metrics}          │                   │               │
  │           │                │                    │                   │               │
  │           │<───────────────┤                    │                   │               │
  │           │ ScheduleGenerationResult            │                   │               │
  │           │                │                    │                   │               │
  │           │ updateYearData()                    │                   │               │
  │           │                │                    │                   │               │
  │           │ saveYearDataToFile()                │                   │               │
  │           ├────────────────────────────────────────────────────────────────────────>│
  │           │                │                    │                   │  File System  │
  │           │                │                    │                   │  Access API   │
  │           │                │                    │                   │  (async)      │
  │           │<────────────────────────────────────────────────────────────────────────┤
  │           │                │                    │                   │               │
  │<──────────┤                │                    │                   │               │
  │ Toast:    │                │                    │                   │               │
  │ Success   │                │                    │                   │               │
  │           │                │                    │                   │               │
```

**Erklärung**:
1. Nutzer klickt "Zeitplan generieren" in ScheduleTab
2. scheduleEngine.generateSchedule() validiert Eingaben (Datum, Wochenzahl)
3. Filtert aktive Personen für den Zeitraum
4. Erstellt neue AdaptiveFairnessManager-Instanz (enthält DynamicFairnessEngine)
5. Für jede Woche:
   - markPersonAvailableForScheduling() trackt Eintrittsdatum
   - selectTeamsAndSubstitutes() berechnet Enhanced Priority für jede Person
   - calculatePersonPriority() ruft calculatePenalizedPriority() auf (L4 Regularisierung)
   - Sortierung nach Priority (deterministisch, höchste Priorität = größter Bedarf)
   - Top-Prioritäten werden ausgewählt für Team und Ersatz
   - updateState() aktualisiert akkumulierte Assignments
6. Fairness-Prüfung mit checkFairness() (berechnet Metriken intern)
7. Rückgabe ScheduleGenerationResult
8. **Async** Save via File System Access API
9. Toast-Benachrichtigung

---

## 3. Use-Case-Diagramm

```
                    GießPlan System
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │   ┌─────────────────────────────────────┐       │
    │   │   Systeminitialisierung             │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Ordner auswählen      │          │       │
    │   │  │ (File System API)     │◄─────────┼───────┼─────  Koordinator
    │   │  └───────────────────────┘  «include»│      │       (Hauptakteur)
    │   └─────────────────────────────────────┘       │
    │                                                 │
    │   ┌─────────────────────────────────────┐       │
    │   │   Personenverwaltung                │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Person hinzufügen     │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Abgang markieren      │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Rückkehr erfassen     │          │       │
    │   │  └───────────────────────┘          │       │
    │   └─────────────────────────────────────┘       │
    │                                                 │
    │   ┌─────────────────────────────────────┐       │
    │   │   Zeitplan-Generierung              │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Zeitplan generieren   │◄─────────┼───────┼─────  Koordinator
    │   │  └───────────────────────┘   uses   │       │       (Hauptakteur)
    │   │         │                            │       │
    │   │         │ «include»                  │       │
    │   │         ▼                            │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Fairness berechnen    │          │       │
    │   │  └───────────────────────┘          │       │
    │   │         │                            │       │
    │   │         │ automatic                  │       │
    │   │         ▼                            │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Mentor-Mentee         │          │       │
    │   │  │ automatisch pairen    │          │       │
    │   │  └───────────────────────┘          │       │
    │   └─────────────────────────────────────┘       │
    │                                                 │
    │   ┌─────────────────────────────────────┐       │
    │   │   Manuelle Anpassungen              │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Person ersetzen       │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Personen tauschen     │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Kommentar hinzufügen  │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Schedule löschen      │          │       │
    │   │  └───────────────────────┘          │       │
    │   └─────────────────────────────────────┘       │
    │                                                 │
    │   ┌─────────────────────────────────────┐       │
    │   │   Datenmanagement                   │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ CSV exportieren       │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ JSON-Backup           │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Statistiken anzeigen  │          │       │
    │   │  └───────────────────────┘          │       │
    │   └─────────────────────────────────────┘       │
    │                                                 │
    └─────────────────────────────────────────────────┘

    «extend»
    ┌───────────────────────┐
    │ Warnung bei Constraint│ (optional bei Generierung)
    │ Violation anzeigen    │
    └───────────────────────┘
```

**Akteure**:
- **Koordinator**: Hauptnutzer, plant Zeitpläne und verwaltet Personen

**Use Cases**:
- **Systeminitialisierung**: Ordnerauswahl via File System Access API (erforderlich vor Nutzung)
- **Personenverwaltung**: CRUD für Teilnehmer (Hinzufügen, Abgang, Rückkehr)
- **Zeitplan-Generierung**: Automatische faire Planung mit Fairness-Berechnung
- **Manuelle Anpassungen**: Spontane Änderungen (Ersetzen, Tauschen, Kommentare, Löschen)
- **Datenmanagement**: Export (CSV, JSON), Statistiken

**Beziehungen**:
- «include»: Ordner auswählen ist Voraussetzung; Fairness berechnen wird automatisch eingebunden
- «extend»: Warnung bei Constraint Violations ist optionale Erweiterung
- **Mentor-Pairing**: Automatisch in Zeitplan-Generierung integriert (kein separater Use Case)

---

## 4. Komponentendiagramm

```
┌─────────────────────────────────────────────────────────────┐
│                     GießPlan System                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Presentation Layer (React UI)               │    │
│  │  ┌────────────┐  ┌────────────────────────────┐     │    │
│  │  │  App.tsx   │  │   FolderSelector.tsx       │     │    │
│  │  │ (Main Tab  │  │   (File System Access API) │     │    │
│  │  │ Container) │  └────────────────────────────┘     │    │
│  │  └────────────┘                                      │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │    │
│  │  │ PeopleTab  │  │ScheduleTab │  │ ManualTab  │     │    │
│  │  └────────────┘  └────────────┘  └────────────┘     │    │
│  │  ┌────────────┐  ┌────────────────────────────┐     │    │
│  │  │  DataTab   │  │   UI Components Library    │     │    │
│  │  └────────────┘  │ (shadcn/ui + Radix UI)     │     │    │
│  │  ┌──────────────────┐                          │     │    │
│  │  │ AddPersonDialog  │                          │     │    │
│  │  │ ErrorFallback    │                          │     │    │
│  │  └──────────────────┘                          │     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ Props / Events / State         │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │    Business Logic Layer (src/lib/)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ scheduleEngine│  │ personManager│  │ export   │   │    │
│  │  │ (module)     │  │ (module)     │  │ Utils    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ dateUtils    │  │ adaptive     │                 │    │
│  │  │              │  │ Fairness     │                 │    │
│  │  │              │  │ (class)      │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  │  ┌──────────────┐                                   │    │
│  │  │ fairnessEngine│ ← legacy layer with active      │    │
│  │  │ (utilities + │   functions (selectTeamsAnd     │    │
│  │  │  helpers)    │   Substitutes, isPersonActive,  │    │
│  │  │              │   calculateTotalDaysPresent)    │    │
│  │  └──────────────┘                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ Function Calls / Imports       │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │    Fairness Engine Core (fairness/ package)         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ index.ts     │  │ bayesianState│  │ penalized│   │    │
│  │  │ (Dynamic     │  │ (Kalman      │  │ Priority │   │    │
│  │  │ Fairness     │  │ filter)      │  │ (L4 reg.)│   │    │
│  │  │ Engine class)│  └──────────────┘  └──────────┘   │    │
│  │  └──────────────┘  ┌──────────────┐                 │    │
│  │  ┌──────────────┐  │ softmax      │                 │    │
│  │  │ fairness     │  │ Selection    │                 │    │
│  │  │ Constraints  │  │ (probability)│                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  │  ┌──────────────┐                                   │    │
│  │  │ random.ts    │  (SeededRandom class)             │    │
│  │  │ types.ts     │  (interfaces)                     │    │
│  │  └──────────────┘                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ State Updates / Persistence    │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Data Persistence Layer                    │    │
│  │  ┌──────────────────────┐  ┌──────────────────┐     │    │
│  │  │ fileStorage.ts       │  │ storage.ts       │     │    │
│  │  │ (File System Access  │  │ (IndexedDB for   │     │    │
│  │  │  API integration)    │  │  directory handle│     │    │
│  │  │                      │  │  caching)        │     │    │
│  │  └──────────────────────┘  └──────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  File System   │
                    │  (Local Disk)  │
                    │  + IndexedDB   │
                    └────────────────┘

External Dependencies:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   React 19   │  │ TypeScript 5 │  │ TailwindCSS 4│
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Radix UI    │  │   date-fns   │  │   Vitest 4   │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│   uuid lib   │  │   Vite 6     │
└──────────────┘  └──────────────┘
```

**Schichten**:
1. **Presentation Layer**: React UI-Komponenten (App, Tabs, Dialogs, UI Library)
2. **Business Logic Layer (src/lib/)**: Orchestrierung und Utilities
   - scheduleEngine, personManager (functional modules)
   - adaptiveFairness (AdaptiveFairnessManager class)
   - fairnessEngine (legacy compatibility layer)
3. **Fairness Engine (fairness/ package)**: Kern-Algorithmen (mathematisch)
   - DynamicFairnessEngine (class)
   - Functional modules: bayesianState, penalizedPriority, softmaxSelection, constraints
4. **Data Persistence**: File System Access API + IndexedDB

**Datenfluss**: Top-Down (UI → Business Logic → Fairness Engine → Persistence)

**Wichtige Komponenten**:
- **FolderSelector**: Kritisch für File System Access API-Zugriff (Ordnerauswahl)
- **fairness/ package**: Separates Paket mit Kern-Algorithmen (wiederverwendbar)
- **IndexedDB**: Caching von Directory Handles für persistenten Zugriff

---

## 5. Aktivitätsdiagramm - Person hinzufügen

```
    ┌─ Start ─┐
         │
         ▼
   ┌──────────────┐
   │ Nutzer öffnet│
   │ "Person      │
   │ hinzufügen"  │
   └──────────────┘
         │
         ▼
   ┌──────────────┐
   │ AddPerson    │
   │ Dialog       │
   │ anzeigen     │
   └──────────────┘
         │
         ▼
   ┌──────────────┐
   │ Name         │
   │ eingeben     │
   └──────────────┘
         │
         ▼
   ┌──────────────┐
   │ Ankunftsdatum│
   │ wählen       │
   └──────────────┘
         │
         ▼
   ┌──────────────┐     Nein
   │ Name leer?   ├────────────┐
   └──────────────┘            │
         │ Ja                  │
         ▼                     │
   ┌──────────────┐            │
   │ Fehler:      │            │
   │ "Name        │            │
   │ erforderlich"│            │
   └──────────────┘            │
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
              ┌──────────────┐
              │ personManager│
              │ .createPerson│
              │ () aufrufen  │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ UUID         │
              │ generieren   │
              │ (uuid lib)   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ TimePeriod   │
              │ erstellen    │
              │ (Start: heute│
              │  End: null)  │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Fairness-    │
              │ Metriken     │
              │ initialisieren│
              │ (Defaults)   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ experienceLevel│
              │ = 'new'      │
              │ setzen       │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Person-Objekt│
              │ zurückgeben  │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Person zu    │
              │ YearData     │
              │ .people[]    │
              │ hinzufügen   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ YearData     │
              │ .lastModified│
              │ aktualisieren│
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ saveYearData │
              │ ToFile()     │
              │ (async)      │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ File System  │
              │ Access API   │
              │ write JSON   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ UI State     │
              │ aktualisieren│
              │ (re-render)  │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Toast:       │
              │ "Person      │
              │ hinzugefügt" │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Dialog       │
              │ schließen    │
              └──────────────┘
                    │
                    ▼
                ┌─ Ende ─┐
```

**Schritte**:
1. Nutzer öffnet AddPersonDialog
2. Eingabe von Name und Ankunftsdatum
3. Validierung: Name erforderlich
4. Aufruf von `personManager.createPerson()` (functional module)
5. Person-Objekt erstellen:
   - UUID generieren (uuid library)
   - TimePeriod-Array mit einem Eintrag (startDate: heute, endDate: null)
   - FairnessMetrics mit Default-Werten initialisieren
   - experienceLevel auf 'new' setzen
   - **KEINE Virtual History** (deprecated system)
6. Person zu YearData.people[] hinzufügen
7. lastModified-Timestamp aktualisieren
8. **Async** saveYearDataToFile() via File System Access API
9. UI-State aktualisieren (React re-render)
10. Success-Toast anzeigen
11. Dialog schließen

---

## Legende

**UML-Symbole**:
- ┌─┐ Box = Klasse/Komponente/Modul
- «class» = Tatsächliche TypeScript/JavaScript-Klasse
- «module» = Funktionales Modul (Sammlung von Funktionen)
- «interface» = TypeScript-Interface (keine Klasse)
- ─── Linie = Assoziation/Beziehung
- ──> Pfeil = Abhängigkeit/Datenfluss/Import
- ◄─── Pfeil links = Rückgabe/Response
- ╔═══╗ Doppelbox = Loop/Iteration/Schleife
- ◊ Raute = Entscheidung (if/else)

**Kardinalitäten**:
- 1 = genau eins
- 0..1 = null oder eins
- 0..* = null bis viele
- 1..* = eins bis viele
- * = beliebig viele

**Beziehungen**:
- "contains" = Komposition (Teil-von-Beziehung)
- "uses" = Abhängigkeit (nutzt Funktionalität)
- "imports" = Import-Beziehung (ES6 modules)
- "creates" = Erzeugt Instanzen/Objekte
- «include» = Immer eingebunden
- «extend» = Optional erweitert

---

<div align="center">

**Anhang A: UML-Diagramme**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

Dezember 2025

</div>
