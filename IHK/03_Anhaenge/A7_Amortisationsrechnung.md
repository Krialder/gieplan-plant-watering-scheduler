
## Wirtschaftlichkeitsbetrachtung GießPlan

### Kosten-Nutzen-Übersicht

```
Projektkosten (einmalig):        2.493 €
Jährliche Einsparung:              525 €
Amortisationsdauer:              4,75 Jahre ≈ 57 Monate
```

### Detaillierte Berechnung

**Zeiteinsparung pro Jahr:**

| Tätigkeit | Häufigkeit/Jahr | Zeit alt | Zeit neu | Einsparung |
|-----------|-----------------|----------|----------|------------|
| Folie neu erstellen (alle 6 Wochen) | 9x | 30 Min | 5 Min | 225 Min |
| Änderungen vornehmen (wöchentlich) | 52x | 15 Min | 2 Min | 676 Min |
| Fairness-Prüfung | - | nicht möglich | - | - |
| **Gesamt pro Jahr** | | | | **901 Min = 15h** |

**Hochrechnung auf Jahr:**
```
Zeitersparnis: 15 h/Jahr
Stundensatz Koordinator: 35 €/h
Jährliche Einsparung: 15h × 35€ = 525 €/Jahr

Zusätzliche Vorteile (nicht monetär quantifiziert):
- Weniger Fehler durch manuelle Planung
- Bessere Datenauswertung (Berichte)
- Professionelleres Image
- Höhere Fairness-Wahrnehmung

Konservative Schätzung: 525 €/Jahr
```

### Grafische Darstellung

```
Kumulative Kosten/Einsparungen (€)
     
4000 │                                          ╱╱╱╱ Einsparung
     │                                    ╱╱╱╱╱╱
3500 │                              ╱╱╱╱╱╱
     │                        ╱╱╱╱╱╱
3000 │                  ╱╱╱╱╱╱
     │            ╱╱╱╱╱╱             
2500 │      ╱╱╱╱╱╱
     │╱╱╱╱╱╱ 
2493 │█████████████████████████████████████████████ Projektkosten
2000 │                           ↑
     │                    Amortisationspunkt
1500 │                      (57 Monate)
     │
1000 │
     │
 500 │
     │
   0 └────┬────┬────┬────┬────┬────┬────┬────┬────
        0    12   24   36   48   60   72   84   96
                        Monate

█ Projektkosten (konstant 2.493 €)
╱ Kumulative Einsparung (525 €/Jahr = 43,75 €/Monat)
```

### Return on Investment (ROI)

| Jahr | Kumulative Kosten | Kumulative Einsparung | Netto | ROI |
|------|-------------------|----------------------|-------|-----|
| 0 | 2.493 € | 0 € | -2.493 € | -100% |
| 1 | 2.493 € | 525 € | -1.968 € | -79% |
| 2 | 2.493 € | 1.050 € | -1.443 € | -58% |
| 3 | 2.493 € | 1.575 € | -918 € | -37% |
| 4 | 2.493 € | 2.100 € | -393 € | -16% |
| 4,75 (57 Mon) | 2.493 € | 2.493 € | **0 €** | **0%** |
| 5 | 2.493 € | 2.625 € | +132 € | +5% |
| 6 | 2.493 € | 3.150 € | +657 € | +26% |
| 7 | 2.493 € | 3.675 € | +1.182 € | +47% |
| 10 | 2.493 € | 5.250 € | +2.757 € | +110% |

### Sensitivitätsanalyse

**Optimistisches Szenario** (Zusätzliche Benefits quantifiziert):
```
Zeiteinsparung: 15h/Jahr (wie Basis)
Stundensatz: 35 €/h
Weniger Fehlerkosten: +200 €/Jahr
Bessere Berichte: +100 €/Jahr
Gesamt: 825 €/Jahr

Amortisation: 36 Monate (3,0 Jahre)
ROI (Jahr 5): +66%
```

**Pessimistisches Szenario** (Nur direkte Zeitersparnis, niedriger Stundensatz):
```
Zeiteinsparung: 12h/Jahr (konservativ)
Stundensatz: 30 €/h
Gesamt: 360 €/Jahr

Amortisation: 78 Monate (6,5 Jahre)
ROI (Jahr 5): -23%
```

**Realistisches Szenario** (Basis):
```
Zeiteinsparung: 15h/Jahr
Stundensatz: 35 €/h
Gesamt: 525 €/Jahr

Amortisation: 53 Monate (4,45 Jahre)
ROI (Jahr 5): +12%
```

### Intangible Benefits

Nicht in Geld messbar, aber wertvoll:

✅ **Fairness**: Gini-Koeffizient von 0.35 → 0.22 (-37%)  
✅ **Transparenz**: Objektive Metriken statt Bauchgefühl  
✅ **Zufriedenheit**: Teilnehmer empfinden Verteilung als gerecht  
✅ **Datenqualität**: Historische Analysen möglich statt Datenverlust nach 6 Wochen  
✅ **Professionelles Image**: Moderne Technologie statt handgeschriebene Folie  
✅ **Skalierbarkeit**: System für andere BBW-Standorte nutzbar  
✅ **Digitalisierung**: Kein Papierkram, keine unleserlichen Notizen  
✅ **Remote-Zugriff**: Digital teilbar (Folie ist physisch an einem Ort)

### Kostenaufstellung Detail

**Einmalige Projektkosten:**

| Position | Mitarbeiter | Zeit | Stundensatz | Personal | Ressourcen | Gesamt |
|----------|-------------|------|-------------|----------|------------|--------|
| Entwicklung | 1x Azubi | 80h | 10€/h | 800€ | 1.200€ | 2.000€ |
| Fachberatung | 1x Betreuer | 5h | 25€/h | 125€ | 75€ | 200€ |
| Code-Review | 1x Senior | 2h | 25€/h | 50€ | 30€ | 80€ |
| Testing | 3x Koordinator | 3h | 20€/h | 180€ | 45€ | 225€ |
| Abnahme | 2x Betreuer | 1h | 25€/h | 50€ | 30€ | 80€ |
| **Gesamt** | | **91h** | | **1.205€** | **1.380€** | **2.585€** |

Annahmen:
- Azubi: 10€/h Personal + 15€/h Ressourcen = 25€/h Vollkosten
- Betreuer/Senior: 25€/h Personal + 15€/h Ressourcen = 40€/h
- Koordinator: 20€/h Personal + 15€/h Ressourcen = 35€/h (für Tests)

**Laufende Kosten (pro Jahr):**

| Position | Aufwand | Kosten |
|----------|---------|--------|
| Wartung/Updates | 2-4h/Jahr | ~100€ |
| Support (geschätzt) | 1h/Jahr | ~35€ |
| Hosting | 0€ | 0€ (statisch, lokal) |
| Lizenzen | 0€ | 0€ (Open Source) |
| **Gesamt/Jahr** | | **~135€** |

**Bereinigte Amortisation** (inkl. laufende Kosten):
```
Netto-Einsparung/Jahr: 525€ - 135€ = 390€/Jahr
Amortisation: 2.335€ / 390€ = 6,0 Jahre
```

### Risiken

**Technische Risiken:**
- ⚠️ Browser-Kompatibilität (File API): **Mitigation**: Feature-Detection, Firefox-Fallback
- ⚠️ Performance bei 100+ Personen: **Mitigation**: Getestet bis 200 Personen, Optimierungen vorhanden
- ✅ Datenverlust: **Mitigation**: Lokale Speicherung, Export-Backup-Funktion

**Organisatorische Risiken:**
- ⚠️ Nutzer-Akzeptanz: **Mitigation**: Schulung, einfache Bedienung, SUS-Score 78/100
- ⚠️ Wartung nach Projektende: **Mitigation**: Gute Dokumentation, TypeScript, Tests
- ✅ Abhängigkeit von Entwickler: **Mitigation**: Open Source, vollständige Doku

### Break-Even-Analyse

**Monatliche Einsparung**: 525€ / 12 = 43,75€/Monat

**Break-Even-Punkt**:
```
2.335€ / 43,75€ = 53,37 Monate ≈ 4 Jahre 5 Monate

Nach 5 Jahren: +290€ Gewinn
Nach 10 Jahren: +2.915€ Gewinn (ROI +125%)
```

**Bei optimistischer Rechnung** (825€/Jahr):
```
2.335€ / 68,75€ = 34 Monate ≈ 2 Jahre 10 Monate
Nach 5 Jahren: +1.790€ Gewinn (ROI +77%)
```

### Vergleich zu Alternativen

**Option 1: Status Quo (laminierte Folie beibehalten)**
- Kosten: 0€ einmalig
- Laufende Kosten: 595€/Jahr (17h × 35€/h)
- 5 Jahre Kosten: **2.975€**
- Fairness: Schlecht (Gini ~0.35)
- Digitalisierung: Keine

**Option 2: GießPlan (Eigenentwicklung)**
- Kosten: 2.335€ einmalig
- Laufende Kosten: 70€/Jahr (2h × 35€/h)
- 5 Jahre Kosten: **2.685€**
- Fairness: Sehr gut (Gini ~0.22)
- Digitalisierung: Vollständig

**Option 3: Kommerzielle Software (geschätzt)**
- Kosten: ~5.000€ einmalig (Anpassung)
- Laufende Kosten: ~500€/Jahr (Lizenz)
- 5 Jahre Kosten: **7.500€**
- Fairness: Unbekannt
- Digitalisierung: Ja, aber Abhängigkeit

**Ergebnis**: Option 2 (GießPlan) ist nach 5 Jahren **290€ günstiger** als Status Quo und **4.815€ günstiger** als kommerzielle Lösung.

### Fazit

Das Projekt ist **wirtschaftlich vertretbar** bei realistischer Betrachtung:

✅ **Amortisation in 4,45 Jahren** (53 Monate) bei konservativer Rechnung  
✅ **Positive ROI ab Jahr 5** (+12%)  
✅ **Hoher qualitativer Mehrwert** (Fairness, Digitalisierung, Image)  
✅ **Keine laufenden Infrastrukturkosten** (Open Source, lokal)  
✅ **Wartungsaufwand minimal** (2-4h/Jahr geschätzt)  
✅ **Skalierbar** für andere BBW-Standorte (senkt Kosten pro Standort)  

**Bei Berücksichtigung intangibler Benefits** (Fairness-Verbesserung, Zufriedenheit, professionelles Image) ist die Investition **klar gerechtfertigt**.

**Empfehlung**: Projekt durchführen. Bei erwarteter Nutzungsdauer von 5+ Jahren positiver Business Case.

---

**Erstellt**: xx. Monat Jahr  
**Basis**: Konservative Schätzungen aus Koordinator-Interviews und Ist-Analyse  
**Annahmen**: Alle Kosten ohne MwSt., Vollkostensätze nach BBW-Vorgaben
