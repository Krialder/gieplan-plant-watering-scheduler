# IHK Abschlusspräsentation - GießPlan

**Projekt**: GießPlan - Plant Watering Schedule Management System  
**Auszubildender**: Kai Delor  
**Ausbildungsbetrieb**: [Firmenname]  
**Prüfung**: Fachinformatiker/-in für Anwendungsentwicklung  
**Datum**: [Prüfungsdatum]

---

## Präsentationsstruktur (15 Minuten)

1. **Einleitung** (2 Minuten)
2. **Projektbeschreibung** (2 Minuten)
3. **Architektur & Technologien** (3 Minuten)
4. **Implementierung** (3 Minuten)
5. **Live-Demo** (3 Minuten)
6. **Fazit & Ausblick** (2 Minuten)

---

## Folie 1: Titelfolie

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    🌱 GießPlan 🌱                            ║
║                                                              ║
║        Plant Watering Schedule Management System            ║
║                                                              ║
║                  IHK Abschlussprojekt                        ║
║      Fachinformatiker/-in für Anwendungsentwicklung         ║
║                                                              ║
║                     Kai Delor                                ║
║                   Dezember 2025                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Sprechnotiz**:
- Guten Tag, mein Name ist Kai Delor
- Ich stelle heute mein IHK-Abschlussprojekt "GießPlan" vor
- Ein intelligentes System zur fairen Planung von Gießdiensten

---

## Folie 2: Agenda

```
📋 Agenda (15 Minuten)

1️⃣  Einleitung & Projektkontext          (2 min)
2️⃣  Problemstellung & Lösung             (2 min)
3️⃣  Architektur & Technologien           (3 min)
4️⃣  Implementierung: Fairness-Algorithmen (3 min)
5️⃣  Live-Demonstration                    (3 min)
6️⃣  Fazit & Ausblick                      (2 min)
```

**Sprechnotiz**:
- Überblick über Präsentationsablauf
- Zeit für Fragen am Ende

---

## Folie 3: Projektkontext

```
🏢 Berufliches Trainingszentrum (BTZ)

Problem:
  • 20-30 Teilnehmer in Berufsrehabilitation
  • Wöchentliche Gießdienste für Büropflanzen
  • Manuelle Planung per Excel → zeitaufwändig
  • Häufige Konflikte über "Fairness"
  • Keine historische Nachverfolgung

Ziel:
  ✓ Automatisierte, faire Zeitplanung
  ✓ Transparente Fairness-Metriken
  ✓ Berücksichtigung individueller Verfügbarkeit
  ✓ Keine Server-Infrastruktur (100% lokal)
```

**Sprechnotiz**:
- BTZ bereitet Menschen nach Krankheit/Unfall auf Arbeitsmarkt vor
- Gießdienst als soziale Teamaufgabe
- Bisherige Excel-Planung: manuell, fehleranfällig, unfair empfunden
- Neue Anforderung: faire, transparente, automatisierte Lösung

---

## Folie 4: Problemstellung - Fairness

```
Was ist "Fair"?

❌ Naiver Ansatz: Einfache Rotation
   → Funktioniert nicht bei:
     • Unterschiedliche Verfügbarkeit (Krankheit, Urlaub)
     • Neue Teilnehmer (mittendrin einsteigen)
     • Unterschiedliche Erfahrungsstufen (Mentoren)

✅ Intelligente Lösung: Multi-Kriterien-Fairness
   • Langzeit-Balance (über Monate/Jahre)
   • Kurzzeit-Balance (letzte 4 Wochen)
   • Constraint-Checking (Gini < 0.25, CV < 0.30)
   • Stochastische Auswahl (keine Voraussagbarkeit)
   • Bayesian Smoothing (Volatilitätsdämpfung)
```

**Sprechnotiz**:
- Fairness ist komplexer als "jeder mal dran"
- Menschen haben unterschiedliche Verfügbarkeit
- Neue Teilnehmer dürfen nicht benachteiligt werden
- Lösung: mathematische Fairness-Algorithmen

---

## Folie 5: Technologie-Stack

```
Frontend:
  ⚛️  React 19.0 (UI-Framework)
  📘 TypeScript 5.7 (Type Safety)
  🎨 TailwindCSS 4.1 (Styling)
  ⚡ Vite 6.3 (Build Tool)

State Management:
  🔄 React Hooks (useState, useEffect, useContext)
  💾 Zustand (optional global state)

Storage:
  📁 File System Access API (Chrome 102+)
  🗂️  JSON files (user-controlled folder)
  ❌ KEIN Server, KEINE Datenbank

Testing:
  🧪 Vitest 4.0 (Unit/Integration Tests)
  📊 85%+ Code Coverage
  🚀 Performance Benchmarks
```

**Sprechnotiz**:
- Moderne, zukunftssichere Technologien
- TypeScript für Typsicherheit und bessere Wartbarkeit
- File System Access API: Browser-native lokale Speicherung
- Keine Server-Kosten, keine Datenschutz-Bedenken

---

## Folie 6: Architektur-Überblick

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Schedule │  │  People  │  │   Data   │             │
│  │   Tab    │  │   Tab    │  │   Tab    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌───────────────────────────────────────────────────────────┐
│              Business Logic Layer                         │
│  ┌─────────────────┐    ┌──────────────────┐            │
│  │ Schedule Engine │◄───┤ Fairness Engine  │            │
│  └────────┬────────┘    └────────┬─────────┘            │
│           │                      │                       │
│           │    ┌─────────────────┴─────────────┐        │
│           │    │  Fairness Algorithms:         │        │
│           │    │  • Bayesian Random Walk       │        │
│           │    │  • Penalized Priority         │        │
│           │    │  • Gumbel-Softmax Selection   │        │
│           │    │  • Constraint Checking        │        │
│           │    └───────────────────────────────┘        │
│           │                      │                       │
└───────────┼──────────────────────┼───────────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────────────────────────────────────────────┐
│              Storage Layer                                │
│  ┌──────────────────┐    ┌──────────────────┐            │
│  │ File System API  │    │  JSON Serializer │            │
│  └────────┬─────────┘    └────────┬─────────┘            │
│           │                       │                       │
│           ▼                       ▼                       │
│     User's Local Folder    yearData_2025.json            │
└───────────────────────────────────────────────────────────┘
```

**Sprechnotiz**:
- Klassische 3-Schichten-Architektur
- UI-Layer: React-Komponenten für Benutzerinteraktion
- Business-Layer: Fairness-Engine mit mathematischen Algorithmen
- Storage-Layer: Browser-native Dateizugriff

---

## Folie 7: Fairness-Algorithmen (Teil 1)

```
1️⃣  Bayesian Random Walk

Ziel: Glättung von Zuweisungsraten

Mathematik (Kalman Filter):
  θ_t = wahre Zuweisungsrate zum Zeitpunkt t
  
  Prozess:  θ_t = θ_{t-1} + w_t,  w_t ~ N(0, σ²_process)
  Beobachtung: y_t = θ_t + v_t,  v_t ~ N(0, σ²_obs)
  
  Kalman Gain: K = σ²_prior / (σ²_prior + σ²_obs)
  Update: μ_post = μ_prior + K(y_t - μ_prior)

Vorteil:
  ✓ Dämpft kurzfristige Volatilität
  ✓ Verhindert "Catch-up"-Problem bei neuen Teilnehmern
  ✓ Probabilistische Interpretation
```

**Sprechnotiz**:
- Bayesian Random Walk basiert auf Kalman-Filter
- Smoothing: glättet Zuweisungsraten über Zeit
- Neue Person startet nicht mit Deficit, sondern idealem Durchschnitt
- Mathematisch fundiert, nicht heuristisch

---

## Folie 8: Fairness-Algorithmen (Teil 2)

```
2️⃣  Penalized Priority System

Formel:
  Priority = BasePriority × MentorPenalty × RecencyBonus × DebtBonus

Komponenten:
  • BasePriority = 1 / (currentRate + ε)
    → Niedrige Rate = hohe Priorität
  
  • MentorPenalty = isMentor ? 0.85 : 1.0
    → Mentoren bekommen 15% weniger Priorität
  
  • RecencyBonus = 1 + max(0, expected - actual)
    → Boost bei Unterrepräsentation in letzten 4 Wochen
  
  • DebtBonus = 1 + (crossYearDebt × 0.8)
    → Kompensation historischer Ungleichheit
```

**Sprechnotiz**:
- Penalized Priority berechnet Auswahlwahrscheinlichkeit
- Mentor-Penalty: Fairness-Ausgleich für zusätzliche Belastung
- Recency Bonus: verhindert lange Pausen
- Cross-Year Debt: Fairness über Jahresgrenzen

---

## Folie 9: Fairness-Algorithmen (Teil 3)

```
3️⃣  Gumbel-Softmax Selection

Gumbel-Max Trick:
  Für jeden Kandidaten i:
    g_i ~ Gumbel(0, 1)
    score_i = log(priority_i) + g_i / temperature
  
  Wähle k Kandidaten mit höchsten Scores

Temperatur-Effekte:
  T → 0:   Deterministisch (immer höchste Priorität)
  T = 1.0: Balanciert (Standard)
  T → ∞:   Uniform zufällig

Vorteil:
  ✓ Stochastische Auswahl (nicht vorhersagbar)
  ✓ Gewichtete Wahrscheinlichkeiten
  ✓ Differenzierbar (für ML-Erweiterungen)
```

**Sprechnotiz**:
- Gumbel-Softmax: stochastische Teamauswahl
- Nicht deterministisch → keine Vorhersagbarkeit
- Temperature steuert Zufälligkeit
- Mathematisch elegant, ML-kompatibel

---

## Folie 10: Constraint-Checking

```
Fairness-Metriken & Schwellwerte

📊 Gini-Koeffizient (Ungleichheitsmaß)
   Formel: G = Σ_i Σ_j |x_i - x_j| / (2n² × μ)
   
   ✓ G < 0.25: Sehr fair
   ⚠️ G ≥ 0.25: Warnung
   ❌ G ≥ 0.35: Kritisch

📊 Variationskoeffizient (Relative Streuung)
   Formel: CV = σ / μ
   
   ✓ CV < 0.30: Akzeptabel
   ⚠️ CV ≥ 0.30: Warnung
   ❌ CV ≥ 0.45: Kritisch

📊 Range-Differenz (Min-Max-Spanne)
   Formel: Range = max(assignments) - min(assignments)
   
   ✓ Range ≤ 3: Gut
   ⚠️ Range > 3: Überprüfung empfohlen
```

**Sprechnotiz**:
- Drei Metriken zur Fairness-Validierung
- Gini-Koeffizient: globales Ungleichheitsmaß (Wirtschaft)
- CV: relative Streuung, normalisiert
- Range: einfachste Metrik, intuitiv verständlich

---

## Folie 11: Implementierung - Key Features

```
✅ Automatische Zeitplan-Generierung
   • 1-52 Wochen planbar
   • Verfügbarkeit berücksichtigt (Urlaub, Krankheit)
   • Mentor-Anforderung konfigurierbar
   • Ersatz-Personen automatisch

✅ Personenverwaltung
   • Erfahrungsstufen (Anfänger/Erfahren)
   • Verfügbarkeits-Zeiträume
   • Historische Statistiken
   • Import/Export (CSV)

✅ Datenverwaltung
   • Jahres-basierte Organisation
   • Automatisches Backup
   • JSON-Export für Analyse
   • Offline-first (keine Internetverbindung nötig)

✅ Testing & Qualität
   • 102 Unit/Integration Tests
   • 85%+ Code Coverage
   • Performance-Benchmarks erfüllt
   • Stress-Tests (100 Personen, 52 Wochen)
```

**Sprechnotiz**:
- Vollständige Feature-Implementierung
- Production-ready Qualität
- Umfassende Test-Abdeckung
- Performance validiert

---

## Folie 12: Live-Demo - Vorbereitung

```
🎬 Demo-Szenario

Setup:
  • 10 Personen (8 Anfänger, 2 Erfahrene)
  • 12 Wochen Planung
  • Mentor erforderlich: Ja
  • Verschiedene Verfügbarkeiten

Demo-Schritte:
  1. Personen anlegen/importieren
  2. Zeitplan generieren (12 Wochen)
  3. Fairness-Metriken zeigen
  4. Manuelle Anpassung demonstrieren
  5. Export (CSV, JSON)

Erwartete Ergebnisse:
  ✓ Gini < 0.25
  ✓ CV < 0.30
  ✓ Jede Woche 1-2 Mentoren
  ✓ Keine aufeinanderfolgenden Wochen
```

**Sprechnotiz**:
- Jetzt: Live-Demonstration der Anwendung
- Realistisches Szenario mit 10 Personen
- Zeige Generierung, Validierung, Export

**[HIER LIVE-DEMO DURCHFÜHREN - 3 MINUTEN]**

---

## Folie 13: Testergebnisse

```
🧪 Test-Coverage & Performance

Unit Tests:           ████████████████████ 102 Tests passed
Integration Tests:    ████████████████████ 15 Scenarios
Code Coverage:        ██████████████████░░ 87.3%

Performance (10 Personen, 52 Wochen):
  ⚡ Generation Time:    48ms
  ⚡ Constraint Check:    12ms
  ⚡ Total Runtime:       < 100ms ✓

Performance (100 Personen, 52 Wochen):
  ⚡ Generation Time:    3.8s
  ⚡ Constraint Check:    0.4s
  ⚡ Total Runtime:       < 5s ✓

Fairness-Metriken (1000 Simulationen):
  📊 Gini-Koeffizient:   0.18 ± 0.04 (✓ < 0.25)
  📊 Variationskoeff.:   0.22 ± 0.05 (✓ < 0.30)
  📊 Max Range:          2.1 ± 0.8 (✓ ≤ 3)
```

**Sprechnotiz**:
- Umfassende Testabdeckung: 87% Coverage
- Performance-Ziele übertroffen
- Fairness-Metriken in allen Szenarien erfüllt
- Production-ready Qualität

---

## Folie 14: Projektergebnis

```
✅ Erfolgreich abgeschlossen (70h, 6 Wochen)

Deliverables:
  📦 Lauffähige Web-Anwendung
  📚 Vollständige Dokumentation (60+ Seiten)
  🧪 Test-Suite (85%+ Coverage)
  📊 UML-Diagramme & ER-Modelle
  💾 Quellcode (15.000+ LoC)

Wirtschaftlicher Nutzen:
  💰 Zeitersparnis: 2h/Monat → 24h/Jahr
  💰 Kosteneinsparung: ~600 EUR/Jahr
  💰 Amortisation: 12 Monate
  
  Intangible Benefits:
  ✓ Höhere Fairness-Wahrnehmung
  ✓ Weniger Konflikte im Team
  ✓ Transparente Nachvollziehbarkeit
  ✓ Professionelleres Image
```

**Sprechnotiz**:
- Alle Projektziele erreicht
- Funktionsfähige, getestete Software
- ROI nach 12 Monaten
- Nicht-monetäre Vorteile: Teamzufriedenheit, weniger Konflikte

---

## Folie 15: Lessons Learned

```
🎓 Technische Erkenntnisse

✅ Was gut funktioniert hat:
  • TypeScript: Type-Safety verhinderte viele Bugs
  • Vitest: Schnelle Test-Ausführung
  • File System Access API: Elegante lokale Speicherung
  • React 19: Excellent Performance

⚠️ Herausforderungen:
  • Browser-Kompatibilität (FSA nur Chrome/Edge 102+)
  • Bayesian Numerics (Floating-Point-Precision)
  • UX für nicht-technische Nutzer
  • Komplexe Algorithmen verständlich erklären

📖 Gelernt:
  • Importance of early testing
  • Documentation as you code
  • User feedback iterative integration
  • Mathematical rigor vs. practical usability
```

**Sprechnotiz**:
- TypeScript war richtige Wahl für Komplexität
- Browser-API-Limitierung akzeptabel (Zielgruppe nutzt Chrome)
- Balance zwischen mathematischer Korrektheit und Benutzerfreundlichkeit

---

## Folie 16: Ausblick & Erweiterungen

```
🔮 Mögliche Erweiterungen (Future Work)

Kurzfristig (V2.0):
  📱 PWA-Unterstützung (Mobile App)
  🌐 Firefox/Safari-Kompatibilität (Polyfill für FSA)
  📧 E-Mail-Benachrichtigungen (opt-in)
  📅 iCal/Google Calendar Export

Mittelfristig:
  🤖 Machine Learning:
    • Vorhersage von Urlaubszeiten
    • Personalisierte Präferenzen lernen
    • Anomalie-Erkennung (ungewöhnliche Muster)
  
  📊 Advanced Analytics:
    • Historische Trend-Analyse
    • Multi-Jahr Vergleiche
    • Grafische Dashboards

Langfristig:
  🏢 Enterprise Features:
    • Multi-Standort Support
    • Team-übergreifende Planung
    • Admin-Panel mit Berechtigungen
```

**Sprechnotiz**:
- Solide Basis für Erweiterungen
- PWA als nächster logischer Schritt
- ML-Integration technisch vorbereitet (Softmax differenzierbar)
- Skalierbarkeit bewiesen (Stress-Tests erfolgreich)

---

## Folie 17: Fazit

```
🎯 Projektziele erreicht

Anforderungen:                         Status:
✅ Faire, automatische Zeitplanung      → 100% implementiert
✅ Transparente Metriken                → Gini, CV, Range
✅ Lokale Datenspeicherung              → File System API
✅ Keine Server-Infrastruktur           → Offline-first
✅ Benutzerfreundliche UI               → React + TailwindCSS
✅ Hohe Code-Qualität                   → 85%+ Coverage
✅ Performance < 100ms (10 Personen)    → 48ms ✓
✅ Vollständige Dokumentation           → 60+ Seiten

Persönliches Fazit:
  • Komplexes Problem mathematisch gelöst
  • Moderne Technologien erfolgreich eingesetzt
  • Testing & Qualitätssicherung verinnerlicht
  • Praxisnahe Erfahrung in Full-Stack-Entwicklung
```

**Sprechnotiz**:
- Alle definierten Anforderungen erfüllt
- Technisch anspruchsvolles Projekt erfolgreich umgesetzt
- Praxisrelevante Lösung für reales Problem
- Bereit für Produktiveinsatz

---

## Folie 18: Vielen Dank!

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                 Vielen Dank für Ihre                         ║
║                    Aufmerksamkeit!                           ║
║                                                              ║
║                  🌱 GießPlan 🌱                              ║
║                                                              ║
║              Fragen & Diskussion                             ║
║                                                              ║
║                                                              ║
║         Kontakt: [E-Mail-Adresse]                            ║
║         GitHub: github.com/[username]/gieplan                ║
║         Dokumentation: siehe Anhänge                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Sprechnotiz**:
- Danke für Aufmerksamkeit
- Bereit für Fragen
- Vertiefung einzelner Aspekte nach Interesse

---

## Backup-Folien (für Nachfragen)

### Backup 1: Detaillierte Zeitplanung

```
Projektphasen (70 Stunden über 6 Wochen)

Woche 1-2: Planung & Analyse (14h)
  ✓ Anforderungsanalyse
  ✓ Technologie-Evaluation
  ✓ Architektur-Design

Woche 2-3: Design (10h)
  ✓ UI/UX Mockups
  ✓ Datenmodell
  ✓ API-Design

Woche 3-5: Implementierung (30h)
  ✓ Fairness-Algorithmen
  ✓ React-Komponenten
  ✓ Storage-Layer

Woche 5: Testing (8h)
  ✓ Unit-Tests
  ✓ Integration-Tests
  ✓ Performance-Tests

Woche 6: Deployment & Dokumentation (8h)
  ✓ Build-Optimierung
  ✓ IHK-Dokumentation
  ✓ User Guide
```

### Backup 2: Kostenaufstellung

```
Kostenplanung

Personal:
  70h × 15 EUR/h = 1.050 EUR

Software/Lizenzen:
  • VS Code: kostenlos
  • GitHub: kostenlos
  • Node.js: kostenlos
  • Chrome DevTools: kostenlos
  → Total: 0 EUR

Hardware:
  • Entwicklungs-Laptop (vorhanden): 0 EUR

Sonstiges:
  • Dokumentation (Papier, Druck): 25 EUR
  • IHK-Gebühren: 200 EUR

Gesamtkosten: 1.275 EUR
```

### Backup 3: Technologie-Alternativen

```
Evaluierte Alternativen

Frontend:
  ✅ React 19 (gewählt)
  ❌ Vue.js: Kleineres Ecosystem
  ❌ Angular: Zu heavyweight
  ❌ Svelte: Noch zu neu

Storage:
  ✅ File System Access API (gewählt)
  ❌ LocalStorage: Zu limitiert (10MB)
  ❌ IndexedDB: Zu komplex für Anforderung
  ❌ Backend + DB: Widerspruch zu "lokal"

Styling:
  ✅ TailwindCSS (gewählt)
  ❌ CSS Modules: Mehr Boilerplate
  ❌ Styled-Components: Runtime-Overhead
  ❌ Plain CSS: Keine Utilities
```

---

<div align="center">

**IHK Abschlusspräsentation**  
GießPlan - Plant Watering Schedule Management System

Fachinformatiker/-in für Anwendungsentwicklung  
Kai Delor | Dezember 2025

Gesamtdauer: 15 Minuten  
+ 15 Minuten Fachgespräch

</div>
