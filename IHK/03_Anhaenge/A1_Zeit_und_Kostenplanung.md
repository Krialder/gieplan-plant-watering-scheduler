# Zeit- und Kostenplanung

## Fachinformatiker/-in für Anwendungsentwicklung

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor  
**Ausbildungsbetrieb**: Rotkreuz-Institut BBW  
**Gesamtumfang**: 80 Stunden

---

## 1. Zeitplanung nach Projektphasen

### 1.1 Übersicht

| Phase | Zeitaufwand | Prozent | Zeitraum |
|-------|-------------|---------|----------|
| **1. Analysephase** | 10h | 12.5% | Woche 1 |
| **2. Entwurfsphase** | 12h | 15% | Woche 1-2 |
| **3. Implementierungsphase** | 40h | 50% | Woche 2-5 |
| **4. Testphase** | 11h | 13.75% | Woche 5-6 |
| **5. Dokumentationsphase** | 5h | 6.25% | Woche 6 |
| **6. Abschlussphase** | 2h | 2.5% | Woche 6 |
| **Gesamt** | **80h** | **100%** | **6 Wochen** |

### 1.2 Zeitlicher Ablauf

```
Woche 1: [███████████░░░░░░░] Analyse (10h) + Entwurf (6h)
Woche 2: [█████████████████░] Entwurf (6h) + Impl. (12h)
Woche 3: [█████████████████░] Implementierung (16h)
Woche 4: [█████████░░░░░░░░░] Implementierung (12h)
Woche 5: [██████████████░░░░] Testing (8h) + Impl. (3h)
Woche 6: [███████░░░░░░░░░░░] Testing (3h) + Doku (5h) + Abschluss (2h)
```

---

## 2. Detaillierte Zeitplanung

### Phase 1: Analysephase (10 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 1.1 | Ist-Analyse durchführen | 3h | Dokumentation aktueller Prozess |
| 1.2 | Anforderungen aufnehmen | 2h | Anforderungskatalog (funktional) |
| 1.3 | Use Cases definieren | 2h | Use-Case-Diagramm + Beschreibungen |
| 1.4 | Wirtschaftlichkeit bewerten | 2h | Kosten-Nutzen-Analyse |
| 1.5 | Soll-Konzept erstellen | 1h | Zieldefinition, Akzeptanzkriterien |

**Meilenstein M1**: Anforderungen definiert und dokumentiert

---

### Phase 2: Entwurfsphase (12 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 2.1 | Systemarchitektur entwerfen | 4h | Schichtenmodell, Komponentendiagramm |
| 2.2 | Datenmodell entwickeln | 2h | ER-Diagramm, TypeScript Interfaces |
| 2.3 | Algorithmen spezifizieren | 3h | Pseudocode für Fairness-Engine |
| 2.4 | UI-Konzept erstellen | 2h | Wireframes, Mockups |
| 2.5 | Technologie-Stack festlegen | 1h | Begründete Technologieauswahl |

**Meilenstein M2**: Architektur und Design abgeschlossen

---

### Phase 3: Implementierungsphase (40 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 3.1 | Projekt-Setup | 2h | Vite, TypeScript, Dependencies |
| 3.2 | Datenmodell implementieren | 3h | TypeScript Interfaces, Types |
| 3.3 | File Storage entwickeln | 3h | File System Access API Integration |
| 3.4 | Bayesian State Tracking | 4h | bayesianState.ts + Tests |
| 3.5 | Penalized Priority | 3h | penalizedPriority.ts + Tests |
| 3.6 | Softmax Selection | 3h | softmaxSelection.ts + Tests |
| 3.7 | Fairness Constraints | 2h | fairnessConstraints.ts + Tests |
| 3.8 | Schedule Engine | 4h | scheduleEngine.ts Kernlogik |
| 3.9 | Person Manager | 3h | personManager.ts CRUD |
| 3.10 | UI-Komponenten (People Tab) | 2h | React Component + Styling |
| 3.11 | UI-Komponenten (Schedule Tab) | 2h | Schedule Generierung UI |
| 3.12 | UI-Komponenten (Manual Tab) | 2h | Manuelle Anpassungen UI |
| 3.13 | UI-Komponenten (Data Tab) | 1h | Import/Export UI |
| 3.14 | Integration & Bugfixing | 1h | Komponenten zusammenführen |

**Meilenstein M3**: Basis-UI implementiert (nach 3.10)  
**Meilenstein M4**: Fairness-Engine funktional (nach 3.7)  
**Meilenstein M5**: Alle Features implementiert

---

### Phase 4: Testphase (11 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 4.1 | Unit-Tests schreiben | 5h | 70+ Unit-Tests |
| 4.2 | Integration-Tests | 2h | 20+ Integration-Tests |
| 4.3 | Performance-Tests | 2h | Benchmarks, Stress-Tests |
| 4.4 | Benutzer-Tests | 1h | Feedback von Koordinatoren |
| 4.5 | Fehleranalyse & Fixes | 1h | Bugfixes basierend auf Tests |

**Meilenstein M6**: Tests > 80% Coverage erreicht

---

### Phase 5: Dokumentationsphase (5 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 5.1 | API-Dokumentation | 1h | JSDoc für alle Public APIs |
| 5.2 | Benutzerhandbuch | 1h | USER_GUIDE.md mit Screenshots |
| 5.3 | Projektdokumentation | 2h | IHK-Dokumentation fertigstellen |
| 5.4 | README & Deployment | 1h | Installation, Deployment-Guide |

**Meilenstein M7**: Dokumentation vollständig

---

### Phase 6: Abschlussphase (2 Stunden)

| Nr | Tätigkeit | Zeitaufwand | Ergebnis |
|----|-----------|-------------|----------|
| 6.1 | Produktiv-Deployment | 0.5h | Build, Deployment |
| 6.2 | Übergabe an Betrieb | 0.5h | Einweisung Koordinatoren |
| 6.3 | Präsentationsvorbereitung | 1h | Folien, Demo vorbereiten |

**Meilenstein M8**: Produktiv-Einsatz erfolgreich

---

## 3. Gantt-Diagramm

```
Aufgabe                    | W1 | W2 | W3 | W4 | W5 | W6 |
---------------------------|----|----|----|----|----|----|
1. Analyse                 |████|    |    |    |    |    |
2. Entwurf                 |████|██  |    |    |    |    |
3. Implementierung         |    |████|████|████|██  |    |
4. Testing                 |    |    |    |    |████|██  |
5. Dokumentation           |    |    |    |    |    |████|
6. Abschluss               |    |    |    |    |    |██  |
---------------------------|----|----|----|----|----|----|
Meilensteine:
M1 Anforderungen           |  ● |    |    |    |    |    |
M2 Architektur             |    |  ● |    |    |    |    |
M3 Basis-UI                |    |    |  ● |    |    |    |
M4 Fairness-Engine         |    |    |    |  ● |    |    |
M5 Features komplett       |    |    |    |    |  ● |    |
M6 Tests > 80%             |    |    |    |    |  ● |    |
M7 Dokumentation           |    |    |    |    |    |  ● |
M8 Produktiv-Einsatz       |    |    |    |    |    |  ● |
```

---

## 4. Kostenplanung

### 4.1 Personalkosten

| Position | Stundensatz | Stunden | Kosten |
|----------|-------------|---------|--------|
| Auszubildender (3. Lehrjahr) | 15,79 €/h | 80h | 1.263 € |
| Fachlicher Betreuer | 45 €/h | 5h | 225 € |
| **Summe Personalkosten** | | | **1.488 €** |

### 4.2 Hardwarekosten

| Position | Kosten | Anmerkung |
|----------|--------|-----------|
| Entwicklungs-PC | 0 € | Vorhanden |
| Test-Geräte | 0 € | Vorhanden |
| **Summe Hardware** | **0 €** | Keine Neuanschaffungen |

### 4.3 Softwarekosten

| Position | Kosten | Anmerkung |
|----------|--------|-----------|
| Visual Studio Code | 0 € | Open Source |
| Node.js | 0 € | Open Source |
| React, TypeScript, Vite | 0 € | Open Source |
| Git / GitHub | 0 € | Free Tier ausreichend |
| **Summe Software** | **0 €** | Nur Open Source |

### 4.4 Infrastrukturkosten

| Position | Kosten | Anmerkung |
|----------|--------|-----------|
| Server / Hosting | 0 € | Keine Server benötigt |
| Cloud-Dienste | 0 € | Lokale Speicherung |
| Domain | 0 € | Nicht erforderlich |
| **Summe Infrastruktur** | **0 €** | Offline-Anwendung |

### 4.5 Gesamtkostenübersicht

| Kategorie | Kosten |
|-----------|--------|
| Personalkosten | 1.488 € |
| Hardwarekosten | 0 € |
| Softwarekosten | 0 € |
| Infrastrukturkosten | 0 € |
| **Projektgesamtkosten** | **1.488 €** |

---

## 5. Wirtschaftlichkeitsbetrachtung

### 5.1 Einsparungen (pro Jahr)

| Position | Vorher | Nachher | Einsparung |
|----------|--------|---------|------------|
| Planungszeit/Woche | 45 Min | 5 Min | 40 Min |
| Planungszeit/Jahr | ~40h | ~4h | **36h/Jahr** |
| Personalkosten (Koordinator 35 €/h) | 1.400 € | 140 € | **1.260 €/Jahr** |

### 5.2 Amortisation

```
Projektkosten:           1.488 €
Einsparung pro Jahr:     1.260 €

Amortisationszeit:       1.18 Jahre ≈ 14 Monate
```

**Return on Investment (ROI)**:
```
ROI = (Einsparung - Kosten) / Kosten × 100%
ROI (Jahr 1) = (1.260 - 1.488) / 1.488 × 100% = -15.3%
ROI (Jahr 2) = (2.520 - 1.488) / 1.488 × 100% = +69.4%
ROI (Jahr 3) = (3.780 - 1.488) / 1.488 × 100% = +154.0%
```

### 5.3 Qualitative Vorteile

**Nicht monetär messbar**:
- ✅ Fairness-Verbesserung (Gini 0.35 → 0.22)
- ✅ Transparenz durch nachvollziehbare Metriken
- ✅ Zufriedenheit der Teilnehmer steigt
- ✅ Weniger manuelle Fehler
- ✅ Bessere Datenauswertung möglich
- ✅ Professionelleres Image

### 5.4 Fazit

Das Projekt ist **wirtschaftlich sinnvoll**:
- ✅ Amortisation innerhalb 1 Jahr
- ✅ Keine laufenden Kosten (Infrastruktur)
- ✅ Wartung minimal (ca. 2h/Jahr)
- ✅ Hoher qualitativer Mehrwert
- ✅ Skalierbar für andere BBW-Standorte

---

## 6. Ressourcenplanung

### 6.1 Personelle Ressourcen

| Rolle | Person | Verfügbarkeit | Aufgaben |
|-------|--------|---------------|----------|
| Entwickler | Kai Delor | 70h (Vollzeit) | Alle Entwicklungsaufgaben |
| Fachlicher Betreuer | [Name] | 5h (beratend) | Review, Fachfragen |
| Test-Nutzer | Koordinatoren | 3h (sporadisch) | Benutzer-Feedback |

### 6.2 Technische Ressourcen

**Hardware**:
- Entwicklungs-PC (Windows 11, 16GB RAM, SSD)
- Test-Tablet (iPad/Android) für Responsive-Tests

**Software** (alle vorhanden):
- Visual Studio Code
- Node.js 20.x
- Chrome/Edge DevTools
- Git 2.x

### 6.3 Räumliche Ressourcen

- Arbeitsplatz im BBW (vorhanden)
- Besprechungsraum für Nutzer-Tests (nach Bedarf)

---

## 7. Risikoanalyse

| Risiko | Wahrscheinlichkeit | Auswirkung | Maßnahme |
|--------|-------------------|------------|----------|
| Performance-Probleme bei 100+ Personen | Mittel | Hoch | Performance-Tests früh, Optimierung |
| Browser-Kompatibilität (File API) | Niedrig | Mittel | Feature-Detection, Fallback-Warnung |
| Algorithmus zu komplex | Niedrig | Hoch | Schrittweise Implementierung, Tests |
| Zeitüberschreitung | Niedrig | Mittel | Puffer in kritischen Phasen |
| Änderung Anforderungen | Niedrig | Mittel | Klare Anforderungen zu Beginn |

**Risikominimierung**:
- Agile Entwicklung mit wöchentlichen Reviews
- Frühe Prototypen für Feedback
- Umfassende Tests ab Phase 3
- Regelmäßige Kommunikation mit Betreuer

---

## 8. Qualitätssicherung

### 8.1 Code-Qualität

- ✅ TypeScript Strict Mode
- ✅ ESLint Konfiguration
- ✅ Prettier Code-Formatierung
- ✅ Git Pre-Commit Hooks
- ✅ Code-Reviews durch Betreuer

### 8.2 Test-Qualität

- ✅ Ziel: > 80% Code Coverage
- ✅ Unit-Tests für alle Algorithmen
- ✅ Integration-Tests für Workflows
- ✅ Performance-Benchmarks
- ✅ Benutzer-Akzeptanz-Tests

### 8.3 Dokumentations-Qualität

- ✅ JSDoc für alle Public APIs
- ✅ README mit Installationsanleitung
- ✅ Benutzerhandbuch mit Screenshots
- ✅ Architektur-Dokumentation
- ✅ IHK-konforme Projektdokumentation

---

<div align="center">

**Zeit- und Kostenplanung**  
GießPlan - Plant Watering Schedule Management System

IHK Abschlussprojekt  
Fachinformatiker/-in für Anwendungsentwicklung

Dezember 2025

</div>
