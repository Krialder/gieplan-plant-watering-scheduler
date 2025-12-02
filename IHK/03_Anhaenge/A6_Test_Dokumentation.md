# Anhang C: Test-Dokumentation

## IHK Abschlussprojekt - GießPlan

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor

---

## Inhaltsverzeichnis

1. [Test-Übersicht](#1-test-übersicht)
2. [Test-Protokolle](#2-test-protokolle)
3. [Coverage-Berichte](#3-coverage-berichte)
4. [Performance-Benchmarks](#4-performance-benchmarks)
5. [Stress-Test-Ergebnisse](#5-stress-test-ergebnisse)

---

## 1. Test-Übersicht

### 1.1 Test-Strategie

**Test-Pyramide**:
```
           / \
          /E2E\ ────────── 5 Tests (5%)
         /─────\
        /  Int  \  ─────── 25 Tests (25%)
       /─────────\
      /   Unit    \ ────── 72 Tests (70%)
     /_____________\

Gesamt: 102 Tests | Coverage: 85%+
```

### 1.2 Test-Werkzeuge

| Werkzeug | Version | Zweck |
|----------|---------|-------|
| Vitest | 4.0.x | Test-Runner, Unit & Integration Tests |
| @testing-library/react | 16.x | React Component Tests |
| @testing-library/jest-dom | 6.x | DOM Assertions |
| @vitest/coverage-v8 | 4.0.x | Code Coverage |

### 1.3 Test-Kategorien

| Kategorie | Anzahl | Coverage | Status |
|-----------|--------|----------|--------|
| **Unit Tests** | 72 | 90%+ | ✅ |
| - Fairness-Algorithmen | 47 | 92% | ✅ |
| - Business Logic | 25 | 88% | ✅ |
| **Integration Tests** | 25 | 85% | ✅ |
| - Schedule Generation | 15 | 87% | ✅ |
| - Person Lifecycle | 10 | 83% | ✅ |
| **E2E/Manual Tests** | 5 | - | ✅ |
| **Gesamt** | **102** | **85%+** | ✅ |

---

## 2. Test-Protokolle

### 2.1 Unit-Test-Protokoll: Bayesian State

**Test-Suite**: `fairness/test/bayesianState.test.ts`  
**Datum**: 02.12.2025  
**Durchläufe**: 1.000 (mit verschiedenen Seeds)

| Test-ID | Test-Name | Ergebnis | Dauer |
|---------|-----------|----------|-------|
| BAY-01 | Should initialize with correct defaults | ✅ PASS | 2ms |
| BAY-02 | Should update posterior mean on assignment | ✅ PASS | 3ms |
| BAY-03 | Should reduce variance with observations | ✅ PASS | 2ms |
| BAY-04 | Should apply drift correction when far from ideal | ✅ PASS | 4ms |
| BAY-05 | Should handle multiple rapid updates | ✅ PASS | 5ms |
| BAY-06 | Should maintain variance within bounds | ✅ PASS | 3ms |
| BAY-07 | Should handle zero days elapsed | ✅ PASS | 2ms |
| BAY-08 | Should converge to ideal rate over time | ✅ PASS | 12ms |
| BAY-09 | Should handle non-assignment updates | ✅ PASS | 2ms |
| BAY-10 | Should preserve observation count | ✅ PASS | 2ms |

**Zusammenfassung**: 10/10 PASS | 0 FAIL | Coverage: 95%

**Beispiel-Test**:
```typescript
describe('updateBayesianState', () => {
  it('should update posterior mean on assignment', () => {
    const initialState: BayesianState = {
      posteriorMean: 0.1,
      posteriorVariance: 0.02,
      observations: 0,
      lastUpdated: '2025-01-01'
    };
    
    const updated = updateBayesianState(
      initialState,
      true,  // assigned
      7,     // 7 days elapsed
      0.1    // ideal rate
    );
    
    expect(updated.posteriorMean).toBeGreaterThan(0.1);
    expect(updated.posteriorVariance).toBeLessThan(0.02);
    expect(updated.observations).toBe(1);
  });
});
```

---

### 2.2 Integration-Test-Protokoll: Schedule Generation

**Test-Suite**: `Test/scheduleEngine.test.ts`  
**Datum**: 02.12.2025

| Test-ID | Test-Name | Ergebnis | Dauer |
|---------|-----------|----------|-------|
| SCH-01 | Should generate 12-week schedule for 10 people | ✅ PASS | 45ms |
| SCH-02 | Should enforce mentor requirement | ✅ PASS | 52ms |
| SCH-03 | Should avoid consecutive weeks | ✅ PASS | 58ms |
| SCH-04 | Should handle insufficient people gracefully | ✅ PASS | 38ms |
| SCH-05 | Should include future arrivals when enabled | ✅ PASS | 61ms |
| SCH-06 | Should handle new person joining mid-schedule | ✅ PASS | 67ms |
| SCH-07 | Should maintain fairness across 52 weeks | ✅ PASS | 124ms |
| SCH-08 | Should handle person departure mid-schedule | ✅ PASS | 71ms |
| SCH-09 | Should distribute assignments fairly | ✅ PASS | 89ms |
| SCH-10 | Should meet Gini < 0.25 constraint | ✅ PASS | 95ms |
| SCH-11 | Should meet CV < 0.30 constraint | ✅ PASS | 87ms |
| SCH-12 | Should assign correct number of people per week | ✅ PASS | 42ms |
| SCH-13 | Should handle single-week generation | ✅ PASS | 18ms |
| SCH-14 | Should be deterministic with same seed | ✅ PASS | 102ms |
| SCH-15 | Should handle edge case: exactly 4 people | ✅ PASS | 56ms |

**Zusammenfassung**: 15/15 PASS | 0 FAIL | Coverage: 87%

**Beispiel-Test**:
```typescript
describe('Schedule Generation Integration', () => {
  it('should maintain fairness across 52 weeks', () => {
    const people = createMockPeople(25);
    
    const result = generateSchedule({
      people,
      startDate: '2025-01-06',
      weeks: 52,
      requireMentor: true,
      seed: 12345
    });
    
    expect(result.success).toBe(true);
    expect(result.schedule).toBeDefined();
    expect(result.schedule.assignments).toHaveLength(52);
    
    // Fairness-Metriken prüfen
    const rates = people.map(p => p.fairnessMetrics.assignmentsPerDayPresent);
    const gini = calculateGini(rates);
    const cv = calculateCV(rates);
    
    expect(gini).toBeLessThan(0.25);
    expect(cv).toBeLessThan(0.30);
  });
});
```

---

### 2.3 Benutzer-Test-Protokoll

**Datum**: 28.11.2025  
**Teilnehmer**: 3 Programm-Koordinatoren  
**Dauer**: Je 30 Minuten

| Aufgabe | Koordinator 1 | Koordinator 2 | Koordinator 3 | Durchschnitt |
|---------|---------------|---------------|---------------|--------------|
| **1. Person hinzufügen** | | | | |
| Zeit | 45s | 38s | 52s | 45s |
| Erfolg | ✅ | ✅ | ✅ | 100% |
| Kommentar | "Sehr einfach" | "Intuitiv" | "Schnell" | - |
| **2. Zeitplan generieren (12 Wochen)** | | | | |
| Zeit | 2:15 Min | 1:58 Min | 2:30 Min | 2:14 Min |
| Erfolg | ✅ | ✅ | ✅ | 100% |
| Kommentar | "Konfiguration klar" | "Schnell" | "Mentor-Option gut" | - |
| **3. Person ersetzen** | | | | |
| Zeit | 38s | 42s | 35s | 38s |
| Erfolg | ✅ | ✅ | ✅ | 100% |
| Kommentar | "Einfach" | "Praktisch" | "Sehr gut" | - |
| **4. CSV exportieren** | | | | |
| Zeit | 22s | 18s | 25s | 22s |
| Erfolg | ✅ | ✅ | ✅ | 100% |
| Kommentar | "Excel öffnet perfekt" | "Super" | "Praktisch" | - |
| **5. Fairness-Metriken verstehen** | | | | |
| Zeit | - | - | - | - |
| Erfolg | ⚠️ | ✅ | ⚠️ | 66% |
| Kommentar | "Gini nicht klar" | "Mit Tooltip OK" | "Mehr Erklärung" | - |

**System Usability Scale (SUS)**:
- Koordinator 1: 75/100
- Koordinator 2: 82/100
- Koordinator 3: 77/100
- **Durchschnitt: 78/100** (Gut)

**Verbesserungsmaßnahmen basierend auf Feedback**:
1. ✅ Tooltips für Gini/CV hinzugefügt
2. ✅ Hilfe-Button in jedem Tab
3. ✅ Erklärung in Statistik-Ansicht
4. ⏳ Video-Tutorial geplant

---

## 3. Coverage-Berichte

### 3.1 Gesamt-Coverage

**Generiert**: 02.12.2025 mit `npm run test:coverage`

```
-----------------------------|---------|----------|---------|---------|-------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|-------------------
All files                    |   85.42 |    82.15 |   87.23 |   85.89 |
-----------------------------|---------|----------|---------|---------|-------------------
fairness                     |   92.18 |    88.46 |   91.67 |   92.54 |
  bayesianState.ts           |   95.24 |    91.67 |   100   |   95.45 | 67,89
  fairnessConstraints.ts     |   88.89 |    84.62 |   85.71 |   89.47 | 45-48,92
  penalizedPriority.ts       |   90.48 |    87.50 |   88.89 |   91.11 | 78-81
  random.ts                  |   100   |    100   |   100   |   100   |
  softmaxSelection.ts        |   92.31 |    88.89 |   90.00 |   92.86 | 102-105
  types.ts                   |   100   |    100   |   100   |   100   |
-----------------------------|---------|----------|---------|---------|-------------------
src/lib                      |   86.24 |    81.35 |   88.46 |   86.92 |
  adaptiveFairness.ts        |   87.50 |    83.33 |   90.00 |   88.24 | 125-132,187
  dateUtils.ts               |   90.00 |    85.71 |   92.31 |   90.48 | 45,67-69
  exportUtils.ts             |   82.35 |    76.92 |   80.00 |   83.33 | 78-85,112-118
  fairnessEngine.ts          |   84.62 |    80.00 |   85.71 |   85.19 | 98-105,145
  fileStorage.ts             |   78.95 |    72.22 |   75.00 |   79.41 | 67-75,123-129
  personManager.ts           |   88.24 |    84.62 |   90.91 |   88.89 | 112-118,156
  scheduleEngine.ts          |   85.71 |    81.25 |   87.50 |   86.36 | 145-152,234-241
  storage.ts                 |   83.33 |    77.78 |   81.82 |   84.00 | 89-95
  utils.ts                   |   90.91 |    88.89 |   92.31 |   91.30 | 45-47
-----------------------------|---------|----------|---------|---------|-------------------
src/components               |   75.32 |    68.42 |   78.95 |   76.19 |
  DataTab.tsx                |   72.22 |    65.00 |   75.00 |   73.33 | 89-112,145-167
  ManualTab.tsx              |   76.47 |    70.00 |   80.00 |   77.78 | 123-145,189-201
  PeopleTab.tsx              |   74.51 |    66.67 |   77.78 |   75.56 | 98-125,178-195
  ScheduleTab.tsx            |   78.26 |    72.22 |   81.82 |   79.17 | 156-189,234-256
-----------------------------|---------|----------|---------|---------|-------------------
```

### 3.2 Detaillierte Coverage-Analyse

**Fairness-Algorithmen (92.18%)**:
- ✅ Exzellente Coverage
- Kritische Pfade vollständig getestet
- Edge Cases abgedeckt
- Nur triviale Getter nicht getestet

**Business Logic (86.24%)**:
- ✅ Sehr gute Coverage
- Haupt-Workflows getestet
- Einige Error-Handling-Pfade nicht erreicht
- File System API schwer zu mocken

**UI-Komponenten (75.32%)**:
- ✅ Akzeptable Coverage
- Interaktive Elemente getestet
- Visuelle Komponenten teilweise ausgelassen
- React Testing Library Limitationen

**Ungetestete Zeilen - Analyse**:
1. **Error Handling**: Seltene Edge Cases (z.B. File System Permission Denied)
2. **UI Feedback**: Toast-Notifications, Loading-States
3. **Type Guards**: TypeScript-bedingte Code-Pfade

---

## 4. Performance-Benchmarks

### 4.1 Zeitplan-Generierung

**Test-Setup**: Windows 11, Intel i7-10750H @ 2.60GHz, 16GB RAM  
**Durchläufe**: 50 pro Konfiguration  
**Seed**: Konstant für Reproduzierbarkeit

| Szenario | Personen | Wochen | Min | Mittelwert | Max | Ziel | Status |
|----------|----------|--------|-----|------------|-----|------|--------|
| Klein | 10 | 25 | 42ms | 48ms | 56ms | < 100ms | ✅ |
| Mittel-1 | 25 | 25 | 89ms | 97ms | 112ms | < 500ms | ✅ |
| Mittel-2 | 10 | 52 | 78ms | 86ms | 98ms | < 500ms | ✅ |
| Groß | 50 | 52 | 421ms | 486ms | 534ms | < 2s | ✅ |
| Sehr Groß | 75 | 52 | 892ms | 1.024ms | 1.178ms | < 3s | ✅ |
| Extrem | 100 | 52 | 1.678ms | 1.847ms | 2.034ms | < 5s | ✅ |

**Ergebnis**: Alle Benchmarks erfüllt ✅

**Performance-Optimierungen**:
1. Memoization von Priority-Berechnungen
2. Batch-Updates für Bayesian States
3. Optimierte Gini-Berechnung (sortiert einmal)
4. Constraint-Prüfung nur am Ende

### 4.2 Algorithmen-Performance

**Einzelne Operationen** (Mittelwert aus 10.000 Durchläufen):

| Operation | Personen | Zeit | Komplexität |
|-----------|----------|------|-------------|
| Bayesian Update | 1 | 0.012ms | O(1) |
| Priority Calculate | 1 | 0.035ms | O(1) |
| Softmax Selection | 10 | 0.124ms | O(n log n) |
| Softmax Selection | 50 | 0.687ms | O(n log n) |
| Softmax Selection | 100 | 1.523ms | O(n log n) |
| Gini Calculation | 10 | 0.089ms | O(n log n) |
| Gini Calculation | 50 | 0.432ms | O(n log n) |
| Gini Calculation | 100 | 0.921ms | O(n log n) |
| CV Calculation | 100 | 0.156ms | O(n) |

**Speicher-Footprint**:

| Szenario | Personen | Wochen | Heap-Nutzung | Peak |
|----------|----------|--------|--------------|------|
| Klein | 10 | 25 | 1.8 MB | 2.1 MB |
| Mittel | 25 | 52 | 4.2 MB | 5.1 MB |
| Groß | 50 | 52 | 8.7 MB | 10.2 MB |
| Extrem | 100 | 52 | 42.3 MB | 48.1 MB |

---

## 5. Stress-Test-Ergebnisse

### 5.1 Extreme Dynamics Test

**Szenario**: 100 Personen, 52 Wochen, 50% Turnover-Rate  
**Datei**: `Test/stress-extreme-dynamics.test.ts`  
**Datum**: 28.11.2025

```typescript
describe('Extreme Dynamics Stress Test', () => {
  it('should handle 100 people with high turnover', () => {
    const people = createMockPeople(100);
    
    // Simuliere 50% Abgang nach 26 Wochen
    people.slice(0, 50).forEach(p => {
      p.actualDepartureDate = addWeeks('2025-01-06', 26);
      p.programPeriods[0].endDate = p.actualDepartureDate;
    });
    
    // 50 neue Personen ab Woche 26
    const newPeople = createMockPeople(50, '2025-07-07');
    const allPeople = [...people, ...newPeople];
    
    const start = performance.now();
    const result = generateSchedule({
      people: allPeople,
      startDate: '2025-01-06',
      weeks: 52,
      requireMentor: true,
      includeFutureArrivals: true
    });
    const duration = performance.now() - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5000);
    
    // Fairness prüfen
    const rates = allPeople.map(p => p.fairnessMetrics.assignmentsPerDayPresent);
    const gini = calculateGini(rates.filter(r => r > 0));
    
    expect(gini).toBeLessThan(0.30); // Relaxed für Extreme-Scenario
  });
});
```

**Ergebnis**:
- ✅ Generierung erfolgreich: 1.847ms
- ✅ Gini: 0.219 (unter 0.30)
- ✅ CV: 0.256 (unter 0.30)
- ✅ Alle Wochen mit Mentor
- ✅ Speicher-Peak: 48.1 MB

### 5.2 Progressive Fairness Test

**Szenario**: Fairness-Entwicklung über 52 Wochen tracken  
**Datei**: `Test/stress-progressive-fairness.test.ts`

```typescript
it('should progressively improve fairness', () => {
  const people = createMockPeople(25);
  const giniHistory: number[] = [];
  
  for (let week = 1; week <= 52; week++) {
    const result = generateSchedule({
      people,
      startDate: '2025-01-06',
      weeks: week,
      seed: 12345
    });
    
    const rates = people.map(p => p.fairnessMetrics.assignmentsPerDayPresent);
    const gini = calculateGini(rates.filter(r => r > 0));
    giniHistory.push(gini);
  }
  
  // Fairness sollte sich verbessern
  const early = mean(giniHistory.slice(0, 13)); // Erste 13 Wochen
  const late = mean(giniHistory.slice(-13));    // Letzte 13 Wochen
  
  expect(late).toBeLessThan(early);
  expect(late).toBeLessThan(0.25);
});
```

**Ergebnis**:
- ✅ Frühe Fairness (Woche 1-13): Gini = 0.287
- ✅ Späte Fairness (Woche 40-52): Gini = 0.208
- ✅ Verbesserung: 27.5%
- ✅ Konvergenz zu Ideal erkennbar

### 5.3 Reproduzierbarkeits-Test

**Zweck**: Sicherstellen dass gleicher Seed → gleicher Zeitplan

```typescript
it('should produce identical schedules with same seed', () => {
  const people = createMockPeople(50);
  
  const result1 = generateSchedule({
    people, startDate: '2025-01-06', weeks: 52, seed: 777
  });
  
  const result2 = generateSchedule({
    people, startDate: '2025-01-06', weeks: 52, seed: 777
  });
  
  expect(result1.schedule.assignments).toEqual(result2.schedule.assignments);
});
```

**Ergebnis**: ✅ 100% Reproduzierbar

---

## 6. Test-Ausführung

### 6.1 Befehle

```bash
# Alle Tests
npm test

# Watch Mode
npm run test:watch

# Coverage Report
npm run test:coverage

# Spezifische Suite
npm test -- bayesianState

# Mit UI
npm run test:ui
```

### 6.2 CI/CD Integration (geplant)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 7. Zusammenfassung

### Erfüllte Ziele

✅ **Test-Coverage**: 85%+ (Ziel: > 80%)  
✅ **Unit-Tests**: 72 Tests, 90%+ Coverage  
✅ **Integration-Tests**: 25 Tests, 85% Coverage  
✅ **Performance**: Alle Benchmarks erfüllt  
✅ **Fairness**: Gini < 0.25, CV < 0.30 konsistent erreicht  
✅ **Benutzer-Tests**: SUS 78/100 (Gut)  
✅ **Reproduzierbarkeit**: 100% mit Seeded Random

### Verbesserungspotenzial

⚠️ **UI-Coverage**: Von 75% auf 80% erhöhen  
⚠️ **E2E-Tests**: Automatisierung mit Playwright  
⚠️ **Load-Tests**: 1000+ Personen simulieren  
⚠️ **CI/CD**: GitHub Actions Integration

---

<div align="center">

**Anhang C: Test-Dokumentation**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

**Test-Status**: ✅ Alle Tests bestanden  
**Coverage**: 85.42% (Ziel übertroffen)

Dezember 2025

</div>
