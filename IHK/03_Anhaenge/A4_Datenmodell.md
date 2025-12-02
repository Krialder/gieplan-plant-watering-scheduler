# Anhang B: Datenmodell und ER-Diagramme

## IHK Abschlussprojekt - GießPlan

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor

---

## Inhaltsverzeichnis

1. [Entity-Relationship-Diagramm](#1-entity-relationship-diagramm)
2. [TypeScript Interface-Definitionen](#2-typescript-interface-definitionen)
3. [JSON-Schema](#3-json-schema)
4. [Datenbank-Alternative (SQL)](#4-datenbank-alternative-sql)

---

## 1. Entity-Relationship-Diagramm

### Konzeptuelles ER-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                         YearData                                │
│  (Container für alle Daten eines Jahres)                        │
├─────────────────────────────────────────────────────────────────┤
│  PK  year: number                                               │
│      lastModified: string (ISO Date)                            │
└─────────────────────────────────────────────────────────────────┘
       │                                  │
       │ 1                                │ 1
       │                                  │
       │ *                                │ *
       ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│      Person          │         │      Schedule        │
├──────────────────────┤         ├──────────────────────┤
│ PK id: string (UUID) │         │ PK id: string (UUID) │
│    name: string      │         │    startDate: string │
│    arrivalDate: str  │         │    weeks: number     │
│    expectedDeparture │         │    createdAt: string │
│    actualDeparture   │         └──────────────────────┘
│    experienceLevel   │                 │
└──────────────────────┘                 │ 1
       │                                 │
       │ 1                               │ *
       │                                 ▼
       │ *                       ┌──────────────────────┐
       ▼                         │   WeekAssignment     │
┌──────────────────────┐         ├──────────────────────┤
│   TimePeriod         │         │    weekNumber: int   │
├──────────────────────┤         │    weekStartDate: str│
│    startDate: string │         │    hasMentor: bool   │
│    endDate: string   │         │    comment: string   │
│    departureReason   │         │    isEmergency: bool │
└──────────────────────┘         └──────────────────────┘
       │                                 │
       │                                 │ *
       │ 1                               │
       │                                 │ *
       │ *                               ▼
       ▼                         ┌──────────────────────┐
┌──────────────────────┐         │   Assignment         │
│  FairnessMetrics     │         │   (Join Table)       │
├──────────────────────┤         ├──────────────────────┤
│ temporalFairnessScore│         │ FK personId: string  │
│ assignmentsPerDay    │         │ FK weekId: string    │
│ crossYearDebt        │         │    role: "main" |    │
│ mentorBurdenScore    │         │          "substitute"│
│ recentBalance        │         │    fairnessScore     │
│ lastUpdated          │         └──────────────────────┘
└──────────────────────┘

Legende:
─── 1:n Beziehung
PK  Primary Key
FK  Foreign Key
```

### Beziehungen erklärt

**YearData ──< Person** (1:n)
- Ein Jahr enthält viele Personen
- Jede Person gehört zu genau einem Jahr

**YearData ──< Schedule** (1:n)
- Ein Jahr kann mehrere Zeitpläne haben
- Jeder Zeitplan gehört zu einem Jahr

**Person ──< TimePeriod** (1:n)
- Eine Person kann mehrere Teilnahmeperioden haben (Mehrfachteilnahme)
- Jede Periode gehört zu genau einer Person

**Person ── FairnessMetrics** (1:1)
- Jede Person hat genau ein FairnessMetrics-Objekt
- Metrics sind eingebettet in Person

**Schedule ──< WeekAssignment** (1:n)
- Ein Zeitplan enthält viele Wochenzuweisungen
- Jede Wochenzuweisung gehört zu einem Zeitplan

**WeekAssignment ──< Person** (n:m über Assignment)
- Eine Woche hat mehrere zugewiesene Personen (2 Haupt + 2 Ersatz)
- Eine Person kann in mehreren Wochen zugewiesen sein
- Implementiert als Arrays: `assignedPeople: string[]`, `substitutes: string[]`

---

## 2. TypeScript Interface-Definitionen

### 2.1 Kern-Entitäten

```typescript
/**
 * Container für alle Daten eines Kalenderjahres.
 * Wird als einzelne JSON-Datei gespeichert (z.B. yearData_2025.json).
 */
export interface YearData {
  year: number;                    // Kalenderjahr (z.B. 2025)
  people: Person[];                // Alle Personen dieses Jahres
  schedules: Schedule[];           // Alle Zeitpläne dieses Jahres
  lastModified: string;            // ISO-Timestamp der letzten Änderung
}

/**
 * Repräsentiert einen Teilnehmer im Programm.
 * Unterstützt Mehrfachteilnahme durch programPeriods.
 */
export interface Person {
  id: string;                      // UUID v4
  name: string;                    // Vollständiger Name
  arrivalDate: string;             // ISO Date (YYYY-MM-DD) - Erste Ankunft
  expectedDepartureDate: string | null;  // Geplanter Abgang
  actualDepartureDate: string | null;    // Tatsächlicher Abgang
  programPeriods: TimePeriod[];    // Historie aller Teilnahmeperioden
  experienceLevel: 'new' | 'experienced';  // Basierend auf Tenure
  mentorshipAssignments: string[]; // IDs der betreuten Mentees
  fairnessMetrics: FairnessMetrics;
}

/**
 * Zeitperiode einer Programmteilnahme.
 * Ermöglicht Tracking von Abgängen und Rückkehrern.
 */
export interface TimePeriod {
  startDate: string;               // ISO Date - Beginn dieser Periode
  endDate: string | null;          // ISO Date - Ende (null = aktuell aktiv)
  departureReason?: string;        // Grund für Abgang (optional)
}

/**
 * Fairness-Metriken pro Person.
 * Werden kontinuierlich aktualisiert basierend auf Zuweisungen.
 */
export interface FairnessMetrics {
  temporalFairnessScore: number;   // 1.0 = perfekt fair, relativ zu Anwesenheit
  assignmentsPerDayPresent: number; // Rate (z.B. 0.143 = 1 pro 7 Tage)
  crossYearFairnessDebt: number;   // Ausgleich über Jahresgrenzen (-1 bis +1)
  mentorshipBurdenScore: number;   // Zusatzlast durch Mentoring (0-1)
  recentAssignmentBalance: number; // Kurzfristige Fairness (-n bis +n)
  lastUpdated: string;             // ISO Timestamp
}

/**
 * Vollständiger Zeitplan für einen definierten Zeitraum.
 */
export interface Schedule {
  id: string;                      // UUID v4
  startDate: string;               // ISO Date - Erster Montag
  weeks: number;                   // Anzahl Wochen (1-52)
  assignments: WeekAssignment[];   // Wochenzuweisungen
  createdAt: string;               // ISO Timestamp
  modifiedAt?: string;             // ISO Timestamp bei Änderungen
}

/**
 * Zuweisung für eine einzelne Woche.
 */
export interface WeekAssignment {
  weekNumber: number;              // Fortlaufende Nummer (1-52)
  weekStartDate: string;           // ISO Date - Montag dieser Woche
  assignedPeople: string[];        // 2 Person-IDs (Hauptzuweisung)
  substitutes?: string[];          // 2 Person-IDs (Ersatz)
  fairnessScores: number[];        // Fairness-Score pro zugewiesener Person
  hasMentor: boolean;              // Mindestens 1 erfahrene Person dabei
  comment?: string;                // Optionaler Kommentar
  isEmergency?: boolean;           // Notfall-Markierung
}
```

### 2.2 Konfiguration und Optionen

```typescript
/**
 * Optionen für Zeitplan-Generierung.
 */
export interface ScheduleOptions {
  people: Person[];                // Verfügbare Personen
  startDate: string;               // ISO Date - Muss ein Montag sein
  weeks: number;                   // Anzahl zu generierender Wochen
  requireMentor?: boolean;         // Mentor-Anforderung (default: true)
  avoidConsecutive?: boolean;      // Keine aufeinanderfolgenden Wochen
  includeFutureArrivals?: boolean; // Zukünftige Ankünfte einplanen
  seed?: number;                   // Seed für reproduzierbare Zufälligkeit
}

/**
 * Ergebnis der Zeitplan-Generierung.
 */
export interface ScheduleResult {
  success: boolean;
  schedule?: Schedule;             // Bei Erfolg
  errors?: string[];               // Bei Fehlern
  warnings?: ConstraintViolation[]; // Bei Fairness-Violations
}

/**
 * Fairness-Constraints für Validierung.
 */
export interface FairnessConstraints {
  maxGiniCoefficient: number;      // Default: 0.25
  maxCoefficientOfVariation: number; // Default: 0.30
  minAssignmentRateRatio: number;  // Default: 0.80 (min/max)
  maxAssignmentRateRatio: number;  // Default: 1.20 (max/min)
}

/**
 * Constraint-Verletzung.
 */
export interface ConstraintViolation {
  type: 'gini' | 'cv' | 'rate_ratio' | 'mentor_missing';
  value: number;                   // Gemessener Wert
  threshold: number;               // Erlaubter Schwellwert
  message: string;                 // Menschenlesbare Beschreibung
  severity: 'warning' | 'error';
}
```

### 2.3 Bayesian State

```typescript
/**
 * Bayesian Random Walk Zustand pro Person.
 * Basierend auf Kalman-Filter.
 */
export interface BayesianState {
  posteriorMean: number;           // μ - Erwartete Zuweisungsrate
  posteriorVariance: number;       // σ² - Unsicherheit
  observations: number;            // Anzahl Updates
  lastUpdated: string;             // ISO Timestamp
}
```

---

## 3. JSON-Schema

### Beispiel: yearData_2025.json

```json
{
  "year": 2025,
  "lastModified": "2025-12-02T10:30:00Z",
  "people": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Müller",
      "arrivalDate": "2025-01-15",
      "expectedDepartureDate": "2026-01-15",
      "actualDepartureDate": null,
      "programPeriods": [
        {
          "startDate": "2025-01-15",
          "endDate": null,
          "departureReason": null
        }
      ],
      "experienceLevel": "experienced",
      "mentorshipAssignments": [
        "660e8400-e29b-41d4-a716-446655440001"
      ],
      "fairnessMetrics": {
        "temporalFairnessScore": 0.98,
        "assignmentsPerDayPresent": 0.142,
        "crossYearFairnessDebt": 0.0,
        "mentorshipBurdenScore": 0.15,
        "recentAssignmentBalance": 0.0,
        "lastUpdated": "2025-12-02T10:30:00Z"
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Bob Schmidt",
      "arrivalDate": "2025-11-01",
      "expectedDepartureDate": "2026-11-01",
      "actualDepartureDate": null,
      "programPeriods": [
        {
          "startDate": "2025-11-01",
          "endDate": null
        }
      ],
      "experienceLevel": "new",
      "mentorshipAssignments": [],
      "fairnessMetrics": {
        "temporalFairnessScore": 1.0,
        "assignmentsPerDayPresent": 0.14,
        "crossYearFairnessDebt": 0.0,
        "mentorshipBurdenScore": 0.0,
        "recentAssignmentBalance": 0.0,
        "lastUpdated": "2025-12-02T10:30:00Z"
      }
    }
  ],
  "schedules": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "startDate": "2025-12-02",
      "weeks": 12,
      "createdAt": "2025-12-02T10:30:00Z",
      "assignments": [
        {
          "weekNumber": 1,
          "weekStartDate": "2025-12-02",
          "assignedPeople": [
            "550e8400-e29b-41d4-a716-446655440000",
            "660e8400-e29b-41d4-a716-446655440001"
          ],
          "substitutes": [
            "770e8400-e29b-41d4-a716-446655440003",
            "880e8400-e29b-41d4-a716-446655440004"
          ],
          "fairnessScores": [0.98, 1.0],
          "hasMentor": true,
          "comment": null,
          "isEmergency": false
        }
        // ... weitere Wochen
      ]
    }
  ]
}
```

### Schema-Validierung (JSON Schema Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "YearData",
  "type": "object",
  "required": ["year", "people", "schedules", "lastModified"],
  "properties": {
    "year": {
      "type": "integer",
      "minimum": 2020,
      "maximum": 2100
    },
    "lastModified": {
      "type": "string",
      "format": "date-time"
    },
    "people": {
      "type": "array",
      "items": { "$ref": "#/definitions/Person" }
    },
    "schedules": {
      "type": "array",
      "items": { "$ref": "#/definitions/Schedule" }
    }
  },
  "definitions": {
    "Person": {
      "type": "object",
      "required": ["id", "name", "arrivalDate", "programPeriods", "experienceLevel", "fairnessMetrics"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "arrivalDate": {
          "type": "string",
          "format": "date"
        },
        "experienceLevel": {
          "type": "string",
          "enum": ["new", "experienced"]
        }
      }
    }
  }
}
```

---

## 4. Datenbank-Alternative (SQL)

### Falls zukünftig SQL-Datenbank gewünscht (PostgreSQL)

```sql
-- Tabelle: years
CREATE TABLE years (
    year INTEGER PRIMARY KEY,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle: people
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL REFERENCES years(year),
    name VARCHAR(100) NOT NULL,
    arrival_date DATE NOT NULL,
    expected_departure_date DATE,
    actual_departure_date DATE,
    experience_level VARCHAR(20) NOT NULL CHECK (experience_level IN ('new', 'experienced')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_people_year ON people(year);
CREATE INDEX idx_people_arrival ON people(arrival_date);

-- Tabelle: time_periods
CREATE TABLE time_periods (
    id SERIAL PRIMARY KEY,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    departure_reason TEXT,
    CONSTRAINT valid_period CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_periods_person ON time_periods(person_id);

-- Tabelle: fairness_metrics
CREATE TABLE fairness_metrics (
    person_id UUID PRIMARY KEY REFERENCES people(id) ON DELETE CASCADE,
    temporal_fairness_score NUMERIC(5,4) NOT NULL,
    assignments_per_day_present NUMERIC(8,6) NOT NULL,
    cross_year_fairness_debt NUMERIC(5,4) NOT NULL DEFAULT 0,
    mentorship_burden_score NUMERIC(5,4) NOT NULL DEFAULT 0,
    recent_assignment_balance NUMERIC(5,4) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle: schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL REFERENCES years(year),
    start_date DATE NOT NULL,
    weeks INTEGER NOT NULL CHECK (weeks >= 1 AND weeks <= 52),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP
);

CREATE INDEX idx_schedules_year ON schedules(year);
CREATE INDEX idx_schedules_start ON schedules(start_date);

-- Tabelle: week_assignments
CREATE TABLE week_assignments (
    id SERIAL PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1),
    week_start_date DATE NOT NULL,
    has_mentor BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT,
    is_emergency BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_week_per_schedule UNIQUE (schedule_id, week_number)
);

CREATE INDEX idx_assignments_schedule ON week_assignments(schedule_id);

-- Tabelle: assignments (n:m Beziehung Person <-> Week)
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    week_assignment_id INTEGER NOT NULL REFERENCES week_assignments(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('main', 'substitute')),
    fairness_score NUMERIC(5,4),
    CONSTRAINT unique_person_per_week UNIQUE (week_assignment_id, person_id)
);

CREATE INDEX idx_assignments_week ON assignments(week_assignment_id);
CREATE INDEX idx_assignments_person ON assignments(person_id);

-- Tabelle: mentorship (n:m Beziehung Mentor <-> Mentee)
CREATE TABLE mentorship (
    mentor_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    PRIMARY KEY (mentor_id, mentee_id),
    CONSTRAINT no_self_mentoring CHECK (mentor_id != mentee_id)
);

CREATE INDEX idx_mentorship_mentor ON mentorship(mentor_id);
CREATE INDEX idx_mentorship_mentee ON mentorship(mentee_id);

-- View: Active People
CREATE VIEW active_people AS
SELECT p.*
FROM people p
WHERE EXISTS (
    SELECT 1 FROM time_periods tp
    WHERE tp.person_id = p.id
    AND tp.end_date IS NULL
);

-- View: Person Assignment Statistics
CREATE VIEW person_statistics AS
SELECT 
    p.id,
    p.name,
    p.arrival_date,
    COUNT(DISTINCT a.week_assignment_id) as total_assignments,
    COUNT(DISTINCT CASE WHEN a.role = 'main' THEN a.week_assignment_id END) as main_assignments,
    COUNT(DISTINCT CASE WHEN a.role = 'substitute' THEN a.week_assignment_id END) as substitute_assignments,
    fm.assignments_per_day_present as assignment_rate,
    fm.temporal_fairness_score as fairness_score
FROM people p
LEFT JOIN assignments a ON p.id = a.person_id
LEFT JOIN fairness_metrics fm ON p.id = fm.person_id
GROUP BY p.id, p.name, p.arrival_date, fm.assignments_per_day_present, fm.temporal_fairness_score;
```

### Migration: JSON → SQL

```typescript
/**
 * Migriert YearData von JSON zu PostgreSQL.
 */
async function migrateToSQL(yearData: YearData, db: PostgresConnection): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Jahr erstellen
    await tx.query('INSERT INTO years (year) VALUES ($1) ON CONFLICT DO NOTHING', [yearData.year]);
    
    // 2. Personen migrieren
    for (const person of yearData.people) {
      await tx.query(
        'INSERT INTO people (id, year, name, arrival_date, expected_departure_date, actual_departure_date, experience_level) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [person.id, yearData.year, person.name, person.arrivalDate, person.expectedDepartureDate, person.actualDepartureDate, person.experienceLevel]
      );
      
      // 2a. Zeitperioden
      for (const period of person.programPeriods) {
        await tx.query(
          'INSERT INTO time_periods (person_id, start_date, end_date, departure_reason) VALUES ($1, $2, $3, $4)',
          [person.id, period.startDate, period.endDate, period.departureReason]
        );
      }
      
      // 2b. Fairness-Metriken
      await tx.query(
        'INSERT INTO fairness_metrics (person_id, temporal_fairness_score, assignments_per_day_present, cross_year_fairness_debt, mentorship_burden_score, recent_assignment_balance) VALUES ($1, $2, $3, $4, $5, $6)',
        [person.id, person.fairnessMetrics.temporalFairnessScore, person.fairnessMetrics.assignmentsPerDayPresent, person.fairnessMetrics.crossYearFairnessDebt, person.fairnessMetrics.mentorshipBurdenScore, person.fairnessMetrics.recentAssignmentBalance]
      );
    }
    
    // 3. Zeitpläne migrieren
    for (const schedule of yearData.schedules) {
      await tx.query(
        'INSERT INTO schedules (id, year, start_date, weeks, created_at) VALUES ($1, $2, $3, $4, $5)',
        [schedule.id, yearData.year, schedule.startDate, schedule.weeks, schedule.createdAt]
      );
      
      // 3a. Wochenzuweisungen
      for (const assignment of schedule.assignments) {
        const result = await tx.query(
          'INSERT INTO week_assignments (schedule_id, week_number, week_start_date, has_mentor, comment, is_emergency) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [schedule.id, assignment.weekNumber, assignment.weekStartDate, assignment.hasMentor, assignment.comment, assignment.isEmergency]
        );
        const weekId = result.rows[0].id;
        
        // 3b. Haupt-Zuweisungen
        for (let i = 0; i < assignment.assignedPeople.length; i++) {
          await tx.query(
            'INSERT INTO assignments (week_assignment_id, person_id, role, fairness_score) VALUES ($1, $2, $3, $4)',
            [weekId, assignment.assignedPeople[i], 'main', assignment.fairnessScores[i]]
          );
        }
        
        // 3c. Ersatz-Zuweisungen
        if (assignment.substitutes) {
          for (const subId of assignment.substitutes) {
            await tx.query(
              'INSERT INTO assignments (week_assignment_id, person_id, role) VALUES ($1, $2, $3)',
              [weekId, subId, 'substitute']
            );
          }
        }
      }
    }
  });
}
```

---

## Vergleich: JSON vs. SQL

| Aspekt | JSON (File System) | SQL (PostgreSQL) |
|--------|-------------------|------------------|
| **Komplexität** | ✅ Einfach | ⚠️ Höher |
| **Setup** | ✅ Keine Installation | ❌ Server erforderlich |
| **Performance (klein)** | ✅ Sehr schnell | ⚠️ Overhead |
| **Performance (groß)** | ⚠️ Langsamer | ✅ Schneller |
| **Queries** | ❌ Komplex in JS | ✅ SQL powerful |
| **Datenschutz** | ✅ Lokal | ⚠️ Server-Hosting |
| **Backup** | ✅ Einfach (Datei kopieren) | ⚠️ DB-Dump nötig |
| **Skalierung** | ⚠️ Begrenzt | ✅ Unbegrenzt |
| **Versionierung** | ✅ Git-freundlich | ❌ Schwierig |

**Aktuelle Wahl**: JSON (File System) ✅  
**Begründung**: Einfachheit, Datenschutz, keine Infrastruktur

**Zukünftig**: SQL-Migration für Multi-User-Szenarien möglich

---

<div align="center">

**Anhang B: Datenmodell und ER-Diagramme**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

 Monat Jahr 

</div>
