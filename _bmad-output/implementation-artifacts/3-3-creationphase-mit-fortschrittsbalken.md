# Story 3.3: CreationPhase mit Fortschrittsbalken

Status: review

## Story

Als Nutzer der auf die Erstellung wartet
möchte ich einen klaren Fortschrittsbalken mit 4 expliziten Schritten sehen,
damit ich jederzeit weiß was gerade passiert und nicht in einem eingefrorenen UI-Zustand hänge.

## Acceptance Criteria

**AC1 — CreationPhase ersetzt Spinner:**
**Given** der Nutzer hat "Erstellen" im Confirmation-Dialog bestätigt
**When** die App zu Phase `creating` wechselt
**Then** ersetzt die `CreationPhase`-Komponente den bisherigen Spinner vollständig
**And** der Playlist-Name (`state.playlistName`) wird als Subtitle angezeigt
**And** vier Schritte sind sichtbar: "Tracks laden", "Differenz berechnen", "Playlist anlegen", "Tracks hinzufügen"
**And** der aktive Schritt ist mit einem Puls-Dot markiert; abgeschlossene Schritte mit einem Check-Icon

**AC2 — Fortschrittsbalken aktualisiert sich fließend:**
**Given** die Erstellung läuft
**When** jeder Schritt abgeschlossen wird
**Then** aktualisiert sich der Fortschrittsbalken (Sky-Akzent) fließend auf den nächsten Wert (`state.progress`)
**And** die UI bleibt responsiv — kein eingefrorener Zustand

**AC3 — Timeout nach 10 Sekunden ohne Fortschritt:**
**Given** der Fortschritt hat sich für mehr als 10 Sekunden nicht geändert
**When** der interne Timer ausläuft
**Then** zeigt die `CreationPhase` eine Timeout-Meldung innerhalb der Komponente
**And** zwei Buttons erscheinen: "Nochmal versuchen" und "Zurück zur Auswahl"
**And** kein automatischer Retry

**AC4 — Retry-Buttons verhalten sich korrekt:**
**Given** die Timeout-UI ist sichtbar
**When** der Nutzer "Nochmal versuchen" klickt
**Then** wechselt die App zurück zu Phase `selection` (Auswahl bleibt erhalten — kein RESET_SELECTION)
**When** der Nutzer "Zurück zur Auswahl" klickt
**Then** wird `RESET_SELECTION` dispatcht + Phase `selection` gesetzt (Auswahl wird geleert)

**AC5 — Tests:**
**Given** Unit-Tests für `CreationPhase.tsx`
**When** die Tests ausgeführt werden
**Then** sind folgende Cases abgedeckt:
- Schritt-Status bei verschiedenen Progress-Werten (0%, 50%, 80%, 85%, 90%, 100%)
- Timeout-UI erscheint nach 10s ohne Progress-Änderung (Fake-Timer)
- "Nochmal versuchen"-Button dispatcht SET_PHASE: 'selection'
- "Zurück zur Auswahl"-Button dispatcht RESET_SELECTION + SET_PHASE: 'selection'

---

## Tasks / Subtasks

- [x] `src/components/CreationPhase.tsx` — neu erstellen (AC1, AC2, AC3, AC4)
  - [x] `useAppContext()` lesen für `state.progress` und `state.playlistName`
  - [x] 4-Schritt-Liste mit Status-Berechnung aus `state.progress` (siehe Dev Notes)
  - [x] shadcn/ui `Progress`-Komponente mit Sky-Akzent (`[&>*]:bg-sky-600`)
  - [x] Puls-Dot (`animate-pulse`) für aktiven Schritt, Check-Icon für abgeschlossene
  - [x] `useEffect` mit 10s-Timer der bei jeder `progress`-Änderung zurückgesetzt wird
  - [x] `timedOut`-State: wenn true → Timeout-UI statt normaler Schritt-Liste
  - [x] Timeout-UI: Meldung + zwei Buttons ("Nochmal versuchen" / "Zurück zur Auswahl")
  - [x] `aria-live="polite"` auf dem `<main>` Container

- [x] `src/App.tsx` — 'creating'-Case anpassen (AC1)
  - [x] Import `CreationPhase` ergänzen
  - [x] Spinner-Placeholder durch `<CreationPhase />` ersetzen
  - [x] `<AppHeader />` + `<CreationPhase />` in JSX — identisch zum 'loading'/'selection'-Case

- [x] `src/components/CreationPhase.test.tsx` — neu erstellen (AC5)
  - [x] Tests für Schritt-Status-Berechnung bei allen relevanten Progress-Werten
  - [x] Tests für Timeout (Fake-Timer via `vi.useFakeTimers()`)
  - [x] Tests für Retry/Back-Button-Verhalten (Mock dispatch)

---

## Dev Notes

### Was BEREITS implementiert ist (NICHT neu erstellen)

**`src/App.tsx` — Aktueller 'creating'-Case (NUR ersetzen):**
```tsx
case 'creating':
  return (
    <>
      <AppHeader />
      <main
        aria-live="polite"
        className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" aria-hidden="true" />
        <p className="text-lg font-semibold text-gray-900">{state.playlistName}</p>
        <p className="text-sm text-gray-500">Erstelle Playlist…</p>
      </main>
    </>
  )
```
→ Diesen Block durch `<AppHeader /><CreationPhase />` ersetzen.

**`state.progress` — bereits dispatcht in App.tsx:**
- `SET_PROGRESS: 0` — initialer Wert bei Beginn von `loadTracks()`
- `SET_PROGRESS: Math.round((completed / tasks.length) * 80)` — inkrementell während Track-Loading (0→80)
- `SET_PROGRESS: 85` — nach `calculateDiff()`
- `SET_PROGRESS: 90` — nach `createPlaylist()`
- `SET_PROGRESS: 100` — nach `addTracksToPlaylist()`

→ `CreationPhase` liest nur `state.progress` und berechnet daraus den Schritt-Status. KEINE Änderungen an App.tsx's loadTracks()-Logik!

**Bestehende shadcn/ui Komponente:** `src/components/ui/progress.tsx` — BEREITS INSTALLIERT
```tsx
<Progress value={state.progress} className="[&>*]:bg-sky-600" />
```
→ `[&>*]:bg-sky-600` überschreibt die `bg-primary`-Klasse des Indicators auf Sky-Blau.
→ `transition-all` ist bereits im Progress-Indicator — fließende Animation ohne Extra-Konfiguration.

**Lucide Icons sind installiert** — `CheckCircle2`, `Loader2` aus `lucide-react` verwenden.

**NICHT anfassen:**
- `src/lib/spotifyApi.ts` — `AbortSignal.timeout(10_000)` handelt bereits API-Timeouts auf Request-Ebene
- `src/context/appReducer.ts`, `src/types/index.ts` — kein neuer State nötig
- Alle anderen Komponenten (AppHeader, PlaylistColumns, etc.)
- `src/lib/diffEngine.ts`, `src/lib/auth.ts`, `src/lib/concurrency.ts`

---

### CreationPhase — vollständige Implementierungs-Spezifikation

**Schritt-Status-Berechnung:**
```typescript
type StepStatus = 'done' | 'active' | 'pending'

function getStepStatus(progress: number, doneAt: number, activeFrom: number): StepStatus {
  if (progress >= doneAt) return 'done'
  if (progress >= activeFrom) return 'active'
  return 'pending'
}

// Anwendung für 4 Schritte:
const steps = [
  { label: 'Tracks laden',        status: getStepStatus(progress, 80, 0)   },
  { label: 'Differenz berechnen', status: getStepStatus(progress, 85, 80)  },
  { label: 'Playlist anlegen',    status: getStepStatus(progress, 90, 85)  },
  { label: 'Tracks hinzufügen',   status: getStepStatus(progress, 100, 90) },
]
```

**Puls-Dot (active) vs. Check-Icon (done) vs. grauer Dot (pending):**
```tsx
{step.status === 'done' && (
  <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
)}
{step.status === 'active' && (
  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-sky-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-600" />
  </span>
)}
{step.status === 'pending' && (
  <span className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
)}
```

**Timeout-Timer:**
```typescript
const [timedOut, setTimedOut] = useState(false)

useEffect(() => {
  setTimedOut(false)                   // reset bei jedem neuen progress-Wert
  const timer = setTimeout(() => {
    setTimedOut(true)
  }, 10_000)
  return () => clearTimeout(timer)
}, [progress])                         // dependency: nur progress
```

**Timeout-UI:**
```tsx
{timedOut ? (
  <div className="flex flex-col items-center gap-4 text-center">
    <p className="text-sm text-gray-500">
      Die Verbindung zu Spotify scheint unterbrochen. Was möchtest du tun?
    </p>
    <div className="flex gap-3">
      <button
        onClick={() => dispatch({ type: 'SET_PHASE', payload: 'selection' })}
        className="..."
      >
        Nochmal versuchen
      </button>
      <button
        onClick={() => {
          dispatch({ type: 'RESET_SELECTION' })
          dispatch({ type: 'SET_PHASE', payload: 'selection' })
        }}
        className="..."
      >
        Zurück zur Auswahl
      </button>
    </div>
  </div>
) : (
  // normale Schritt-Liste
)}
```

→ Buttons: shadcn/ui `Button`-Komponente verwenden (`variant="default"` / `variant="outline"`).

**"Nochmal versuchen" ohne RESET_SELECTION:**
- `SET_PHASE: 'selection'` behält `selectedSources`, `selectedExcludes`, `playlistName` aus dem State
- Der Nutzer sieht seine Auswahl wieder und kann sofort erneut "Erstellen" klicken
- `RESET_SELECTION` NUR für "Zurück zur Auswahl" (Auswahl leeren)

**Vollständiges Komponenten-Skelett:**
```tsx
import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/context/AppContext'

export function CreationPhase() {
  const { state, dispatch } = useAppContext()
  const { progress, playlistName } = state
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    setTimedOut(false)
    const timer = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(timer)
  }, [progress])

  const steps = [
    { label: 'Tracks laden',        status: getStepStatus(progress, 80, 0)   },
    { label: 'Differenz berechnen', status: getStepStatus(progress, 85, 80)  },
    { label: 'Playlist anlegen',    status: getStepStatus(progress, 90, 85)  },
    { label: 'Tracks hinzufügen',   status: getStepStatus(progress, 100, 90) },
  ]

  return (
    <main
      aria-live="polite"
      className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-6"
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Playlist wird erstellt…</h2>
          <p className="text-sm text-gray-500 mt-1">{playlistName}</p>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="[&>*]:bg-sky-600" />

        {/* Schritt-Liste oder Timeout-UI */}
        {timedOut ? (
          /* Timeout-UI */
        ) : (
          <ol className="flex flex-col gap-3">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                {/* Status-Icon */}
                <span className="text-sm text-gray-700 font-medium">{step.label}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  )
}
```

---

### Testing-Anforderungen

**Framework:** Vitest + @testing-library/react + vi.useFakeTimers()

**Mocking-Pattern (identisch zu bestehenden Tests):**
```typescript
// AppContext mocken
vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

// Dispatch-Mock
const mockDispatch = vi.fn()
vi.mocked(useAppContext).mockReturnValue({
  state: { ...initialState, phase: 'creating', progress: 50, playlistName: 'Test' },
  dispatch: mockDispatch,
})
```

**Schritt-Status-Tests:**
```typescript
test('progress 0: Schritt 1 active, Rest pending', () => {
  // progress: 0 → step 1 active
})

test('progress 80: Schritt 1 done, Schritt 2 active', () => {
  // progress: 80 → step 1 done, step 2 active
})

test('progress 85: Schritt 2 done, Schritt 3 active', () => { ... })
test('progress 90: Schritt 3 done, Schritt 4 active', () => { ... })
test('progress 100: alle Schritte done', () => { ... })
```

**Timeout-Test:**
```typescript
test('Timeout-UI erscheint nach 10s ohne Progress-Änderung', async () => {
  vi.useFakeTimers()
  render(<CreationPhase />)

  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()

  vi.advanceTimersByTime(10_001)

  expect(await screen.findByText('Nochmal versuchen')).toBeInTheDocument()
  expect(screen.getByText('Zurück zur Auswahl')).toBeInTheDocument()

  vi.useRealTimers()
})

test('Nochmal versuchen: dispatcht SET_PHASE selection', async () => {
  vi.useFakeTimers()
  render(<CreationPhase />)
  vi.advanceTimersByTime(10_001)

  fireEvent.click(await screen.findByText('Nochmal versuchen'))
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })
  expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SELECTION' })

  vi.useRealTimers()
})

test('Zurück zur Auswahl: dispatcht RESET_SELECTION + SET_PHASE', async () => {
  vi.useFakeTimers()
  render(<CreationPhase />)
  vi.advanceTimersByTime(10_001)

  fireEvent.click(await screen.findByText('Zurück zur Auswahl'))
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })

  vi.useRealTimers()
})
```

---

### Projekt-Struktur (Änderungen)

```
src/
  components/
    CreationPhase.tsx          ← NEU: Fortschritts-Vollbild-Ansicht
    CreationPhase.test.tsx     ← NEU: Unit-Tests
  App.tsx                      ← ANPASSEN: 'creating'-Case → <CreationPhase />
```

**NICHT anfassen:**
- `src/types/index.ts` — kein neues State-Feld nötig
- `src/context/appReducer.ts` — kein neuer Reducer-Case nötig
- `src/lib/spotifyApi.ts`, `src/lib/diffEngine.ts`, `src/lib/auth.ts`
- `src/lib/concurrency.ts`
- Alle anderen Komponenten (PlaylistRow, Toolbar, ConfirmDialog, etc.)

---

### Wichtige Architektur-Constraints (PFLICHT)

- **`CreationPhase` liest State via `useAppContext()`** — kein Props-Drilling
- **Kein neuer AppState** — `timedOut` ist lokaler `useState` in der Komponente
- **Kein neues AppPhase** — 'creating' bleibt der Phase-Wert; Timeout wird komponenintern verwaltet
- **`RESET_SELECTION` NICHT für "Nochmal versuchen"** — Auswahl muss für Retry erhalten bleiben
- **Kein Framer Motion** — Phase-Übergänge kommen in Story 4.2. Hier: einfaches Phase-Switch ohne Animation
- **shadcn/ui Button-Komponente verwenden** — kein roher `<button>`-Tag für die Retry-Buttons
- **shadcn/ui Progress-Komponente verwenden** — bereits in `src/components/ui/progress.tsx`
- **`[&>*]:bg-sky-600`** — Sky-Akzent über Tailwind-Arbitrary-Selector, da Progress-Indicator das `bg-primary`-Theme nutzt
- **Keine SuccessScreen- oder ErrorState-Implementierung** — Story 3.4
- **107 bestehende Tests müssen grün bleiben** — keine Regressionen

---

### Wichtige Hinweise aus Story 3.2 (Previous Story Intelligence)

- **`AppContext` Pattern:** `const { state, dispatch } = useAppContext()` — Standard für alle Komponenten
- **Test-Mocking-Pattern:** `vi.mock('@/context/AppContext', ...)` + `vi.mocked(useAppContext).mockReturnValue(...)` — bereits in mehreren Tests etabliert (PlaylistColumns.test.tsx, Toolbar.test.tsx)
- **107 Tests waren grün** nach Story 3.2 — keine Regressionen erlaubt
- **`state.progress` ist `number` (0–100)** in `AppState` — kein Typ-Cast nötig
- **`state.playlistName` ist `string`** in `AppState`
- **Commit-Format:** `feat(story-3.3): CreationPhase mit Fortschrittsbalken`
- **Kein `AbortError`-Handling in CreationPhase** nötig — API-Timeouts (AbortSignal.timeout) werden im catch-Block von loadTracks() in App.tsx abgefangen → error-Phase. Story 3.3's Timeout ist UI-seitig: kein Fortschritt für 10s → Timeout-UI innerhalb der Komponente.

### Anti-Pattern-Vermeidung

- **KEIN** `useState` für die Schritt-Liste selbst — direkt aus `state.progress` berechnen
- **KEIN** neues `AppPhase`-Value (z.B. 'timeout') — lokaler `timedOut: boolean` State reicht
- **KEIN** Framer Motion Import für diese Story — CSS `transition-all` (bereits im Progress-Indicator) ist ausreichend
- **KEIN** manueller `<progress>`-HTML-Tag — shadcn/ui `Progress`-Komponente verwenden
- **KEIN** Prop-Drilling von `progress` oder `playlistName` — `useAppContext()` direkt in der Komponente
- **KEIN** `console.log` in Production-Code

---

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (@vertex-ai/anthropic.claude-sonnet-4-6)

### Debug Log References

- Fake-Timer-Tests: `findByText` (async polling) funktioniert nicht mit `vi.useFakeTimers()`. Fix: `act(() => vi.advanceTimersByTime(...))` + synchrones `getByText`.

### Completion Notes List

- `CreationPhase.tsx` neu erstellt: 4-Schritt-Fortschrittsanzeige, `getStepStatus()`-Funktion, Puls-Dot/Check-Icon/grauer Dot je nach Status, 10s-Timeout via `useEffect`, Timeout-UI mit zwei Buttons (shadcn/ui), `aria-live="polite"`.
- `App.tsx` angepasst: Spinner-Block im `creating`-Case durch `<CreationPhase />` ersetzt, Import ergänzt.
- `CreationPhase.test.tsx` neu erstellt: 12 Tests — Schritt-Status bei progress 0/50/80/85/90/100, Timeout-UI nach 10s, Button-Dispatches, aria-live, playlistName-Subtitle.
- Alle 119 Tests grün (107 Bestand + 12 neue), keine Regressionen.

### File List

- src/components/CreationPhase.tsx
- src/components/CreationPhase.test.tsx
- src/App.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-3-creationphase-mit-fortschrittsbalken.md

### Change Log

- 2026-03-26: Story 3.3 implementiert — CreationPhase.tsx (neu), CreationPhase.test.tsx (neu, 12 Tests), App.tsx (creating-Case: Spinner → CreationPhase)
