# Story 2.3: Toolbar mit Playlist-Name, Live-Summary & Erstellen-Button

Status: review

## Story

Als Nutzer
möchte ich der neuen Playlist einen Namen geben und sehen wie viele Tracks im Diff wären,
damit ich vor dem Erstellen informiert entscheiden kann.

## Acceptance Criteria

**Given** die Haupt-Ansicht ist aktiv
**When** der Nutzer die `Toolbar` sieht
**Then** ist ein Playlist-Name-Input-Feld sichtbar (shadcn/ui `Input`, bei Fokus Sky-Border)
**And** eine Live-Summary-Zeile zeigt die aktuelle Auswahl (z.B. "3 Quellen · 1 Ausschluss · ~42 Tracks")
**And** ein "Erstellen"-Button mit `+`-Icon ist sichtbar

**Given** keine Quell-Playlisten ausgewählt sind ODER kein Playlist-Name eingegeben wurde
**When** der Nutzer den "Erstellen"-Button sieht
**Then** ist der Button `disabled` (`opacity-50`, `cursor-not-allowed`)
**And** kein Tooltip oder Fehlermeldungs-Modal erscheint

**Given** die Auswahl würde 0 Tracks ergeben
**When** der Live-Zähler aktualisiert wird
**Then** zeigt die Summary-Zeile eine Warnung: "0 Tracks — alle Tracks würden ausgeschlossen"

**Given** mindestens eine Quelle und ein Name sind eingegeben
**When** der Nutzer auf "Erstellen" klickt
**Then** gibt der Button einen Welleneffekt (Button-Ripple)
**And** beim Hover bewegt sich der Button um -1px nach oben mit leichtem Schatten

## Tasks / Subtasks

- [x] `Toolbar.tsx` erstellen (AC: #1, #2, #3, #4)
  - [x] shadcn/ui `Input` für Playlist-Name einbinden (Sky-Border bei Fokus)
  - [x] Live-Summary-Text berechnen und rendern
  - [x] "0 Tracks"-Warnung in Summary einbauen
  - [x] "Erstellen"-Button (Primary, Sky, `+`-Icon) mit disabled-Logik
  - [x] Button-Ripple via CSS-Klasse + `isRippling`-State
  - [x] Button-Hover: `hover:-translate-y-px hover:shadow-md transition-all duration-150`
  - [x] Responsives Layout: Desktop `static`, Mobile `sticky bottom-0 bg-white`

- [x] `Toolbar.test.tsx` erstellen
  - [x] Input sichtbar und änderbar
  - [x] Button disabled wenn kein Name
  - [x] Button disabled wenn keine Quelle
  - [x] Button aktiv wenn Name + Quelle vorhanden
  - [x] Summary-Text korrekt berechnet
  - [x] 0-Tracks-Warnung erscheint

- [x] `src/index.css` erweitern
  - [x] `@keyframes button-ripple` und `.button-ripple` Klasse hinzufügen

- [x] `PlaylistColumns.tsx` anpassen
  - [x] Toolbar über Grid einbinden, responsives Layout mit flex-col + CSS-Order

## Dev Notes

### Was bereits implementiert ist (NICHT neu erstellen)

**Im Reducer (`src/context/appReducer.ts`) — komplett fertig:**
- `playlistName: string` im AppState (initial `''`)
- `SET_PLAYLIST_NAME` Action: `{ type: 'SET_PLAYLIST_NAME'; payload: string }`
- `RESET_SELECTION` setzt `playlistName` zurück auf `''`

**Im Context (`src/context/AppContext.tsx`):**
- `AppContext` ist exportiert (seit Story 2.2)
- `useAppContext()` liefert `{ state, dispatch }`
- `state.selectedSources`, `state.selectedExcludes`, `state.playlists`, `state.playlistName`

**In `PlaylistColumns.tsx` — bestehende Struktur (NICHT brechen):**
- Skeleton-Render bei `phase === 'loading'`
- EmptyState bei `playlists.length === 0`
- Grid `grid grid-cols-1 md:grid-cols-2 gap-6` mit ColumnHeader + PlaylistRow pro Spalte
- Duplikat-Warnung mit `role="alert"` nach dem Grid

**In `src/index.css` — bestehende Animationen:**
- `@keyframes checkbox-pop` + `.checkbox-pop`
- `@keyframes badge-bounce` + `.badge-bounce`
- Diese NICHT anfassen — nur `button-ripple` hinzufügen

**Installierte shadcn/ui-Komponenten:** `Input`, `Button` — bereits verfügbar unter `@/components/ui/`

**Installierte Icons:** Lucide — `Plus` für den Erstellen-Button

### Toolbar-Komponente — Spezifikation

```
Datei: src/components/Toolbar.tsx
Props: value, onChange, summary, onSubmit, disabled
```

**Props-Interface:**
```typescript
interface ToolbarProps {
  value: string
  onChange: (name: string) => void
  summary: string
  onSubmit: () => void
  disabled: boolean
}
```

**Toolbar liest KEINE Context** — sie bekommt alle Daten als Props (Testbarkeit). Die Context-Logik liegt beim Aufrufer (`PlaylistColumns.tsx`).

**Vollständiges Toolbar-Template:**
```tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Toolbar({ value, onChange, summary, onSubmit, disabled }: ToolbarProps) {
  const [isRippling, setIsRippling] = useState(false)

  function handleSubmit() {
    if (disabled) return
    setIsRippling(true)
    setTimeout(() => setIsRippling(false), 400)
    onSubmit()
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4 px-4 bg-white border-t border-gray-100">
      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        <label htmlFor="playlist-name" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Playlist-Name
        </label>
        <Input
          id="playlist-name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Meine neue Playlist"
          className="flex-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">{summary}</span>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        className={`bg-sky-600 hover:bg-sky-700 text-white hover:-translate-y-px hover:shadow-md transition-all duration-150 md:w-auto w-full ${isRippling ? 'button-ripple' : ''}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Erstellen
      </Button>
    </div>
  )
}
```

**Wichtig:** `disabled`-Button: shadcn/ui `Button` mit `disabled`-Prop setzt automatisch `opacity-50 cursor-not-allowed` — kein manuelles CSS nötig.

### Live-Summary Berechnung

Die Summary-Berechnung geschieht im Aufrufer (`PlaylistColumns.tsx`), nicht in `Toolbar.tsx`:

```typescript
// In PlaylistColumns.tsx — vor dem return
const estimatedTracks = state.playlists
  .filter(p => state.selectedSources.includes(p.id))
  .reduce((sum, p) => sum + p.trackCount, 0)

const summaryText = estimatedTracks === 0 && state.selectedSources.length > 0
  ? '0 Tracks — alle Tracks würden ausgeschlossen'
  : `${state.selectedSources.length} Quellen · ${state.selectedExcludes.length} Ausschlüsse · ~${estimatedTracks} Tracks`
```

**Hinweis:** Das ist eine SCHÄTZUNG auf Basis der Playlist-`trackCount`-Felder. Die echte Diff-Berechnung (Tracks laden, deduplizieren, subtrahieren) erfolgt erst in Epic 3. Der `~`-Präfix signalisiert das.

**Wann zeigt die Warnung "0 Tracks — alle Tracks würden ausgeschlossen":**
- Wenn Quell-Playlisten ausgewählt sind, aber deren gesamter `trackCount` = 0
- Nicht wenn `selectedSources.length === 0` (dafür ist der Button disabled ausreichend)

### Disabled-Logik für den Erstellen-Button

```typescript
const isDisabled = state.selectedSources.length === 0 || state.playlistName.trim() === ''
```

**Beide Bedingungen müssen erfüllt sein** — kein Tooltip, kein Fehlermeldungs-Modal nötig (AC #2).

### Toolbar-Anbindung in PlaylistColumns.tsx

```typescript
// Dispatch für Namensänderung:
dispatch({ type: 'SET_PLAYLIST_NAME', payload: name })

// onSubmit löst Story 2.4 (Confirmation-Dialog) aus — Platzhalter für jetzt:
// Story 2.3 implementiert nur: dispatch({ type: 'SET_PHASE', payload: 'creating' })
// NEIN — Story 2.4 baut darauf auf. Story 2.3 soll NUR den Dialog vorbereiten.
// Korrekt: onSubmit öffnet noch KEINEN Dialog (Story 2.4 macht das).
// Story 2.3 lässt onSubmit als No-op oder console.error-frei leer.
```

**Was `onSubmit` in Story 2.3 tut:** Noch nichts — Story 2.4 baut den Confirmation-Dialog. In Story 2.3 reicht es, den Button zu aktivieren/deaktivieren und die Ripple-Animation auszulösen. `onSubmit` kann vorerst eine leere Funktion sein.

### Responsives Layout (Desktop above / Mobile sticky bottom)

**Anforderung (UX-Spec):**
- Desktop/Tablet (≥768px): Toolbar **oberhalb** des Spalten-Grids
- Mobile (<768px): Toolbar als **sticky Footer** unten

**Implementierung in `PlaylistColumns.tsx`** mit Flexbox-Ordering:

```tsx
// In PlaylistColumns, selection-Zweig:
<main className="max-w-6xl mx-auto p-6 md:p-8">
  <div className="flex flex-col">
    {/* Grid: order-1 auf Mobile (oben), order-2 auf Desktop (nach Toolbar) */}
    <div className="order-1 md:order-2 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ... ColumnHeader + PlaylistRow ... */}
    </div>
    {/* Toolbar: order-2 auf Mobile (nach Grid), order-1 auf Desktop (über Grid) */}
    {/* sticky bottom-0: wirkt auf Mobile wenn User scrollt */}
    <div className="order-2 md:order-1 sticky bottom-0 md:static md:mb-6 -mx-6 md:mx-0 px-0 md:px-0">
      <Toolbar
        value={state.playlistName}
        onChange={(name) => dispatch({ type: 'SET_PLAYLIST_NAME', payload: name })}
        summary={summaryText}
        onSubmit={() => {}} // Story 2.4 füllt das aus
        disabled={isDisabled}
      />
    </div>
  </div>
  {/* Duplikat-Warnung bleibt unterhalb des Grids (order wird nicht auf diese angewendet) */}
  {duplicates.length > 0 && (
    <div role="alert" /* ... */ />
  )}
</main>
```

**Alternative falls Ordering-Ansatz Probleme macht:** Toolbar einfach ÜBER den Grid rendern (DOM-Reihenfolge: Toolbar → Grid), auf Mobile mit `sticky bottom-0`. Der Sticky-Effekt funktioniert dann anders — die Toolbar klebt unten wenn der Nutzer stark nach unten scrollt. Einfacheres HTML, aber ggf. weniger perfektes Mobile-UX.

**Tailwind-Klassen Zusammenfassung für sticky Footer:**
```
sticky bottom-0 bg-white border-t border-gray-200 z-10
```
(z-10 verhindert, dass Content über der Toolbar liegt beim Scrolling)

### Button-Ripple Animation (src/index.css ergänzen)

```css
/* Unter den bestehenden checkbox-pop und badge-bounce Animationen hinzufügen */
@keyframes button-ripple {
  0%   { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.4); }
  70%  { box-shadow: 0 0 0 12px rgba(2, 132, 199, 0); }
  100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
}

.button-ripple {
  animation: button-ripple 400ms ease-out forwards;
}
```

**Timing:** 400ms, dann via `setTimeout` zurück auf `false` (wie `checkbox-pop` mit 220ms).

### Farbsystem (bestehend, NICHT ändern)

- Sky (Quellen, Primary-Button): `sky-600` / `sky-700` (hover)
- Fokus-Ring des Inputs: `ring-sky-500` via `focus-visible:ring-sky-500`
- Toolbar-Hintergrund: `bg-white` mit `border-t border-gray-100`
- Button-Text und Icon: `text-white`

### Testing-Konvention (aus Stories 2.1 + 2.2)

- **Framework:** Vitest + @testing-library/react (jsdom)
- **Co-located:** `Toolbar.test.tsx` neben `Toolbar.tsx`
- **Provider-Wrapping** für Context — aber da Toolbar props-basiert ist, KEIN Context-Wrap nötig!
- **Kein `any`** in Tests

**Toolbar.test.tsx — Muster:**
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '@/components/Toolbar'

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  summary: '0 Quellen · 0 Ausschlüsse · ~0 Tracks',
  onSubmit: vi.fn(),
  disabled: true,
}

test('Button ist disabled wenn disabled=true', () => {
  render(<Toolbar {...defaultProps} />)
  expect(screen.getByRole('button', { name: /erstellen/i })).toBeDisabled()
})

test('Button ist aktiv wenn disabled=false', () => {
  render(<Toolbar {...defaultProps} disabled={false} />)
  expect(screen.getByRole('button', { name: /erstellen/i })).not.toBeDisabled()
})

test('onChange wird aufgerufen wenn Input geändert wird', async () => {
  const onChange = vi.fn()
  render(<Toolbar {...defaultProps} onChange={onChange} />)
  await userEvent.type(screen.getByRole('textbox'), 'Test')
  expect(onChange).toHaveBeenCalled()
})

test('Summary-Text wird angezeigt', () => {
  render(<Toolbar {...defaultProps} summary="2 Quellen · 0 Ausschlüsse · ~30 Tracks" />)
  expect(screen.getByText('2 Quellen · 0 Ausschlüsse · ~30 Tracks')).toBeInTheDocument()
})
```

### Anti-Pattern-Vermeidung

- **KEIN** `any` als TypeScript-Typ
- **KEINE** Inline-Styles — nur Tailwind-Klassen und CSS-Klassen aus `index.css`
- **KEIN** `alert()` für Validierung — Button `disabled` genügt
- **KEIN** neuer State im Reducer für Toolbar-spezifisches — `playlistName` ist bereits im AppState
- **KEIN** `usePlaylistSelection`-Hook o.ä. — direkt `dispatch` aus Context
- **KEINE** direkte Manipulation des `playlistName` außerhalb Reducer — immer via `SET_PLAYLIST_NAME`
- **KEIN** Tracking der exakten Diff-Berechnung (Track-Laden) in Story 2.3 — das ist Epic 3
- **KEIN** Umsortieren der Playlisten-Liste — bestehende `playlists[]`-Reihenfolge bleibt fix
- **KEIN** JavaScript-basierter Layout-Switch (Desktop/Mobile) — nur Tailwind Responsive-Klassen

### Dateistruktur (Änderungen)

```
src/
  index.css                    ← ERWEITERN: button-ripple Keyframe + Klasse
  components/
    Toolbar.tsx                ← NEU erstellen
    Toolbar.test.tsx           ← NEU erstellen
    PlaylistColumns.tsx        ← ANPASSEN: Toolbar integrieren, Layout anpassen
```

**Nicht anfassen:**
- `src/context/appReducer.ts` — `SET_PLAYLIST_NAME` bereits implementiert
- `src/context/AppContext.tsx` — fertig
- `src/types/index.ts` — `playlistName: string` bereits im AppState
- `src/App.tsx` — kein Änderungsbedarf (Toolbar lebt in PlaylistColumns)
- Alle anderen Komponenten

### Vorherige Story Learnings (aus 2.2)

- CSS-Animationen gehen in `src/index.css` (NICHT `App.css` — Projekt hat keine `App.css`)
- Animations-Pattern: CSS-Klasse via `useState` + `useEffect`/`setTimeout`, kein `style={{ animation }}`
- `AppContext` ist exportiert und kann direkt für Provider-Wrapping in Tests genutzt werden
- `userEvent` aus `@testing-library/user-event` für Klick-/Tipp-Events in Tests
- shadcn/ui Komponenten (`Input`, `Button`) über `@/components/ui/` importieren
- `aria-checked` und `role="alert"` für Screenreader (WCAG)

### Git-Muster (aus aktuellen Commits)

- Commit-Format: `feat(story-2.3): Toolbar mit Playlist-Name, Live-Summary & Erstellen-Button`
- Tests co-located, alle Tests müssen grün sein vor Commit

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (via Vertex AI)

### Debug Log References

Keine Fehler — alle 70 Tests auf Anhieb grün.

### Completion Notes List

- ✅ `Toolbar.tsx` erstellt: Props-basierte Komponente (kein direkter Context-Zugriff), shadcn/ui Input + Button, Ripple-State via useState/setTimeout
- ✅ `Toolbar.test.tsx` erstellt: 8 Tests — Input-Wert, disabled-Logik, onChange, Summary-Text, 0-Tracks-Warnung, onSubmit-Aufruf
- ✅ `src/index.css` erweitert: `@keyframes button-ripple` + `.button-ripple`-Klasse (400ms, bestehende Animationen unangetastet)
- ✅ `PlaylistColumns.tsx` angepasst: Summary-Berechnung (estimatedTracks, summaryText, isDisabled), Toolbar-Integration mit responsivem flex-col + CSS-Order-Layout, sticky bottom-0 für Mobile
- ✅ Alle 70 Tests bestanden (keine Regressions)

### File List

- src/index.css
- src/components/Toolbar.tsx
- src/components/Toolbar.test.tsx
- src/components/PlaylistColumns.tsx

## Change Log

- 2026-03-25: Story erstellt — Toolbar mit Playlist-Name-Input, Live-Summary, Button-Ripple, responsivem Layout
- 2026-03-25: Story implementiert — Toolbar.tsx, Toolbar.test.tsx, index.css (button-ripple), PlaylistColumns.tsx angepasst; 70/70 Tests grün
