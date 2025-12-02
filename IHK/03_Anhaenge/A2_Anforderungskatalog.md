# Anforderungskatalog

## Fachinformatiker/-in für Anwendungsentwicklung

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor  
**Ausbildungsbetrieb**: Rotkreuz-Institut BBW  
**Version**: 1.0  
**Datum**: 02. Dezember 2025

---

## Inhaltsverzeichnis

1. [Funktionale Anforderungen](#1-funktionale-anforderungen)
2. [Nicht-funktionale Anforderungen](#2-nicht-funktionale-anforderungen)
3. [Use Cases](#3-use-cases)
4. [User Stories](#4-user-stories)
5. [Akzeptanzkriterien](#5-akzeptanzkriterien)

---

## 1. Funktionale Anforderungen

### 1.1 Personenverwaltung

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **FA-1.1** | Person mit Name und Ankunftsdatum erstellen | Muss | ✅ |
| **FA-1.2** | Abgangsdatum und Abgangsgrund erfassen | Muss | ✅ |
| **FA-1.3** | Rückkehr nach Abgang ermöglichen (Mehrfachteilnahme) | Muss | ✅ |
| **FA-1.4** | Mehrere Programmperioden pro Person verwalten | Muss | ✅ |
| **FA-1.5** | Person löschen mit automatischer Zeitplan-Aktualisierung | Muss | ✅ |
| **FA-1.6** | Erfahrungslevel automatisch bestimmen (< 4 Wochen = neu) | Muss | ✅ |
| **FA-1.7** | Fairness-Metriken pro Person anzeigen | Sollte | ✅ |
| **FA-1.8** | Mentor-Status und Mentees anzeigen | Sollte | ✅ |

**Beschreibung**: Das System muss eine umfassende Verwaltung von Teilnehmern ermöglichen, einschließlich vollständiger Lebenszyklen (Ankunft, Abgang, Rückkehr) und Fairness-Tracking.

---

### 1.2 Zeitplan-Generierung

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **FA-2.1** | Wochen-Anzahl konfigurierbar (1-52 Wochen) | Muss | ✅ |
| **FA-2.2** | Startdatum frei wählbar (automatisch Montag) | Muss | ✅ |
| **FA-2.3** | Fairness-Algorithmus anwenden (Bayesian, Priority, Softmax) | Muss | ✅ |
| **FA-2.4** | Mentor-Anforderung optional aktivierbar | Muss | ✅ |
| **FA-2.5** | Aufeinanderfolgende Wochen vermeiden (optional) | Sollte | ✅ |
| **FA-2.6** | 2 Hauptpersonen + 2 Ersatzpersonen pro Woche zuweisen | Muss | ✅ |
| **FA-2.7** | Nur anwesende Personen berücksichtigen | Muss | ✅ |
| **FA-2.8** | Lücken bei unzureichenden Personen markieren | Muss | ✅ |
| **FA-2.9** | Zeitplan regenerieren mit bestehenden Daten | Sollte | ✅ |
| **FA-2.10** | Warnung bei Fairness-Violations anzeigen | Sollte | ✅ |

**Beschreibung**: Der Kernprozess des Systems - automatische Generierung fairer Zeitpläne unter Berücksichtigung vielfältiger Constraints.

---

### 1.3 Fairness-Berechnung

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **FA-3.1** | Zeitproportionale Fairness berechnen (Rate = Zuweisungen / Tage anwesend) | Muss | ✅ |
| **FA-3.2** | Bayesian Random Walk für glatte Fairness-Entwicklung | Muss | ✅ |
| **FA-3.3** | Gini-Koeffizient < 0.25 einhalten | Sollte | ✅ |
| **FA-3.4** | Variationskoeffizient < 0.30 einhalten | Sollte | ✅ |
| **FA-3.5** | Jahresübergreifende Fairness-Schuld tracken | Sollte | ✅ |
| **FA-3.6** | Virtual History für neue Personen initialisieren | Sollte | ✅ |
| **FA-3.7** | Mentor-Belastung in Fairness einbeziehen | Sollte | ✅ |
| **FA-3.8** | Constraint-Violations erkennen und melden | Sollte | ✅ |

**Beschreibung**: Kernalgorithmen zur Sicherstellung fairer Aufgabenverteilung über unterschiedliche Teilnahmedauern hinweg.

---

### 1.4 Manuelle Anpassungen

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **FA-4.1** | Person in bestimmter Woche ersetzen | Muss | ✅ |
| **FA-4.2** | Zwei Personen global im Zeitplan tauschen | Sollte | ✅ |
| **FA-4.3** | Kommentar zu Woche hinzufügen | Sollte | ✅ |
| **FA-4.4** | Notfall-Status für Woche markieren | Kann | ✅ |
| **FA-4.5** | Person aus Zeitraum entfernen | Sollte | ✅ |
| **FA-4.6** | Fairness nach manuellen Änderungen neu berechnen | Sollte | ✅ |

**Beschreibung**: Flexibilität für spontane Änderungen bei Krankheit, Urlaub oder anderen unvorhersehbaren Ereignissen.

---

### 1.5 Datenmanagement

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **FA-5.1** | JSON-Export für Backup | Muss | ✅ |
| **FA-5.2** | CSV-Export (Excel-kompatibel) | Muss | ✅ |
| **FA-5.3** | Lokale Datei-Speicherung über File System Access API | Muss | ✅ |
| **FA-5.4** | Jahres-basierte Datenverwaltung | Muss | ✅ |
| **FA-5.5** | Statistiken anzeigen (Gini, CV, Zuweisung-Rate) | Sollte | ✅ |
| **FA-5.6** | JSON-Import von Backup | Sollte | ✅ |
| **FA-5.7** | Datenordner wählen | Muss | ✅ |
| **FA-5.8** | Alle Daten löschen mit Bestätigung | Sollte | ✅ |

**Beschreibung**: Datenpersistenz, Import/Export und Backup-Funktionalität ohne externe Datenbank.

---

## 2. Nicht-funktionale Anforderungen

### 2.1 Benutzerfreundlichkeit (Usability)

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-1.1** | Intuitive Bedienung ohne Schulung | Muss | ✅ |
| **NFA-1.2** | Deutsche Benutzeroberfläche | Muss | ✅ |
| **NFA-1.3** | Hilfreiche Fehlermeldungen mit Lösungsvorschlägen | Sollte | ✅ |
| **NFA-1.4** | Responsive Design (Desktop 1920x1080, Tablet 768x1024) | Sollte | ✅ |
| **NFA-1.5** | Tooltips für Fairness-Metriken | Sollte | ✅ |
| **NFA-1.6** | Bestätigungsdialoge für destruktive Aktionen | Muss | ✅ |

**Messkriterien**:
- System of Usability Scale (SUS): > 70
- Task Completion Rate: > 95%
- Time on Task: < 5 Min für Zeitplan-Generierung

---

### 2.2 Performance

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-2.1** | Zeitplan-Generierung < 100ms (10 Personen, 25 Wochen) | Muss | ✅ |
| **NFA-2.2** | Zeitplan-Generierung < 5s (100 Personen, 52 Wochen) | Sollte | ✅ |
| **NFA-2.3** | UI-Reaktionszeit < 100ms | Sollte | ✅ |
| **NFA-2.4** | Speicher-Footprint < 100MB | Sollte | ✅ |
| **NFA-2.5** | Initial Load Time < 2s | Sollte | ✅ |

**Messmethode**: Performance-Benchmarks in Vitest, Chrome DevTools Profiling

---

### 2.3 Datenschutz & Sicherheit

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-3.1** | Alle Daten lokal gespeichert (keine Cloud) | Muss | ✅ |
| **NFA-3.2** | Keine Server-Kommunikation | Muss | ✅ |
| **NFA-3.3** | Keine Tracking/Analytics | Muss | ✅ |
| **NFA-3.4** | Nutzer kontrolliert Dateiordner vollständig | Muss | ✅ |
| **NFA-3.5** | Keine personenbezogenen Daten außer Namen | Muss | ✅ |
| **NFA-3.6** | DSGVO-konforme Datenverarbeitung | Muss | ✅ |

**Begründung**: Datenschutz in Rehabilitations-Einrichtungen kritisch, volle Kontrolle erforderlich

---

### 2.4 Wartbarkeit (Maintainability)

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-4.1** | TypeScript Strict Mode aktiviert | Muss | ✅ |
| **NFA-4.2** | JSDoc-Kommentare für alle Public APIs | Sollte | ✅ |
| **NFA-4.3** | Modulare Architektur (Schichten-Trennung) | Muss | ✅ |
| **NFA-4.4** | Klare Trennung von UI, Business Logic, Algorithmen | Muss | ✅ |
| **NFA-4.5** | Durchschnittliche Funktionslänge < 30 Zeilen | Sollte | ✅ |
| **NFA-4.6** | Cyclomatic Complexity < 10 | Sollte | ✅ |

**Messkriterien**: ESLint-Analyse, SonarQube-Metrics

---

### 2.5 Testbarkeit

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-5.1** | Unit-Test-Coverage > 80% | Sollte | ✅ |
| **NFA-5.2** | Integration-Tests für Hauptworkflows | Sollte | ✅ |
| **NFA-5.3** | Reproduzierbare Tests (Seeded Random) | Muss | ✅ |
| **NFA-5.4** | Stress-Tests für Extremszenarien (100 Personen) | Sollte | ✅ |
| **NFA-5.5** | Automatisierte Tests in CI/CD | Kann | ❌ |

**Testwerkzeuge**: Vitest, @testing-library/react

---

### 2.6 Kompatibilität

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-6.1** | Chrome 102+ (mit File System Access API) | Muss | ✅ |
| **NFA-6.2** | Edge 102+ | Muss | ✅ |
| **NFA-6.3** | Safari 15.2+ (mit Feature-Detection-Fallback) | Kann | ⚠️ |
| **NFA-6.4** | Firefox (mit Warnung - keine File API) | Kann | ⚠️ |
| **NFA-6.5** | Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+) | Sollte | ✅ |

**Begründung**: File System Access API nur in Chromium-Browsern voll unterstützt

---

### 2.7 Skalierbarkeit

| ID | Anforderung | Priorität | Status |
|----|-------------|-----------|--------|
| **NFA-7.1** | Unterstützung für 5-20 aktive Personen | Muss | ✅ |
| **NFA-7.2** | Unterstützung für bis zu 100 Personen (historisch) | Sollte | ✅ |
| **NFA-7.3** | Zeiträume bis 52 Wochen | Muss | ✅ |
| **NFA-7.4** | Mehrjährige Daten-Historie | Sollte | ✅ |

---

## 3. Use Cases

### UC-1: Neuen Teilnehmer hinzufügen

**Akteur**: Programm-Koordinator  
**Vorbedingung**: System geöffnet, Datenordner gewählt  
**Nachbedingung**: Person in Liste sichtbar, bereit für Planung

**Hauptszenario**:
1. Koordinator öffnet Tab "Personen"
2. Klickt auf Button "Person hinzufügen"
3. Gibt Name ein (z.B. "Max Mustermann")
4. Wählt Ankunftsdatum (z.B. "2025-12-01")
5. Bestätigt mit "Hinzufügen"
6. System erstellt Person mit UUID
7. System zeigt Person in Liste an
8. System initialisiert Fairness-Metriken mit Virtual History

**Alternativszenario 1a**: Name leer
- System zeigt Fehlermeldung "Name erforderlich"

**Alternativszenario 1b**: Ankunftsdatum in Zukunft
- System markiert Person als "Zukünftig"

---

### UC-2: Fairen Zeitplan generieren

**Akteur**: Programm-Koordinator  
**Vorbedingung**: Mindestens 4 Personen vorhanden  
**Nachbedingung**: Zeitplan erstellt, Fairness-Metriken erfüllt

**Hauptszenario**:
1. Koordinator öffnet Tab "Zeitplan"
2. Wählt Startdatum (z.B. "2025-12-02")
3. Setzt Wochen-Anzahl (z.B. "12")
4. Aktiviert "Mentor erforderlich"
5. Aktiviert "Keine aufeinanderfolgenden Wochen"
6. Klickt "Zeitplan generieren"
7. System validiert Eingaben
8. System berechnet Fairness-Prioritäten
9. System wählt Teams per Gumbel-Softmax
10. System prüft Constraints (Gini, CV)
11. System zeigt Zeitplan an mit Fairness-Scores

**Alternativszenario 2a**: Zu wenige Personen
- System zeigt Warnung "Mindestens 4 Personen erforderlich"
- Zeitplan wird trotzdem erstellt, Lücken markiert

**Alternativszenario 2b**: Fairness-Violation
- System zeigt Warnung "Gini > 0.25"
- Zeitplan wird erstellt, aber Nutzer informiert

---

### UC-3: Person manuell ersetzen

**Akteur**: Programm-Koordinator  
**Vorbedingung**: Zeitplan existiert  
**Nachbedingung**: Person ausgetauscht, Fairness aktualisiert

**Hauptszenario**:
1. Koordinator öffnet Tab "Manuell"
2. Wählt Woche (z.B. "Woche 5")
3. Wählt zu ersetzende Person (z.B. "Alice")
4. Wählt neue Person (z.B. "Bob")
5. Klickt "Ersetzen"
6. System tauscht Personen aus
7. System berechnet Fairness neu
8. System zeigt aktualisierte Metriken

**Alternativszenario 3a**: Neue Person nicht verfügbar
- System zeigt Warnung "Bob ist in dieser Woche nicht anwesend"

---

### UC-4: Daten exportieren

**Akteur**: Programm-Koordinator  
**Vorbedingung**: Zeitplan existiert  
**Nachbedingung**: CSV-Datei auf lokalem System gespeichert

**Hauptszenario**:
1. Koordinator öffnet Tab "Daten"
2. Klickt "Als CSV exportieren"
3. System generiert CSV mit allen Wochen
4. System öffnet Download-Dialog
5. Koordinator wählt Speicherort
6. System speichert Datei

**Alternative Szenarien**: JSON-Export analog

---

## 4. User Stories

### Epic 1: Personenverwaltung

| ID | User Story | Akzeptanzkriterien | Priorität |
|----|------------|--------------------|-----------|
| **US-1** | Als Koordinator möchte ich Teilnehmer mit Ankunftsdatum erfassen, um ihre Anwesenheit zu tracken | ✅ Name + Datum erfassbar<br>✅ Person in Liste sichtbar | Muss |
| **US-2** | Als Koordinator möchte ich Abgang markieren, um inaktive Teilnehmer zu kennzeichnen | ✅ Abgangsdatum setzbar<br>✅ Person als "Inaktiv" markiert | Muss |
| **US-3** | Als Koordinator möchte ich Rückkehr erfassen, um Mehrfachteilnahmen zu verwalten | ✅ Neue Periode hinzufügbar<br>✅ Fairness über beide Perioden | Muss |

### Epic 2: Zeitplan-Generierung

| ID | User Story | Akzeptanzkriterien | Priorität |
|----|------------|--------------------|-----------|
| **US-4** | Als Koordinator möchte ich Zeitpläne automatisch generieren, um Zeit zu sparen | ✅ 1-52 Wochen wählbar<br>✅ Generierung < 5s | Muss |
| **US-5** | Als Koordinator möchte ich faire Verteilung, damit niemand benachteiligt wird | ✅ Gini < 0.25<br>✅ CV < 0.30 | Muss |
| **US-6** | Als Koordinator möchte ich Mentoren automatisch zuweisen, um Einarbeitung zu gewährleisten | ✅ Jedes Team hat 1 erfahrene Person<br>✅ Wenn aktiviert | Sollte |

### Epic 3: Manuelle Anpassungen

| ID | User Story | Akzeptanzkriterien | Priorität |
|----|------------|--------------------|-----------|
| **US-7** | Als Koordinator möchte ich Personen spontan ersetzen, um auf Krankheit zu reagieren | ✅ Austausch in < 30s<br>✅ Fairness neu berechnet | Muss |
| **US-8** | Als Koordinator möchte ich Kommentare hinzufügen, um Besonderheiten zu dokumentieren | ✅ Freitext speicherbar<br>✅ Im Export sichtbar | Sollte |

### Epic 4: Reporting & Export

| ID | User Story | Akzeptanzkriterien | Priorität |
|----|------------|--------------------|-----------|
| **US-9** | Als Koordinator möchte ich Zeitpläne als CSV exportieren, um sie in Excel zu nutzen | ✅ Excel öffnet CSV korrekt<br>✅ Alle Wochen enthalten | Muss |
| **US-10** | Als Koordinator möchte ich Fairness-Statistiken sehen, um Transparenz zu haben | ✅ Gini, CV, Raten angezeigt<br>✅ Pro Person und global | Sollte |

---

## 5. Akzeptanzkriterien

### 5.1 Projekt-Erfolg

Das Projekt gilt als erfolgreich, wenn:

✅ **Funktional**:
- Alle "Muss"-Anforderungen (FA) implementiert
- Mindestens 80% der "Sollte"-Anforderungen implementiert
- Alle Use Cases testbar und funktionsfähig

✅ **Technisch**:
- Test-Coverage > 80%
- Performance-Benchmarks erfüllt
- Keine kritischen Bugs

✅ **Qualitativ**:
- Benutzer-Feedback positiv (SUS > 70)
- Code-Review durch Betreuer bestanden
- Dokumentation vollständig

✅ **Zeitlich**:
- Projektdauer ≤ 70 Stunden
- Alle Meilensteine erreicht

---

### 5.2 Abnahmekriterien

**Technische Abnahme**:
- [ ] Alle automatisierten Tests erfolgreich (100% Pass-Rate)
- [ ] Performance-Benchmarks erfüllt (siehe NFA-2.x)
- [ ] Keine ESLint-Fehler
- [ ] Build-Prozess funktioniert (`npm run build`)

**Fachliche Abnahme**:
- [ ] Koordinatoren können Zeitplan in < 5 Min erstellen
- [ ] Fairness-Metriken nachvollziehbar
- [ ] Export-Funktionen produzieren korrekte Dateien
- [ ] Manuelle Anpassungen funktionieren fehlerfrei

**Dokumentations-Abnahme**:
- [ ] Benutzerhandbuch vorhanden und verständlich
- [ ] Installationsanleitung getestet
- [ ] API-Dokumentation vollständig
- [ ] IHK-Projektdokumentation formal korrekt

---

<div align="center">

**Anforderungskatalog**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

Version 1.0 | Dezember 2025

</div>
