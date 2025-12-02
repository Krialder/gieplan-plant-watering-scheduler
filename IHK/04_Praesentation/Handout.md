# IHK Prüfungs-Handout - GießPlan

---

## Projektübersicht

| **Kategorie** | **Details** |
|---------------|-------------|
| **Projektname** | GießPlan - Plant Watering Schedule Management System |
| **Auszubildender** | Kai Delor |
| **Ausbildungsberuf** | Fachinformatiker/-in für Anwendungsentwicklung |
| **Ausbildungsbetrieb** | [Firmenname] |
| **Projektdauer** | 70 Stunden über 6 Wochen |
| **Abgabedatum** | [Datum] |

---

## Problemstellung & Lösung

**Problem**: Berufliches Trainingszentrum (BTZ) benötigt faire, automatisierte Planung von wöchentlichen Gießdiensten für 20-30 Teilnehmer. Bisherige Excel-Lösung zeitaufwändig, fehleranfällig, unfair empfunden.

**Lösung**: Single-Page-Anwendung mit intelligenten Fairness-Algorithmen:
- **Bayesian Random Walk** (Kalman-Filter für Zuweisungsraten)
- **Penalized Priority System** (Multi-Kriterien-Bewertung)
- **Gumbel-Softmax Selection** (Stochastische Teamauswahl)
- **Constraint Checking** (Gini < 0.25, CV < 0.30)

---

## Technologie-Stack

```
Frontend:    React 19.0, TypeScript 5.7, TailwindCSS 4.1
Build:       Vite 6.3
Storage:     File System Access API (100% lokal, keine Server)
Testing:     Vitest 4.0 (102 Tests, 85%+ Coverage)
Deployment:  Static Hosting (Netlify/Vercel)
```

---

## System-Architektur

```
┌─────────────────────────────────────────────────┐
│          React UI Layer (4 Tabs)                │
│  Schedule | People | Manual | Data              │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Business Logic Layer                    │
│  ┌──────────────┐    ┌──────────────────┐      │
│  │Schedule Engine│◄──┤Fairness Engine   │      │
│  └──────────────┘    └──────────────────┘      │
│  • Generation         • Bayesian State          │
│  • Validation         • Priority Calculation    │
│  • Export             • Softmax Selection       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Storage Layer (Local Files)            │
│  yearData_2025.json (People, Schedules, History)│
└─────────────────────────────────────────────────┘
```

---

## Kern-Algorithmen

### 1. Bayesian Random Walk (Kalman Filter)
```
Prior:  θ_t ~ N(μ_prior, σ²_prior + σ²_process)
Update: μ_post = μ_prior + K(y - μ_prior)
Gain:   K = σ²_prior / (σ²_prior + σ²_obs)
```
→ Glättet Zuweisungsraten, verhindert "Catch-up"-Problem

### 2. Penalized Priority
```
Priority = BasePriority × MentorPenalty × RecencyBonus × DebtBonus
  • BasePriority = 1 / (currentRate + ε)
  • MentorPenalty = 0.85 (für Mentoren)
  • RecencyBonus = Unterrepräsentation in letzten 4 Wochen
  • DebtBonus = Kompensation historischer Schuld
```

### 3. Gumbel-Softmax Selection
```
score_i = log(priority_i) + Gumbel(0,1) / temperature
Wähle k Kandidaten mit höchsten Scores
```
→ Stochastische Auswahl mit gewichteten Wahrscheinlichkeiten

---

## Projektergebnisse

### Deliverables
- ✅ Lauffähige Web-Anwendung (15.000+ LoC)
- ✅ Projektdokumentation (60+ Seiten)
- ✅ UML-Diagramme (Class, Sequence, Use-Case, Component, Activity)
- ✅ ER-Diagramme & Datenmodell
- ✅ Test-Suite (102 Tests, 87.3% Coverage)
- ✅ Code-Beispiele & API-Dokumentation

### Performance-Metriken
| **Szenario** | **Zeit** | **Ziel** | **Status** |
|--------------|----------|----------|------------|
| 10 Personen, 52 Wochen | 48ms | < 100ms | ✅ |
| 100 Personen, 52 Wochen | 3.8s | < 5s | ✅ |

### Fairness-Metriken (1000 Simulationen)
| **Metrik** | **Durchschnitt** | **Schwellwert** | **Status** |
|------------|------------------|-----------------|------------|
| Gini-Koeffizient | 0.18 ± 0.04 | < 0.25 | ✅ |
| Variationskoeffizient | 0.22 ± 0.05 | < 0.30 | ✅ |
| Max Range | 2.1 ± 0.8 | ≤ 3 | ✅ |

---

## Wirtschaftlichkeit

| **Position** | **Betrag** |
|--------------|------------|
| **Entwicklungskosten** | 1.275 EUR |
| Personalkosten (70h × 15 EUR/h) | 1.050 EUR |
| Sonstiges (Druck, IHK-Gebühren) | 225 EUR |
| **Einsparungen pro Jahr** | ~600 EUR |
| Zeitersparnis (2h/Monat × 25 EUR/h) | 600 EUR |
| **ROI (Return on Investment)** | **12 Monate** |

**Intangible Benefits**:
- Höhere Fairness-Wahrnehmung im Team
- Weniger Konflikte über Zuteilung
- Transparente, nachvollziehbare Entscheidungen
- Professionelleres Image der Organisation

---

## Technische Highlights

1. **Type-Safety**: TypeScript eliminierte 90%+ potenzielle Runtime-Fehler
2. **Offline-First**: File System Access API ermöglicht 100% lokale Nutzung
3. **Mathematical Rigor**: Bayesian & Softmax basieren auf bewährten ML-Methoden
4. **Testing**: 85%+ Coverage mit Unit-, Integration- und Stress-Tests
5. **Performance**: Sub-100ms Generation für reale Szenarien
6. **Browser-Native**: Keine Installations-/Server-Anforderungen

---

## Lessons Learned

✅ **Erfolgreich**:
- TypeScript Type-Safety verhinderte viele Bugs
- Vitest ermöglichte schnelle Test-Driven Development
- React 19 bietet exzellente Performance
- File System API elegant für lokale Speicherung

⚠️ **Herausforderungen**:
- Browser-Kompatibilität (FSA nur Chrome/Edge 102+)
- Balance: Mathematische Korrektheit vs. Benutzerfreundlichkeit
- Floating-Point-Precision in Bayesian Numerics
- UX-Design für nicht-technische Zielgruppe

---

## Ausblick & Erweiterungen

**Kurzfristig (V2.0)**:
- PWA-Support (Mobile App)
- Firefox/Safari Polyfill
- E-Mail-Benachrichtigungen

**Mittelfristig**:
- Machine Learning (Urlaubsvorhersage)
- Advanced Analytics (Dashboards)
- iCal/Google Calendar Export

**Langfristig**:
- Multi-Standort Support
- Team-übergreifende Planung
- Enterprise Admin-Panel

---

## Kontakt & Ressourcen

| **Ressource** | **Link/Verweis** |
|---------------|------------------|
| **Quellcode** | GitHub: `github.com/[username]/gieplan` |
| **Dokumentation** | `IHK/02_Dokumentation/Projektdokumentation.md` |
| **Live-Demo** | [URL bei Deployment] |
| **E-Mail** | [E-Mail-Adresse] |

---

<div align="center">

**IHK Abschlussprojekt - Fachinformatiker/-in für Anwendungsentwicklung**

**GießPlan - Plant Watering Schedule Management System**

Kai Delor | Dezember 2025

Präsentationsdauer: 15 Minuten | Fachgespräch: 15 Minuten

</div>
