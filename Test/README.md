# Test-Dokumentation - GießPlan System

## Übersicht

Dieses Projekt verwendet **Vitest** als Test-Framework für umfassende Unit- und Integration-Tests.

## Test-Struktur

### 📁 Test-Dateien

- `Test/dateUtils.test.ts` - Tests für Datums- und Zeit-Funktionen
- `Test/personManager.test.ts` - Tests für Personenverwaltung und Lifecycle
- `Test/fairnessEngine.test.ts` - Tests für Fairness-Algorithmen
- `Test/scheduleEngine.test.ts` - Integration-Tests für Schedule-Generierung

### 🧪 Test-Abdeckung

#### dateUtils.test.ts (10 Test-Suites, 26+ Tests)
- `parseDate()` - ISO-String zu Date-Objekt Konvertierung
- `formatDate()` - Date zu ISO-Format (YYYY-MM-DD)
- `formatDateGerman()` - Deutsche Datumsformatierung (DD.MM.YYYY)
- `getDaysBetween()` - Tagesberechnung inkl. Schaltjahre
- `addDays()` / `addWeeks()` - Datums-Arithmetik
- `getWeekNumber()` - ISO-Wochennummern
- `getMonday()` - Montag-Berechnung für Wochen
- `isDateInRange()` - Zeitraum-Validierung

**Besondere Tests:**
- Schaltjahr-Berücksichtigung (2024 vs. 2023)
- Monats- und Jahresübergänge
- Offene Zeiträume (endDate = null)

#### personManager.test.ts (9 Test-Suites, 29+ Tests)
- `createPerson()` - Personen-Erstellung mit Initialisierung
- `updatePerson()` - Partielle Updates mit Fairness-Metrics
- `markPersonDeparture()` - Ausscheiden mit Grund-Angabe
- `markPersonReturn()` - Rückkehr mit neuer TimePeriod
- `deletePerson()` - Entfernung aus Arrays
- `findPersonById()` / `findPersonByName()` - Such-Funktionen
- `validatePersonData()` - Validierung von Eingabedaten
- `normalizeGermanName()` - Deutsche Namen-Normalisierung

**Besondere Tests:**
- Mehrere Programm-Perioden
- Case-insensitive Namenssuche
- Umlaute (ü, ö, ä)
- Datums-Logik-Validierung

#### fairnessEngine.test.ts (13 Test-Suites, 45+ Tests)
- `calculateTenure()` - Tenure-Berechnung in Tagen
- `calculateTotalDaysPresent()` - Mehrperioden-Summierung
- `isPersonActive()` - Aktiv-Status prüfen
- `getPersonAssignmentCount()` - Assignment-Zählung
- `isExperienced()` - Erfahrungslevel (90 Tage oder 4+ Assignments)
- `calculatePriority()` - Mathematischer Priority-Score
- `selectTeamsAndSubstitutes()` - Team-Auswahl Algorithmus
- `fillGapAfterDeletion()` - Lücken-Füllung nach Löschung
- `validateScheduleConstraints()` - Consecutive-Assignment-Prüfung

**Besondere Tests:**
- Mathematische Fairness-Algorithmen
- Priority-basierte Auswahl
- Excluded IDs Handling
- Mehrfache consecutive Violations

#### scheduleEngine.test.ts (6 Test-Suites, 37+ Tests)
- `generateSchedule()` - Komplette Schedule-Generierung
  - Korrekte Wochen-Anzahl
  - Keine consecutive Assignments
  - Nur aktive Personen
  - Mentor-Warnungen
  - Montag-Normalisierung
- `getScheduleForWeek()` - Wochen-spezifische Suche
- `updateAssignment()` - Assignment-Updates
- `deleteSchedule()` - Schedule-Entfernung
- `handlePersonDeletion()` - Gap-Filling Integration

**Besondere Tests:**
- Multi-Schedule Szenarien
- Edge Cases (0, 1 Person)
- Fairness Score Speicherung
- Eindeutige ID-Generierung

## Test-Ausführung

### Kommandos

```bash
# Alle Tests ausführen
npm test

# Tests mit vmThreads Pool (empfohlen für Windows)
npx vitest run --pool=vmThreads

# Tests mit UI
npm run test:ui

# Coverage Report
npm run test:coverage

# Watch Mode (mit vmThreads)
npx vitest --pool=vmThreads

# Spezifische Datei
npx vitest run Test/dateUtils.test.ts --pool=vmThreads
```

### Wichtiger Hinweis für Windows

Auf Windows-Systemen gibt es manchmal Probleme mit dem Standard-Pool (`forks`). 
In diesem Fall verwenden Sie `--pool=vmThreads`:

```bash
npx vitest run --pool=vmThreads
```

### CI/CD Integration

Die Tests sind bereit für CI/CD Pipelines:
- Keine externen Abhängigkeiten
- Deterministisch (außer Timestamp-Tests)
- Schnelle Ausführung (< 5 Sekunden)

## Coverage-Ziele

- **Utility-Funktionen:** 100% Coverage
- **Business Logic:** 95%+ Coverage
- **UI-Komponenten:** Ausgeschlossen (in vitest.config.ts)

## Test-Best-Practices

### ✅ Gut
- Beschreibende Test-Namen auf Deutsch
- Arrange-Act-Assert Pattern
- Isolierte Tests (keine Abhängigkeiten)
- Edge Cases testen
- Positive und negative Szenarien

### ❌ Zu vermeiden
- Tests mit externen API-Aufrufen
- Tests die von aktuellem Datum abhängen (ohne Mock)
- Flaky Tests
- Zu viele Assertions pro Test

## Beispiel-Test

```typescript
describe('calculateTenure', () => {
  it('sollte korrekte Tenure in Tagen berechnen', () => {
    const person = createPerson('Test Person', '2024-01-01');
    const tenure = calculateTenure(person, '2024-01-31');
    
    expect(tenure).toBe(30);
  });
});
```

## Bekannte Einschränkungen

- TypeScript-Fehler in Tests sind normal (Path-Aliase `@/` werden erst zur Laufzeit aufgelöst)
- Tests laufen trotz Compile-Fehler korrekt (siehe vitest.config.ts)
- Einige Tests verwenden feste Daten für Konsistenz

## Wartung

- Tests bei Feature-Änderungen aktualisieren
- Neue Funktionen sollten sofort Tests bekommen
- Coverage-Report regelmäßig prüfen
- Flaky Tests sofort fixen

## Weitere Informationen

- [Vitest Dokumentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- SCHEDULING_ALGORITHM.md für Algorithmus-Details
