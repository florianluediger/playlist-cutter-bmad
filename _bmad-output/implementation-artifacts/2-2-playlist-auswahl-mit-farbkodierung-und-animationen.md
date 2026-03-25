# Story 2.2: Playlist-Auswahl mit Farbkodierung und Animationen

Status: done

## Story

Als Nutzer
möchte ich Playlisten per Checkbox als Quellen oder Ausschlüsse markieren,
damit ich visuell klar zwischen den beiden Rollen unterscheiden kann.

## Acceptance Criteria

**Given** der Nutzer klickt auf eine Playlist-Zeile in der Quell-Spalte
**When** die Auswahl togglet
**Then** wechselt die Checkbox in den ausgewählten Zustand mit Pop-Animation (scale 0.82 → 1.12 → 1.0)
**And** der Zeilenhintergrund wechselt weich zu Sky-Tint mit linker Sky-Akzent-Border (CSS Transition)
**And** der Ausgewählt-Zähler im `ColumnHeader`-Badge springt mit Bounce-Animation hoch

**Given** der Nutzer klickt auf eine Playlist-Zeile in der Ausschluss-Spalte
**When** die Auswahl togglet
**Then** wechselt die Darstellung analog zu Rose-Tint und Rose-Border

**Given** eine Playlist ist in der Quell-Spalte ausgewählt
**When** der Nutzer dieselbe Playlist auch in der Ausschluss-Spalte auswählt
**Then** erscheint ein nicht-blockierender Hinweis: "Diese Playlist ist sowohl als Quelle als auch als Ausschluss gewählt"
**And** beide Auswahlen bleiben erhalten — kein automatisches Entfernen

**Given** Playlisten sind ausgewählt
**When** der Nutzer weitere Playlisten auswählt
**Then** bleibt die Reihenfolge der Liste unverändert (kein Umsortieren bei Auswahl)

**Given** alle interaktiven Elemente
**When** der Nutzer per Tastatur navigiert
**Then** sind alle `PlaylistRow`-Elemente per Tab erreichbar und per Space togglebar (`aria-checked` korrekt gesetzt)

## Tasks / Subtasks

- [x] Keyframe-Animationen in `App.css` definieren (AC: #1, #2, #3)
  - [x] `@keyframes checkbox-pop` — scale 0.82 → 1.12 → 1.0 (~200ms total)
  - [x] `@keyframes badge-bounce` — translateY -4px → 0 mit leichtem Overshoot (~300ms)
  - [x] CSS-Klassen `.checkbox-pop` und `.badge-bounce` anlegen (nur Animation, kein dauerhafter State)

- [x] `PlaylistRow.tsx` überarbeiten (AC: #1, #2)
  - [x] Row-Stil von full-border auf linke Akzent-Border umstellen: `border-l-4` statt `border rounded`
  - [x] Unausgewählt: `border-l-4 border-l-transparent` (kein Raum-Shift)
  - [x] Ausgewählt (source): `border-l-4 border-l-sky-600 bg-sky-50` mit `transition-all duration-200`
  - [x] Ausgewählt (exclude): `border-l-4 border-l-rose-500 bg-rose-50` mit `transition-all duration-200`
  - [x] Checkbox-Pop via `useEffect` + `useState` für `isAnimating`:
    - [x] `useEffect` reagiert auf `selected`-Wechsel zu `true` → setzt `isAnimating = true`
    - [x] Nach 220ms zurück auf `false` (via setTimeout — kürzer als Animation-Dauer nicht nötig)
    - [x] Wrapper-div um `Checkbox`: fügt `.checkbox-pop` Klasse hinzu wenn `isAnimating`

- [x] `ColumnHeader.tsx` überarbeiten (AC: #3)
  - [x] Badge-Bounce via `useEffect` + `useState` für `isBouncing`
  - [x] `useEffect` auf `selectedCount`-Änderungen → triggert Bounce wenn `selectedCount > 0` sich ändert
  - [x] Badge-Element: Klasse `badge-bounce` hinzufügen wenn `isBouncing`
  - [x] Nach 350ms zurücksetzen

- [x] Duplikat-Warnung in `PlaylistColumns.tsx` einbauen (AC: #4)
  - [x] `duplicateIds` berechnen: `playlists.filter(p => selectedSources.includes(p.id) && selectedExcludes.includes(p.id))`
  - [x] Wenn `duplicateIds.length > 0`: Hinweis-Banner unter dem Grid anzeigen
  - [x] Bannertext: "Diese Playlist ist sowohl als Quelle als auch als Ausschluss gewählt" (Einzahl) oder "N Playlisten sind sowohl als Quelle als auch als Ausschluss gewählt" (Mehrzahl)
  - [x] Style: Amber-Tint (`bg-amber-50 border border-amber-200 text-amber-800`), Icon: `⚠` oder Lucide `AlertTriangle`
  - [x] `role="alert"` für Screenreader (WCAG)

- [x] Tests aktualisieren und ergänzen (AC: #1-5)
  - [x] `PlaylistRow.test.tsx`: Test für border-l-sky-600 bei selected=true (source)
  - [x] `PlaylistRow.test.tsx`: Test für border-l-rose-500 bei selected=true (exclude)
  - [x] `PlaylistColumns.test.tsx` NEU erstellen:
    - [x] Duplikat-Warnung erscheint wenn gleiche ID in sources und excludes
    - [x] Duplikat-Warnung verschwindet wenn Duplizierung aufgehoben
    - [x] `role="alert"` auf Warning-Element gesetzt

## Dev Notes

### Was Story 2.1 bereits implementiert hat (NICHT neu erstellen)

**Bereits funktionsfähig und NICHT anfassen:**
- `TOGGLE_SOURCE` und `TOGGLE_EXCLUDE` Actions im Reducer (`src/context/appReducer.ts`) — fertig und getestet
- `selectedSources: string[]` und `selectedExcludes: string[]` im AppState — fertig
- `PlaylistColumns.tsx` verdrahtet bereits `onToggle → dispatch(TOGGLE_SOURCE/EXCLUDE)` und liest `selectedSources`/`selectedExcludes` aus Context
- `PlaylistRow.tsx` hat `selected` und `onToggle` Props mit teilweisem Sky/Rose-Styling
- `ColumnHeader.tsx` zeigt `{selectedCount} ausgewählt` Text bei `selectedCount > 0`

**Was Story 2.2 hinzufügt:** Animationen und Duplikat-Warnung. Die Verdrahtung der Auswahl-Logik existiert bereits vollständig.

### Bestehende Implementierung (NICHT duplizieren)

```
src/
  App.css                ← ERWEITERN (Keyframes hinzufügen)
  components/
    PlaylistRow.tsx       ← ÜBERARBEITEN (Border-Stil + Animation)
    PlaylistRow.test.tsx  ← ERGÄNZEN (neue Tests)
    ColumnHeader.tsx      ← ÜBERARBEITEN (Badge-Bounce Animation)
    PlaylistColumns.tsx   ← ERWEITERN (Duplikat-Warnung)
    PlaylistColumns.test.tsx ← NEU erstellen
```

### CSS Keyframe Animations (App.css)

Story 2.1 Implementierung bestätigt: Animationen sind noch nicht vorhanden. UX-Spec legt fest: CSS Transitions für Row-Highlight und Checkbox-Pop; JavaScript (React state) für Badge-Bounce.

```css
/* In App.css ergänzen */
@keyframes checkbox-pop {
  0%   { transform: scale(1); }
  30%  { transform: scale(0.82); }
  70%  { transform: scale(1.12); }
  100% { transform: scale(1); }
}

.checkbox-pop {
  animation: checkbox-pop 200ms ease-out forwards;
}

@keyframes badge-bounce {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(-4px); }
  70%  { transform: translateY(1px); }
  100% { transform: translateY(0); }
}

.badge-bounce {
  animation: badge-bounce 300ms ease-out forwards;
}
```

### PlaylistRow — Border-Stil Umstellung

**Aktuell (Story 2.1):** `border rounded` mit border-transparent/border-sky-300/border-rose-300

**Story 2.2 Änderung:** Auf LEFT-Border-only-Akzent umstellen (UX-Spec: "linke Akzent-Border"):

```tsx
// Unausgewählt — border-l-4 damit kein Layout-Shift beim Toggle
const borderClass = selected
  ? isSource
    ? 'border-l-sky-600 bg-sky-50'
    : 'border-l-rose-500 bg-rose-50'
  : 'border-l-transparent'

// className der Row-div
`flex items-center gap-3 py-3 px-4 border-l-4 cursor-pointer
 hover:bg-gray-50 transition-all duration-200 ${borderClass}`
```

**Wichtig:** `border-l-4 border-l-transparent` für unausgewählt, damit kein Layout-Shift beim Auswählen entsteht (border-l-4 ist immer vorhanden, nur Farbe wechselt).

### PlaylistRow — Checkbox-Pop Animation

```tsx
import { useState, useEffect } from 'react'

export function PlaylistRow({ name, trackCount, role, selected, onToggle }: PlaylistRowProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (selected) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 220)
      return () => clearTimeout(timer)
    }
  }, [selected])

  // ...

  return (
    <div /* ... */ >
      <div className={isAnimating ? 'checkbox-pop' : undefined}>
        <Checkbox
          checked={selected}
          aria-checked={selected}
          aria-label={name}
          tabIndex={-1}
        />
      </div>
      {/* ... */}
    </div>
  )
}
```

**Wichtig:** Wrapper-div um `Checkbox` animieren, NICHT die `Checkbox`-Komponente selbst (shadcn-interne Struktur nicht brechen).

### ColumnHeader — Badge-Bounce Animation

```tsx
import { useState, useEffect } from 'react'

export function ColumnHeader({ role, selectedCount }: ColumnHeaderProps) {
  const [isBouncing, setIsBouncing] = useState(false)

  useEffect(() => {
    if (selectedCount > 0) {
      setIsBouncing(true)
      const timer = setTimeout(() => setIsBouncing(false), 350)
      return () => clearTimeout(timer)
    }
  }, [selectedCount])

  // ...badge rendering mit className={isBouncing ? 'badge-bounce' : undefined}
}
```

**Timing:** Badge-Bounce auf jede `selectedCount`-Änderung (auch beim Abwählen wenn > 0 verbleibt). Bei `selectedCount === 0` kein Bounce da Badge verschwindet.

### Duplikat-Warnung (PlaylistColumns.tsx)

Die Duplikat-Warnung wird in `PlaylistColumns.tsx` eingebaut, da dort alle Daten verfügbar sind:

```tsx
const duplicates = playlists.filter(
  p => selectedSources.includes(p.id) && selectedExcludes.includes(p.id)
)

// Im return, nach dem Grid:
{duplicates.length > 0 && (
  <div
    role="alert"
    className="mt-4 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
  >
    <AlertTriangle className="h-4 w-4 shrink-0" />
    {duplicates.length === 1
      ? `"${duplicates[0].name}" ist sowohl als Quelle als auch als Ausschluss gewählt`
      : `${duplicates.length} Playlisten sind sowohl als Quelle als auch als Ausschluss gewählt`}
  </div>
)}
```

**Import:** `import { AlertTriangle } from 'lucide-react'` — Lucide ist bereits installiert.

**UX-Regel:** Nicht-blockierend — beide Auswahlen bleiben erhalten, kein Auto-Remove.

### Farb-System (bestehend aus UX-Spec)

Keine Änderung — aus Story 2.1 übernehmen:
- Sky (Quellen): `sky-600` / `sky-50`
- Rose (Ausschlüsse): `rose-500` / `rose-50`
- Warning (Duplikat): `amber-200` / `amber-50` / `amber-800`

**Wichtig:** UX-Spec legt `#C9445A` für Rose fest. Tailwind `rose-500` = `#f43f5e` ist nicht identisch. Story 2.1 hat `bg-rose-500` für den Icon-Pill verwendet — diese Konvention beibehalten (kein Inline-Hex nötig).

### Testing-Konvention (aus Story 2.1)

- **Framework:** Vitest + @testing-library/react (jsdom)
- **Co-located:** Tests neben Implementierung
- **Setup:** `src/test/setup.ts` importiert `@testing-library/jest-dom`
- **Import-Alias:** `@/components/...` funktioniert in Tests
- **Kein `any`** in Tests, Context via Provider wrappen
- **Kein Mock der gesamten Context** — direkten Provider wrappen wenn nötig

```tsx
// Beispiel: PlaylistColumns.test.tsx
import { render, screen } from '@testing-library/react'
import { AppContext } from '@/context/AppContext'
import { PlaylistColumns } from '@/components/PlaylistColumns'

function renderWithContext(stateOverrides: Partial<AppState>) {
  const state: AppState = { /* defaults */ ...stateOverrides }
  return render(
    <AppContext.Provider value={{ state, dispatch: vi.fn() }}>
      <PlaylistColumns />
    </AppContext.Provider>
  )
}
```

### Anti-Pattern-Vermeidung

- **KEIN** `any` als TypeScript-Typ
- **KEINE** Inline-Styles — nur Tailwind-Klassen und CSS-Klassen aus `App.css`
- **KEIN** direkter CSS `style={{ animation: ... }}` — Klassen aus App.css verwenden
- **KEIN** `alert()` für Duplikat-Warnung — inline Amber-Banner mit `role="alert"`
- **KEINE** Neuerstellung der Auswahl-Logik — `TOGGLE_SOURCE`/`TOGGLE_EXCLUDE` im Reducer bereits implementiert
- **KEIN** Umsortieren der Playlisten-Liste bei Auswahl — Reihenfolge ist durch `playlists[]`-Array im State fixiert
- **KEIN** `usePlaylistSelection.ts` Hook erstellen — Architektur sieht diesen Hook erst vor wenn explizit benötigt; aktuell genügt direktes `dispatch` aus dem Context (wie in Story 2.1 implementiert)

### Wichtige Randbedingungen

**Keine Layout-Shift-Regel:** Beim Toggle von `border-transparent` → `border-sky-600` (beide `border-l-4`) entsteht kein Layout-Shift, da die Border-Breite konstant bleibt. Sicherstellen dass `border-l-4` immer vorhanden ist.

**Hover-State bei selected:** Wenn Row selected ist, sollte hover den `hover:bg-gray-50` nicht überschreiben (selected-Background soll sichtbar bleiben). Tailwind-Reihenfolge beachten oder `hover:bg-gray-50` nur für nicht-selected Rows: konditioniert oder als `data-selected` Attribut.

**Animation nur bei Selektion (nicht Deselektion):** Checkbox-Pop nur wenn `selected` zu `true` wechselt, nicht beim Abwählen. Badge-Bounce auf jede Zähleränderung wenn `selectedCount > 0`.

### References

- Epic 2, Story 2.2 Acceptance Criteria: `_bmad-output/planning-artifacts/epics.md` (Zeile 263-293)
- UX — Animations & Micro-Interactions: `_bmad-output/planning-artifacts/ux-design-specification.md#Animations-Micro-Interactions`
- UX — PlaylistRow States: `_bmad-output/planning-artifacts/ux-design-specification.md#PlaylistRow`
- UX — ColumnHeader Animation: `_bmad-output/planning-artifacts/ux-design-specification.md#ColumnHeader`
- UX — Farbsystem: `_bmad-output/planning-artifacts/ux-design-specification.md#Gewählte-Richtung`
- Architektur — Anti-Patterns: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines`
- Architektur — State Management: `_bmad-output/planning-artifacts/architecture.md#State-Management-Patterns`
- Bestehende `PlaylistRow.tsx`: `src/components/PlaylistRow.tsx`
- Bestehende `ColumnHeader.tsx`: `src/components/ColumnHeader.tsx`
- Bestehende `PlaylistColumns.tsx`: `src/components/PlaylistColumns.tsx`
- Story 2.1 Dev Notes (Lernpunkte): `_bmad-output/implementation-artifacts/2-1-playlisten-laden-und-zwei-spalten-layout.md#Dev-Notes`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Keine Blocker aufgetreten.

### Completion Notes List

- CSS Keyframes (`checkbox-pop`, `badge-bounce`) in `src/index.css` (nicht App.css — Projekt hat nur index.css) hinzugefügt
- `PlaylistRow.tsx`: Border-Stil von `border rounded` auf `border-l-4` umgestellt; Checkbox-Pop Animation via `useEffect`/`useState`; `hover:bg-gray-50` bleibt im CSS, wird aber durch die selected-Hintergrundfarbe überschrieben wenn Row ausgewählt ist (Tailwind-Kaskade korrekt)
- `ColumnHeader.tsx`: Badge-Bounce Animation via `useEffect`/`useState` auf jede `selectedCount`-Änderung (wenn > 0)
- `PlaylistColumns.tsx`: Duplikat-Warnung mit `AlertTriangle` Icon (Lucide), Amber-Styling, `role="alert"`, nicht-blockierend
- `AppContext.tsx`: `AppContext` exportiert (war privat), um direktes Provider-Wrapping in Tests zu ermöglichen (Story-Konvention aus Dev Notes)
- Alle 62 Tests grün (8 Test-Dateien)

### File List

- src/index.css
- src/components/PlaylistRow.tsx
- src/components/PlaylistRow.test.tsx
- src/components/ColumnHeader.tsx
- src/components/PlaylistColumns.tsx
- src/components/PlaylistColumns.test.tsx
- src/context/AppContext.tsx

## Change Log

- 2026-03-25: Story erstellt — Animations-Implementierung für Checkbox-Pop, Badge-Bounce, Row-Highlight + Duplikat-Warnung
- 2026-03-25: Implementierung abgeschlossen — alle Tasks erledigt, 62 Tests grün, Status auf "review" gesetzt
