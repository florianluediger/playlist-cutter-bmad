---
title: 'Gegenseitige Playlist-Deaktivierung'
slug: 'gegenseitige-playlist-deaktivierung'
created: '2026-03-30'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vitest', 'Testing Library']
files_to_modify:
  - src/components/PlaylistRow.tsx
  - src/components/PlaylistColumns.tsx
  - src/components/PlaylistRow.test.tsx
  - src/components/PlaylistColumns.test.tsx
code_patterns:
  - 'Props-basierte disabled-Logik in PlaylistRow'
  - 'Tailwind-Klassen für visuelle Deaktivierung (opacity, cursor-not-allowed)'
  - 'aria-disabled für Accessibility'
test_patterns:
  - 'vitest + @testing-library/react'
  - 'userEvent für Interaktionstests'
  - 'AppContext.Provider zum Rendern mit State-Overrides'
---

# Tech-Spec: Gegenseitige Playlist-Deaktivierung

**Created:** 2026-03-30

## Overview

### Problem Statement

Eine Playlist kann gleichzeitig als Quelle (links) und als Ausschluss (rechts) ausgewählt werden. Das ergibt keinen Sinn, da eine Playlist nicht gleichzeitig Tracks liefern und ausschließen kann. Die bestehende Duplikat-Warnung weist zwar darauf hin, verhindert das Problem aber nicht.

### Solution

`PlaylistRow` erhält ein `disabled` Prop. In `PlaylistColumns` wird jede Playlist auf der rechten Seite deaktiviert, wenn sie links gewählt ist — und umgekehrt. Deaktivierte Rows sind grau hinterlegt, nicht klickbar und nicht per Tastatur erreichbar. Die bestehende Duplikat-Warnung und alle zugehörigen Tests werden entfernt.

### Scope

**In Scope:**
- `disabled` Prop in `PlaylistRow` mit visueller Darstellung (grau, kein Hover, `cursor-not-allowed`)
- Accessibility: `aria-disabled="true"`, `tabIndex={-1}` wenn disabled
- Deaktivierungslogik in `PlaylistColumns` (cross-side exclusion)
- Entfernung der `duplicates`-Logik und des `AlertTriangle`-Banners in `PlaylistColumns`
- Tests für disabled-State in `PlaylistRow.test.tsx`
- Ersetzen der Duplikat-Tests durch disabled-State-Tests in `PlaylistColumns.test.tsx`

**Out of Scope:**
- Änderungen am State-Management (AppContext, Reducer)
- Automatisches De-selektieren einer bereits gewählten Playlist, wenn sie auf der anderen Seite ausgewählt wird
- Änderungen an anderen Komponenten

## Context for Development

### Codebase Patterns

- `PlaylistRow` verwendet Tailwind-Klassen, die je nach `selected`-State und `role` variieren (`border-l-sky-600`, `bg-sky-50`, etc.)
- `disabled` analog zu `selected` als boolean prop — kein CSS-Modul, nur Tailwind-Klassen
- Tests in `PlaylistRow.test.tsx` prüfen Klassen via `row.className` und Interaktion via `userEvent`
- Tests in `PlaylistColumns.test.tsx` nutzen `renderWithState(stateOverrides)` Helper mit `AppContext.Provider`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/components/PlaylistRow.tsx` | Haupt-Komponente — erhält `disabled` Prop |
| `src/components/PlaylistColumns.tsx` | Orchestrierung — berechnet und übergibt `disabled` |
| `src/components/PlaylistRow.test.tsx` | Unit-Tests für `PlaylistRow` |
| `src/components/PlaylistColumns.test.tsx` | Integration-Tests — Duplikat-Tests entfernen, disabled-Tests hinzufügen |

### Technical Decisions

- **Kein `tabIndex={0}` wenn disabled:** Deaktivierte Rows werden aus der Tab-Reihenfolge entfernt (`tabIndex={-1}`), damit Screen-Reader und Tastaturnutzer sie nicht ansteuern können
- **`aria-disabled="true"` statt `disabled`-Attribut:** Das Element ist ein `div` (kein native `<button>`), daher ARIA-Attribut
- **Click/Keydown-Handler blockieren:** Wenn `disabled`, werden `onClick` und `onKeyDown` frühzeitig beendet (`if (disabled) return`)
- **Visuelle Darstellung:** `opacity-50` auf dem gesamten Row-Container kombiniert mit `cursor-not-allowed` — kein `hover:bg-gray-50`
- **Duplikat-Warnung komplett entfernen:** Da cross-selection nicht mehr möglich ist, ist die Warnung nie erreichbar und wird vollständig entfernt

## Implementation Plan

### Tasks

**Task 1 — `PlaylistRow.tsx`: `disabled` Prop hinzufügen**

Datei: `src/components/PlaylistRow.tsx`

1. Interface erweitern: `disabled?: boolean` zu `PlaylistRowProps` hinzufügen
2. Prop destructuren: `{ name, trackCount, role, selected, onToggle, disabled = false }`
3. Click-Handler anpassen:
   ```tsx
   onClick={() => { if (!disabled) onToggle() }}
   ```
4. Keyboard-Handler anpassen:
   ```tsx
   onKeyDown={(e) => { if (disabled) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle() } }}
   ```
5. `tabIndex` anpassen: `tabIndex={disabled ? -1 : 0}`
6. `aria-disabled` hinzufügen: `aria-disabled={disabled}`
7. Klassen anpassen — disabled-State hat Vorrang:
   ```tsx
   const containerClass = disabled
     ? 'opacity-50 cursor-not-allowed border-l-transparent'
     : `${borderClass} ${!selected ? 'hover:bg-gray-50' : ''} cursor-pointer`
   ```
8. `className` im JSX zusammensetzen:
   ```
   `flex items-center gap-3 py-3 px-4 border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-lg ${containerClass}`
   ```
   Hinweis: `cursor-pointer` kommt jetzt aus `containerClass`, nicht mehr fest im String

**Task 2 — `PlaylistColumns.tsx`: `disabled`-Logik und Aufräumen**

Datei: `src/components/PlaylistColumns.tsx`

1. `duplicates`-Berechnung entfernen (Zeile 58–60)
2. Import von `AlertTriangle` entfernen
3. Das `AlertTriangle`-Banner-JSX entfernen (Zeilen 125–136)
4. `disabled` Prop an source-`PlaylistRow` übergeben:
   ```tsx
   disabled={selectedExcludes.includes(playlist.id)}
   ```
5. `disabled` Prop an exclude-`PlaylistRow` übergeben:
   ```tsx
   disabled={selectedSources.includes(playlist.id)}
   ```

**Task 3 — `PlaylistRow.test.tsx`: disabled-Tests hinzufügen**

Datei: `src/components/PlaylistRow.test.tsx`

Neue Tests hinzufügen (bestehende bleiben):

- `disabled=true`: `aria-disabled="true"` ist gesetzt
- `disabled=true`: `onToggle` wird bei Klick NICHT aufgerufen
- `disabled=true`: `onToggle` wird bei Space-Taste NICHT aufgerufen
- `disabled=true`: `tabIndex` ist `-1`
- `disabled=true`: Container hat `opacity-50` und `cursor-not-allowed` Klassen

**Task 4 — `PlaylistColumns.test.tsx`: Tests aktualisieren**

Datei: `src/components/PlaylistColumns.test.tsx`

1. Den gesamten `describe('PlaylistColumns — Duplikat-Warnung', ...)` Block entfernen
2. Neuen `describe` Block hinzufügen: `'PlaylistColumns — gegenseitige Deaktivierung'`
3. Tests:
   - Wenn `selectedSources: ['p1']`, dann ist in der Exclude-Spalte die Row mit `p1` `aria-disabled="true"`
   - Wenn `selectedExcludes: ['p2']`, dann ist in der Source-Spalte die Row mit `p2` `aria-disabled="true"`
   - Wenn keine Selektion, sind alle Rows `aria-disabled="false"` (oder Attribut nicht gesetzt)

### Acceptance Criteria

**AC1 — Gegenseitige Deaktivierung (Source → Exclude)**
- Given: Nutzer wählt Playlist „Alpha" in der linken Spalte (Source)
- When: Rechte Spalte (Exclude) wird angezeigt
- Then: „Alpha" in der Exclude-Spalte ist grau (opacity), nicht klickbar, nicht per Tab erreichbar

**AC2 — Gegenseitige Deaktivierung (Exclude → Source)**
- Given: Nutzer wählt Playlist „Beta" in der rechten Spalte (Exclude)
- When: Linke Spalte (Source) wird angezeigt
- Then: „Beta" in der Source-Spalte ist grau (opacity), nicht klickbar, nicht per Tab erreichbar

**AC3 — Nicht deaktivierte Rows funktionieren normal**
- Given: Playlist „Gamma" ist weder Source noch Exclude
- When: Nutzer klickt „Gamma" in einer der Spalten
- Then: `onToggle` wird aufgerufen und die Selektion wechselt

**AC4 — Duplikat-Warnung ist entfernt**
- Given: App ist im selection-Phase
- When: Irgendein State wird gerendert
- Then: Kein `role="alert"` Element existiert im DOM

**AC5 — Accessibility**
- Given: Eine Playlist ist disabled
- When: DOM inspiziert wird
- Then: `aria-disabled="true"` ist gesetzt, `tabIndex` ist `-1`

## Review Notes

- Adversarial Review abgeschlossen
- Findings: 10 total, 4 gefixt, 6 übersprungen
- Resolution: Walk-through
- Zusätzlich gefixt (außerhalb Spec-Scope): Reducer-Guard gegen cross-selection, Rules of Hooks in PlaylistColumns

## Additional Context

### Dependencies

Keine neuen Abhängigkeiten.

### Testing Strategy

- Unit-Tests in `PlaylistRow.test.tsx` für das `disabled` Prop isoliert
- Integration-Tests in `PlaylistColumns.test.tsx` für die cross-side Deaktivierungslogik
- Bestehende Tests bleiben unverändert (Selektion, Farben, Keyboard-Navigation bei nicht-disabled Rows)

### Notes

- Die `duplicates`-Variable und der `AlertTriangle`-Import in `PlaylistColumns.tsx` müssen vollständig entfernt werden — kein toter Code zurücklassen
- `cursor-pointer` darf nicht mehr fest im `className`-String stehen, da disabled-Rows `cursor-not-allowed` brauchen
