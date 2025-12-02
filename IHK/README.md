# IHK Abschlussprojekt - Dokumentation

## GießPlan - Plant Watering Schedule Management System

**Auszubildender**: Kai Delor  
**Ausbildungsberuf**: Fachinformatiker/-in für Anwendungsentwicklung  
**Projektdauer**: 70 Stunden über 6 Wochen  
**Abgabedatum**: Dezember 2025

---

## 📂 Verzeichnisstruktur

Dieses Verzeichnis enthält die vollständige IHK-Projektdokumentation, gegliedert in vier Hauptbereiche:

```
IHK/
├── Vorlagen_Beispiele/           # Referenzmaterial
│   ├── Mustervorlage_Projektantrag.pdf
│   ├── Mustervorlage_Projektdokumentation.pdf
│   ├── Beispiel_Projekt_Markus_Amshove_1.pdf
│   └── Beispiel_Projekt_Markus_Amshove_2.pdf
│
├── 01_Antrag/                    # Projektantrag (vor Projektbeginn)
│   ├── Projektantrag_GiePlan.md
│   ├── Zeit_und_Kostenplanung.md
│   └── Anforderungskatalog.md
│
├── 02_Dokumentation/             # Hauptdokumentation (nach Projektabschluss)
│   └── Projektdokumentation.md
│
├── 03_Anhaenge/                  # Technische Anhänge
│   ├── UML_Diagramme.md
│   ├── Datenmodell.md
│   ├── Test_Dokumentation.md
│   └── Code_Beispiele.md
│
├── 04_Praesentation/             # Präsentationsmaterialien
│   ├── Praesentation.md
│   └── Handout.md
│
└── README.md                     # Diese Datei
```

---

## 📄 Dokumentenübersicht

### 1. Projektantrag (01_Antrag/)

Diese Dokumente wurden **vor Projektbeginn** erstellt und bei der IHK eingereicht:

#### 1.1 Projektantrag_GiePlan.md (~10 Seiten)

**Inhalt**:
- Projektbezeichnung und Kurzform
- Projektbeschreibung und -ziel
- Ist-Analyse (aktuelle Situation im BTZ)
- Soll-Konzept (geplante Lösung)
- Projektumfeld und Rahmenbedingungen
- Projektphasen mit Zeitplanung (70h)
- Abgrenzungskriterien (Was ist NICHT im Scope)
- Anlagen-Verzeichnis
- Unterschriften (Auszubildender, Betrieb, IHK)

**Zweck**: Offizieller Genehmigungsantrag für das IHK-Projekt

#### 1.2 Zeit_und_Kostenplanung.md (~8 Seiten)

**Inhalt**:
- Detaillierte Zeitplanung (6 Wochen, 70 Stunden)
  - Woche 1-2: Planung & Analyse (14h)
  - Woche 2-3: Design (10h)
  - Woche 3-5: Implementierung (30h)
  - Woche 5: Testing (8h)
  - Woche 6: Deployment & Dokumentation (8h)
- Gantt-Diagramm (ASCII-Art)
- Kostenaufstellung (Personal, Software, Hardware, Sonstiges)
- Gesamtkosten: 1.275 EUR
- Wirtschaftlichkeitsbetrachtung (ROI: 12 Monate)
- Risikoanalyse und Abwehrmaßnahmen

**Zweck**: Nachweis realistischer Planung und wirtschaftlicher Nutzen

#### 1.3 Anforderungskatalog.md (~12 Seiten)

**Inhalt**:
- Funktionale Anforderungen (FA-1 bis FA-5)
  - FA-1: Personenverwaltung
  - FA-2: Automatische Zeitplan-Generierung
  - FA-3: Manuelle Planungsanpassungen
  - FA-4: Datenverwaltung & Export
  - FA-5: Fairness-Visualisierung
- Nicht-funktionale Anforderungen (NFA-1 bis NFA-7)
  - Performance, Usability, Sicherheit, Wartbarkeit, etc.
- Use-Cases (10+ detaillierte Szenarien)
- User Stories mit Akzeptanzkriterien
- Abnahmekriterien

**Zweck**: Vollständige Spezifikation aller Anforderungen

---

### 2. Hauptdokumentation (02_Dokumentation/)

#### 2.1 Projektdokumentation.md (~60 Seiten)

**Inhalt**:

1. **Zusammenfassung** (1-2 Seiten)
   - Executive Summary
   - Projektziele
   - Kernergebnisse

2. **Planungsphase** (4-6 Seiten)
   - Anforderungsanalyse
   - Technologie-Evaluierung
   - Architektur-Planung

3. **Analysephase** (6-8 Seiten)
   - Ist-Analyse (Excel-Prozess)
   - Soll-Konzept (automatisierte Lösung)
   - Wirtschaftlichkeitsanalyse

4. **Entwurfsphase** (8-10 Seiten)
   - System-Architektur (3-Schichten)
   - Datenmodell (TypeScript-Interfaces)
   - UI/UX-Design (Wireframes)
   - Algorithmus-Design (Bayesian, Softmax)

5. **Implementierungsphase** (10-12 Seiten)
   - Frontend-Implementierung (React, TypeScript)
   - Fairness-Engine (Algorithmen)
   - Storage-Layer (File System API)
   - Technische Herausforderungen & Lösungen

6. **Testphase** (6-8 Seiten)
   - Unit-Tests (Vitest, 85%+ Coverage)
   - Integration-Tests
   - Performance-Tests (Benchmarks)
   - User-Acceptance-Testing (SUS: 78/100)

7. **Deployment-Phase** (4-6 Seiten)
   - Build-Optimierung (Vite)
   - Static Hosting (Netlify/Vercel)
   - Rollout-Plan

8. **Dokumentation** (4-6 Seiten)
   - User Guide
   - API-Dokumentation
   - Inline-Code-Dokumentation (JSDoc)

9. **Fazit** (4-6 Seiten)
   - Zielerreichung
   - Lessons Learned
   - Ausblick & Erweiterungen

**Zweck**: Vollständige Projektdokumentation nach IHK-Standards (max. 60 Seiten)

---

### 3. Technische Anhänge (03_Anhaenge/)

#### 3.1 UML_Diagramme.md (~15 Seiten)

**Inhalt**:
- **Klassendiagramm**: Fairness Engine (Bayesian, Priority, Softmax)
- **Sequenzdiagramm**: Schedule Generation Flow
- **Use-Case-Diagramm**: Actor-System-Interaktionen
- **Komponentendiagramm**: React-Komponenten & Abhängigkeiten
- **Aktivitätsdiagramm**: Zeitplan-Generierungsprozess

**Format**: ASCII-Art UML-Diagramme mit Beschreibungen

**Zweck**: Visualisierung der System-Architektur

#### 3.2 Datenmodell.md (~10 Seiten)

**Inhalt**:
- **ER-Diagramm**: Entitäten (Person, Schedule, WeekAssignment)
- **TypeScript-Interfaces**: Vollständige Typdefinitionen
- **JSON-Schema**: Beispiel-Daten für yearData_2025.json
- **SQL-Alternative**: PostgreSQL-Schema (für Referenz)

**Zweck**: Vollständige Datenmodell-Dokumentation

#### 3.3 Test_Dokumentation.md (~12 Seiten)

**Inhalt**:
- **Test-Protokolle**: Unit, Integration, E2E
- **Coverage-Reports**: 87.3% (Vitest)
- **Performance-Benchmarks**: 
  - 10 Personen, 52 Wochen: 48ms
  - 100 Personen, 52 Wochen: 3.8s
- **Fairness-Validierung**: Gini, CV, Range (1000 Simulationen)
- **User-Acceptance-Testing**: SUS-Score 78/100

**Zweck**: Nachweis umfassender Qualitätssicherung

#### 3.4 Code_Beispiele.md (~18 Seiten)

**Inhalt**:
- **Bayesian State Tracking**: Kalman-Filter-Implementierung
- **Penalized Priority**: Multi-Kriterien-Bewertung
- **Gumbel-Softmax Selection**: Stochastische Teamauswahl
- **Schedule Engine**: Orchestrierung der Algorithmen
- **File Storage**: File System Access API
- **React UI**: Komponenten-Beispiele

**Format**: TypeScript-Code mit Kommentaren und Erklärungen

**Zweck**: Demonstration der technischen Umsetzung

---

### 4. Präsentationsmaterialien (04_Praesentation/)

#### 4.1 Praesentation.md (~18 Folien)

**Inhalt**:
- Folie 1-2: Einleitung & Agenda
- Folie 3-4: Projektkontext & Problemstellung
- Folie 5-6: Technologie-Stack & Architektur
- Folie 7-10: Fairness-Algorithmen (Bayesian, Priority, Softmax, Constraints)
- Folie 11-12: Implementierung & Features
- Folie 13: Testergebnisse
- Folie 14-15: Projektergebnis & Lessons Learned
- Folie 16-17: Ausblick & Fazit
- Folie 18: Vielen Dank + Fragen
- Backup-Folien: Zeitplanung, Kosten, Technologie-Alternativen

**Dauer**: 15 Minuten (+ 15 Minuten Fachgespräch)

**Format**: Markdown mit ASCII-Visualisierungen (zur Konvertierung in PowerPoint/PDF)

**Zweck**: Mündliche Präsentation des Projekts vor IHK-Prüfungsausschuss

#### 4.2 Handout.md (1 Seite)

**Inhalt**:
- Projektübersicht (Tabelle)
- Problemstellung & Lösung (kompakt)
- Technologie-Stack
- System-Architektur (ASCII-Diagramm)
- Kern-Algorithmen (Formeln)
- Projektergebnisse (Metriken-Tabellen)
- Wirtschaftlichkeit
- Technische Highlights
- Kontakt & Ressourcen

**Format**: Kompakte 1-Seiten-Übersicht

**Zweck**: Handzettel für Prüfer während Präsentation

---

## 📋 Verwendete Standards & Formate

### Dokumentationsformat

- **Markup**: Markdown (`.md`)
- **Versionierung**: Git (GitHub)
- **Sprache**: Deutsch (IHK-Anforderung)
- **Stil**: Formal, sachlich, präzise

### IHK-Standards

- **Projektdokumentation**: Max. 60 Seiten (ohne Anhänge)
- **Zeitrahmen**: 35-70 Stunden
- **Präsentation**: 15 Minuten
- **Fachgespräch**: 15 Minuten

### Namenskonventionen

- Dateien: `PascalCase_mit_Unterstrichen.md`
- Ordner: `snake_case` oder `PascalCase`
- Versionierung: Semantic Versioning (v1.0.0)

---

## 🚀 Verwendung der Dokumentation

### Für IHK-Prüfung

1. **Projektantrag einreichen** (6-8 Wochen vor Projektbeginn):
   - `01_Antrag/Projektantrag_GiePlan.md` als PDF exportieren
   - `01_Antrag/Zeit_und_Kostenplanung.md` beilegen
   - `01_Antrag/Anforderungskatalog.md` optional beilegen

2. **Projekt durchführen** (70 Stunden):
   - Zeitplan aus `Zeit_und_Kostenplanung.md` befolgen
   - Anforderungen aus `Anforderungskatalog.md` umsetzen

3. **Projektdokumentation abgeben** (7 Tage nach Projektende):
   - `02_Dokumentation/Projektdokumentation.md` als PDF (max. 60 Seiten)
   - Anhänge aus `03_Anhaenge/` beilegen (nicht auf 60 Seiten angerechnet)

4. **Präsentation vorbereiten** (vor Prüfungstermin):
   - `04_Praesentation/Praesentation.md` in PowerPoint/PDF konvertieren
   - `04_Praesentation/Handout.md` ausdrucken (1 Kopie pro Prüfer)

### Für Entwicklung

- **UML-Diagramme**: Referenz für Architektur-Entscheidungen
- **Code-Beispiele**: Best-Practices und Patterns
- **Test-Dokumentation**: Coverage- und Performance-Ziele

### Für Wartung

- **Datenmodell**: Schema-Referenz bei Änderungen
- **Architektur**: Übersicht für neue Entwickler
- **Anforderungskatalog**: Feature-Backlog

---

## 📚 Referenzmaterial

### IHK-Vorlagen

Im Ordner `Vorlagen_Beispiele/` befinden sich:

1. **Mustervorlage_Projektantrag.pdf**
   - Offizielle IHK-Vorlage für Projektantrag
   - Enthält alle Pflichtfelder

2. **Mustervorlage_Projektdokumentation.pdf**
   - Offizielle IHK-Vorlage für Hauptdokumentation
   - Kapitelstruktur und Formatierung

3. **Beispiel_Projekt_Markus_Amshove_1.pdf**
   - Beispielprojekt (sehr gute Bewertung)
   - Schreibstil und Detailtiefe als Referenz

4. **Beispiel_Projekt_Markus_Amshove_2.pdf**
   - Weiteres Beispielprojekt
   - Alternative Strukturierung

**Hinweis**: Diese PDFs dienen als Orientierung, nicht als zu kopierende Vorlagen.

---

## ✅ Checkliste für IHK-Abgabe

### Vor Projektbeginn

- [ ] Projektantrag ausgefüllt und unterschrieben
- [ ] Zeitplanung realistisch kalkuliert (35-70h)
- [ ] Anforderungen vollständig dokumentiert
- [ ] Wirtschaftlichkeit nachgewiesen (ROI)
- [ ] Antrag fristgerecht bei IHK eingereicht (6-8 Wochen vor Start)
- [ ] Genehmigung von IHK erhalten

### Während Projekt

- [ ] Zeiterfassung führen (tatsächliche Stunden dokumentieren)
- [ ] Regelmäßige Commits (Git-Historie als Nachweis)
- [ ] Tests schreiben (Code Coverage dokumentieren)
- [ ] Screenshots/Mockups für Dokumentation erstellen

### Nach Projektende

- [ ] Projektdokumentation vollständig (max. 60 Seiten)
- [ ] Anhänge vollständig (UML, Datenmodell, Tests, Code)
- [ ] Alle Diagramme beschriftet und erklärt
- [ ] Quellenangaben korrekt (falls externe Referenzen)
- [ ] Rechtschreibung/Grammatik geprüft
- [ ] PDF generiert und auf Seitenzahl geprüft
- [ ] Fristgerecht eingereicht (7 Tage nach Projektende)

### Vor Präsentation

- [ ] Präsentation auf 15 Minuten getimed
- [ ] Handout ausgedruckt (Anzahl Prüfer + 1 Reserve)
- [ ] Live-Demo vorbereitet (Fallback: Screenshots/Video)
- [ ] Backup-Folien für mögliche Fragen
- [ ] Dresscode beachtet (Business Casual)
- [ ] Anreise geplant (30 Minuten Puffer)

---

## 🔧 Technische Details

### Markdown zu PDF Konvertierung

**Empfohlene Tools**:

```bash
# Pandoc (empfohlen)
pandoc Projektdokumentation.md -o Projektdokumentation.pdf --toc

# VS Code Extension: "Markdown PDF"
# (Rechtsklick in .md → "Markdown PDF: Export (pdf)")

# Typora (WYSIWYG Editor)
# File → Export → PDF
```

**Styling**:
- Schriftart: Arial oder Calibri (11pt)
- Zeilenabstand: 1.5
- Seitenränder: 2.5cm
- Kopfzeile: Projektname + Auszubildender
- Fußzeile: Seitenzahl

### ASCII-Art zu Grafik

**UML-Diagramme**:
- ASCII-Art ist für IHK akzeptabel
- Alternativ: [PlantUML](https://plantuml.com/), [Mermaid](https://mermaid.js.org/)
- Export als PNG/SVG und in Dokumentation einbetten

### Versionierung

```bash
# Git-Historie als Projektnachweis
git log --oneline --graph --decorate --all > git_history.txt

# Anzahl Commits
git rev-list --count HEAD

# Zeilen Code
npx cloc src/ fairness/
```

---

## 📞 Kontakt & Support

**Auszubildender**:  
Kai Delor  
E-Mail: [E-Mail-Adresse]  
GitHub: [GitHub-Profil]

**Ausbildungsbetrieb**:  
[Firmenname]  
Ansprechpartner: [Name]  
Telefon: [Telefonnummer]

**IHK**:  
IHK [Regionalbezeichnung]  
Prüfungsausschuss: Fachinformatiker Anwendungsentwicklung

---

## 📄 Lizenz & Nutzungshinweise

**Copyright**: © 2025 Kai Delor

**Nutzung**:
- Diese Dokumentation ist Teil des IHK-Abschlussprojekts
- Quellenangabe erforderlich bei Verwendung von Code-Beispielen
- Nicht zur kommerziellen Nutzung ohne Genehmigung

**Open Source**:
- Quellcode verfügbar auf GitHub (siehe README.md)
- Lizenz: MIT (siehe LICENSE-Datei)

---

## 🎓 Weiterführende Ressourcen

### IHK-Richtlinien

- [IHK-DIHK Prüfungsordnung](https://www.dihk.de/)
- [Handreichung IT-Berufe (Version 4.0)](https://www.u-form-shop.de/)
- [Projektantrag-Leitfaden](https://www.ihk.de/)

### Technische Dokumentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

### Fairness-Algorithmen

- Kalman Filter: [Wikipedia](https://en.wikipedia.org/wiki/Kalman_filter)
- Gumbel-Softmax: [Jang et al. 2017](https://arxiv.org/abs/1611.01144)
- Gini Coefficient: [Wikipedia](https://en.wikipedia.org/wiki/Gini_coefficient)

---

<div align="center">

**IHK Abschlussprojekt - Fachinformatiker/-in für Anwendungsentwicklung**

**GießPlan - Plant Watering Schedule Management System**

Kai Delor | Dezember 2025

---

*Diese Dokumentation wurde mit ❤️ und TypeScript erstellt*

</div>
