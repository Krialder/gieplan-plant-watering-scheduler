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
┌────────────────────────────────────────────────────────────────┐
│                  AdaptiveFairnessManager                       │
├────────────────────────────────────────────────────────────────┤
│ - people: Person[]                                             │
│ - bayesianStates: Map<string, BayesianState>                   │
│ - priorities: Map<string, number>                              │
│ - constraints: FairnessConstraints                             │
│ - rng: SeededRandom                                            │
├────────────────────────────────────────────────────────────────┤
│ + constructor(config: FairnessConfig)                          │
│ + selectTeam(options: TeamSelectionOptions): string[]          │
│ + selectSubstitutes(options: SubstituteOptions): string[]      │
│ + updateAfterAssignment(teamIds: string[], date: string)       │
│ + getFairnessScore(personId: string): number                   │
│ + checkConstraints(): ConstraintViolation[]                    │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ uses
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ BayesianState  │  │   Priority     │  │ SoftmaxSelect  │
│    Manager     │  │   Calculator   │  │   ion Engine   │
├────────────────┤  ├────────────────┤  ├────────────────┤
│ + update()     │  │ + calculate()  │  │ + select()     │
│ + get()        │  │ + getPenalty() │  │ + gumbelMax()  │
│ + initialize() │  │ + getBonus()   │  │ + softmax()    │
└────────────────┘  └────────────────┘  └────────────────┘
        │                   │                   │
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                ┌────────────────────────┐
                │  FairnessConstraints   │
                ├────────────────────────┤
                │ + maxGini: number      │
                │ + maxCV: number        │
                │ + minRateRatio: number │
                ├────────────────────────┤
                │ + checkGini()          │
                │ + checkCV()            │
                │ + checkRatio()         │
                └────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                        Person                                  │
├────────────────────────────────────────────────────────────────┤
│ - id: string                                                   │
│ - name: string                                                 │
│ - arrivalDate: string                                          │
│ - actualDepartureDate: string | null                           │
│ - programPeriods: TimePeriod[]                                 │
│ - experienceLevel: 'new' | 'experienced'                       │
│ - fairnessMetrics: FairnessMetrics                             │
├────────────────────────────────────────────────────────────────┤
│ + isActiveOn(date: string): boolean                            │
│ + getTotalDaysPresent(endDate: string): number                 │
│ + isExperienced(referenceDate: string): boolean                │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ has
                            ▼
                ┌────────────────────────┐
                │   FairnessMetrics      │
                ├────────────────────────┤
                │ + temporalScore: float │
                │ + assignmentsPerDay    │
                │ + crossYearDebt: float │
                │ + mentorBurden: float  │
                │ + lastUpdated: string  │
                └────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      ScheduleEngine                            │
├────────────────────────────────────────────────────────────────┤
│ + generateSchedule(options: ScheduleOptions): ScheduleResult   │
│ + validateOptions(options: ScheduleOptions): ValidationResult  │
│ + getActivePeople(people: Person[], date: string): Person[]    │
│ - createWeekAssignment(...): WeekAssignment                    │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ creates
                            ▼
                ┌────────────────────────┐
                │   WeekAssignment       │
                ├────────────────────────┤
                │ + weekNumber: number   │
                │ + weekStartDate: string│
                │ + assignedPeople: []   │
                │ + substitutes: []      │
                │ + hasMentor: boolean   │
                │ + fairnessScores: []   │
                └────────────────────────┘
```

**Erklärung**:
- **AdaptiveFairnessManager**: Zentrale Klasse für Fairness-Orchestrierung
- **BayesianStateManager**: Verwaltet probabilistische Zustände
- **PriorityCalculator**: Berechnet Penalized Priority Scores
- **SoftmaxSelectionEngine**: Führt stochastische Team-Auswahl durch
- **Person**: Kern-Entität mit Fairness-Metriken
- **ScheduleEngine**: Orchestriert Zeitplan-Generierung

---

## 2. Sequenzdiagramm - Zeitplan-Generierung

```
Koordinator    UI Component    ScheduleEngine    FairnessManager    Person[]    FileStorage
    │               │                │                  │              │               │
    │ Generate      │                │                  │              │               │
    │ Schedule      │                │                  │              │               │
    ├──────────────>│                │                  │              │               │
    │               │ validate()     │                  │              │               │
    │               ├───────────────>│                  │              │               │
    │               │                │ getActivePeople()│              │               │
    │               │                ├────────────────────────────────>│               │
    │               │                │                  │              │               │
    │               │                │ new FairnessManager()           │               │
    │               │                ├─────────────────>│              │               │
    │               │                │                  │ initStates() │               │
    │               │                │                  ├─────────────>│               │
    │               │                │                  │              │               │
    │               │                │  ╔═══════════════════════════╗  │               │
    │               │                │  ║ For Each Week (1..52)     ║  │               │
    │               │                │  ╚═══════════════════════════╝  │               │
    │               │                │                  │              │               │
    │               │                │ selectTeam()     │              │               │
    │               │                ├─────────────────>│              │               │
    │               │                │                  │ getPriorities()              │
    │               │                │                  ├─────────────>│               │
    │               │                │                  │              │               │
    │               │                │                  │ gumbelSoftmax()              │
    │               │                │                  │ (internal)   │               │
    │               │                │                  │              │               │
    │               │                │                  │ checkMentor()                │
    │               │                │                  ├─────────────>│               │
    │               │                │                  │              │               │
    │               │                │                  │<─────────────┤               │
    │               │                │                  │ selectedTeam │               │
    │               │                │<─────────────────┤              │               │
    │               │                │ teamIds          │              │               │
    │               │                │                  │              │               │
    │               │                │ selectSubstitutes()             │               │
    │               │                ├─────────────────>│              │               │
    │               │                │                  │<─────────────┤               │
    │               │                │ substituteIds    │              │               │
    │               │                │<─────────────────┤              │               │
    │               │                │                  │              │               │
    │               │                │ updateAfterAssignment()         │               │
    │               │                ├─────────────────>│              │               │
    │               │                │                  │ updateBayesian()             │
    │               │                │                  ├─────────────>│               │
    │               │                │                  │              │               │
    │               │                │  ╔═══════════════════════════╗  │               │
    │               │                │  ║ End For Each Week         ║  │               │
    │               │                │  ╚═══════════════════════════╝  │               │
    │               │                │                  │              │               │
    │               │                │ checkConstraints()              │               │
    │               │                ├─────────────────>│              │               │
    │               │                │                  │ calculateGini()              │
    │               │                │                  │ calculateCV()                │
    │               │                │                  │              │               │
    │               │                │<─────────────────┤              │               │
    │               │                │ violations[]     │              │               │
    │               │                │                  │              │               │
    │               │<───────────────┤                  │              │               │
    │               │ schedule       │                  │              │               │
    │               │                │                  │              │               │
    │               │ saveSchedule() │                  │              │               │
    │               ├──────────────────────────────────────────────────────────────>│
    │               │                │                  │              │               │
    │<──────────────┤                │                  │              │               │
    │ Success       │                │                  │              │               │
    │               │                │                  │              │               │
```

**Erklärung**:
1. Nutzer initiiert Zeitplan-Generierung über UI
2. ScheduleEngine validiert Eingaben
3. FairnessManager wird mit Personen initialisiert
4. Für jede Woche:
   - Prioritäten berechnen
   - Team via Gumbel-Softmax auswählen
   - Ersatzpersonen auswählen
   - Bayesian States aktualisieren
5. Constraint-Prüfung (Gini, CV)
6. Zeitplan speichern
7. Erfolg an Nutzer melden

---

## 3. Use-Case-Diagramm

```
                    GießPlan System
    ┌─────────────────────────────────────────────────┐
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
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Mentor-Pairing        │          │       │
    │   │  └───────────────────────┘          │       │
    │   │  ┌───────────────────────┐          │       │
    │   │  │ Fairness prüfen       │          │       │
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

    «include»
    ┌───────────────────────┐
    │ Fairness berechnen    │ (von allen Use Cases genutzt)
    └───────────────────────┘

    «extend»
    ┌───────────────────────┐
    │ Warnung bei Violation │ (optional bei Generierung)
    └───────────────────────┘
```

**Akteure**:
- **Koordinator**: Hauptnutzer, plant Zeitpläne

**Use Cases**:
- **Personenverwaltung**: CRUD für Teilnehmer
- **Zeitplan-Generierung**: Automatische faire Planung
- **Manuelle Anpassungen**: Spontane Änderungen
- **Datenmanagement**: Export, Backup, Statistiken

**Beziehungen**:
- «include»: Fairness-Berechnung wird von allen Use Cases genutzt
- «extend»: Warnung bei Violations ist optionale Erweiterung

---

## 4. Komponentendiagramm

```
┌─────────────────────────────────────────────────────────────┐
│                     GießPlan System                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Presentation Layer (React UI)               │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │    │
│  │  │ PeopleTab  │  │ScheduleTab │  │ ManualTab  │     │    │
│  │  └────────────┘  └────────────┘  └────────────┘     │    │
│  │  ┌────────────┐  ┌────────────────────────────┐     │    │
│  │  │  DataTab   │  │   UI Components Library    │     │    │
│  │  └────────────┘  │   (Radix UI + Custom)      │     │    │
│  │                  └────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ Props / Events                 │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Business Logic Layer                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ Schedule     │  │ Person       │  │ Export   │   │    │
│  │  │ Engine       │  │ Manager      │  │ Utils    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ Date Utils   │  │ Adaptive     │                 │    │
│  │  │              │  │ Fairness     │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ Function Calls                 │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Fairness Engine (Core Algorithms)           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │    │
│  │  │ Bayesian     │  │ Penalized    │  │ Softmax  │   │    │
│  │  │ State        │  │ Priority     │  │ Selection│   │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ Fairness     │  │ Random       │                 │    │
│  │  │ Constraints  │  │ Utils        │                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ State Updates                  │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Data Persistence Layer                    │    │
│  │  ┌──────────────┐  ┌──────────────┐                 │    │
│  │  │ File Storage │  │ IndexedDB    │                 │    │
│  │  │ (JSON Files) │  │ (Handle Cache)                 │    │
│  │  └──────────────┘  └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  File System   │
                    │  (Local Disk)  │
                    └────────────────┘

External Dependencies:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   React 19   │  │ TypeScript 5 │  │ TailwindCSS  │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Radix UI    │  │   date-fns   │  │   Vitest     │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Schichten**:
1. **Presentation Layer**: React UI-Komponenten
2. **Business Logic Layer**: Orchestrierung, Validation
3. **Fairness Engine**: Kern-Algorithmen (mathematisch)
4. **Data Persistence**: File Storage, Caching

**Datenfluss**: Top-Down (UI → Logic → Engine → Storage)

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
              │ UUID         │
              │ generieren   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ TimePeriod   │
              │ erstellen    │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Fairness-    │
              │ Metriken     │
              │ initialisieren│
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Virtual      │
              │ History      │
              │ berechnen    │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Person zu    │
              │ Liste        │
              │ hinzufügen   │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ Daten        │
              │ speichern    │
              │ (JSON)       │
              └──────────────┘
                    │
                    ▼
              ┌──────────────┐
              │ UI           │
              │ aktualisieren│
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
                ┌─ Ende ─┐
```

**Schritte**:
1. Dialog öffnen
2. Daten eingeben
3. Validierung (Name erforderlich)
4. Person-Objekt erstellen (UUID, TimePeriod)
5. Fairness-Metriken initialisieren mit Virtual History
6. Zur Liste hinzufügen
7. Speichern (JSON-Datei)
8. UI aktualisieren
9. Erfolg-Toast anzeigen

---

## Legende

**UML-Symbole**:
- ┌─┐ Box = Klasse/Komponente
- ─── Linie = Assoziation
- ──> Pfeil = Abhängigkeit/Datenfluss
- ◄─── Pfeil links = Rückgabe
- ╔═══╗ Doppelbox = Loop/Iteration
- ◊ Raute = Entscheidung

**Kardinalitäten**:
- 1 = genau eins
- 0..1 = null oder eins
- 0..* = null bis viele
- 1..* = eins bis viele

---

<div align="center">

**Anhang A: UML-Diagramme**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

Monat Jahr

</div>
