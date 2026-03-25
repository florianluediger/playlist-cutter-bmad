# Story 2.4: Confirmation-Dialog vor der Erstellung

Status: done

## Story

Als Nutzer
möchte ich vor dem Erstellen eine Zusammenfassung meiner Auswahl sehen und bestätigen,
damit ich sicher sein kann, dass die richtige Konfiguration ausgeführt wird.

## Acceptance Criteria

**Given** der "Erstellen"-Button ist aktiv (Name vorhanden + min. 1 Quelle)
**When** der Nutzer auf "Erstellen" klickt
**Then** öffnet sich der `ConfirmDialog` mit der Auswahl-Zusammenfassung (Anzahl Quellen, Anzahl Ausschlüsse, geschätzte Track-Anzahl, Playlist-Name)

**Given** der `ConfirmDialog` ist geöffnet
**When** der Nutzer auf "Erstellen" klickt (Primary-Button im Dialog)
**Then** schließt der Dialog und die App wechselt zu Phase `creating`
**And** ein Lade-Platzhalter-Screen ist sichtbar mit dem Playlist-Namen als Titel und dem Text "Erstelle Playlist…" sowie einem indeterminierten Ladeindikator (Spinner oder Skeleton)
**And** alle Auswahl-Interaktionen sind deaktiviert (kein zurück zur Auswahl ohne expliziten Abbruch)
**And** die volle CreationPhase-Implementierung mit 4-Schritt-Fortschrittsbalken folgt in Story 3.3

**Given** der `ConfirmDialog` ist geöffnet
**When** der Nutzer auf "Abbrechen" klickt, Escape drückt oder außerhalb des Dialogs klickt
**Then** schließt der Dialog ohne Datenverlust — alle Auswahlen und der Playlist-Name bleiben erhalten

**Given** der Nutzer befindet sich auf Mobile
**When** der "Erstellen"-Button geklickt wird
**Then** erscheint der Dialog als Bottom Sheet (shadcn/ui `Drawer`) statt als zentrierter Modal

## Tasks / Subtasks

- [x] shadcn/ui `Drawer`-Komponente installieren
  - [x] `yarn dlx shadcn@latest add drawer` ausführen → installiert `vaul` und `src/components/ui/drawer.tsx`

- [x] `ConfirmDialog.tsx` erstellen (AC: #1, #3, #4)
  - [x] Props-Interface definieren: `isOpen`, `onConfirm`, `onCancel`, `summary` (Quellen, Ausschlüsse, Tracks, Name)
  - [x] Desktop: shadcn/ui `Dialog` mit Zusammenfassung + zwei Buttons ("Erstellen" Primary, "Abbrechen" Outline)
  - [x] Mobile: shadcn/ui `Drawer` als Bottom Sheet — gleicher Inhalt, andere Container-Komponente
  - [x] Mobile-Detection via `useMediaQuery`-Hook oder `window.matchMedia` — Hook in `PlaylistColumns.tsx` oder inline

- [x] `ConfirmDialog.test.tsx` erstellen
  - [x] Dialog öffnet sich (isOpen=true)
  - [x] "Erstellen"-Button ruft `onConfirm` auf
  - [x] "Abbrechen"-Button ruft `onCancel` auf
  - [x] Zusammenfassung-Inhalte werden korrekt angezeigt

- [x] `PlaylistColumns.tsx` anpassen (AC: #1, #2, #3)
  - [x] `isDialogOpen: boolean` als lokaler State hinzufügen (NICHT im Reducer)
  - [x] `onSubmit` in Toolbar: setzt `isDialogOpen` auf `true`
  - [x] `ConfirmDialog` in JSX einbinden mit allen benötigten Props
  - [x] Bei `onConfirm`: `setIsDialogOpen(false)` + `dispatch({ type: 'SET_PHASE', payload: 'creating' })`
  - [x] Bei `onCancel`: `setIsDialogOpen(false)` (alle Auswahlen bleiben erhalten)

- [x] `App.tsx` anpassen (AC: #2 — Placeholder-Screen für Phase `creating`)
  - [x] `case 'creating'` in den Switch einfügen
  - [x] Placeholder-Rendering: `AppHeader` + einfacher Loading-Screen (Playlist-Name als Titel, "Erstelle Playlist…", Spinner)
  - [x] Kein echter API-Call — die volle Implementierung folgt in Epic 3

## Dev Notes

### Was bereits implementiert ist (NICHT neu erstellen)

**In `src/context/appReducer.ts` — komplett fertig:**
- `phase: AppPhase` im AppState — `'creating'` ist bereits als gültiger Wert in `AppPhase` definiert
- `SET_PHASE` Action: `{ type: 'SET_PHASE'; payload: AppPhase }` → direkt nutzbar
- `RESET_SELECTION`, `playlistName`, alle Selection-States — NICHT anfassen

**In `src/types/index.ts` — fertig:**
- `AppPhase = 'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error' | 'session-expired'`
- `'creating'` ist bereits ein gültiger Phase-Wert — **kein Typen-Update nötig**

**In `src/context/AppContext.tsx` — fertig:**
- `useAppContext()` liefert `{ state, dispatch }` — unverändert nutzbar

**In `src/components/PlaylistColumns.tsx` — bestehende Struktur (NICHT brechen):**
- `onSubmit={() => {}}` ist der aktuelle Platzhalter → **Story 2.4 ersetzt diesen Platzhalter**
- `summaryText` und `isDisabled` Berechnungen — NICHT ändern
- Duplikat-Warnung mit `role="alert"` — NICHT anfassen
- Sticky-Toolbar-Layout — NICHT anfassen

**Installierte shadcn/ui-Komponenten (bereits verfügbar unter `@/components/ui/`):**
- `dialog.tsx` — für Desktop-Modal
- `button.tsx`, `input.tsx`, `badge.tsx`, `checkbox.tsx`, `progress.tsx`, `separator.tsx`
- ⚠️ `drawer.tsx` ist NOCH NICHT installiert — muss via CLI ergänzt werden

**Farbsystem:**
- Sky: `sky-600` / `sky-700` (hover) → Primary-Buttons
- Outline/Secondary: shadcn/ui default `variant="outline"`
- Kein Änderungsbedarf

---

### ConfirmDialog-Komponente — Spezifikation

```
Datei: src/components/ConfirmDialog.tsx
```

**Props-Interface:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  playlistName: string
  sourceCount: number
  excludeCount: number
  estimatedTrackCount: number
}
```

**Desktop (Dialog) — Inhalt:**
```
Titel: "Playlist erstellen"
Subtitle: playlistName (fett, etwas größer)
---
Zusammenfassung (Liste oder Key-Value):
  Quellen:     X Playlisten
  Ausschlüsse: Y Playlisten
  Geschätzte Tracks: ~Z Tracks (mit Hinweis-Text "Exakte Anzahl nach Diff-Berechnung")
---
Footer:
  [Abbrechen]  [+ Erstellen]   ← Primary = Sky, Secondary = Outline
```

**Dialog-Template (Desktop):**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function DialogBody({ playlistName, sourceCount, excludeCount, estimatedTrackCount, onConfirm, onCancel }: ...) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Playlist erstellen</DialogTitle>
        <DialogDescription>
          Überprüfe deine Auswahl, bevor die Playlist erstellt wird.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-3">
        <p className="font-semibold text-base text-gray-900">{playlistName}</p>
        <dl className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <dt>Quellen</dt>
            <dd>{sourceCount} {sourceCount === 1 ? 'Playlist' : 'Playlisten'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ausschlüsse</dt>
            <dd>{excludeCount} {excludeCount === 1 ? 'Playlist' : 'Playlisten'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Geschätzte Tracks</dt>
            <dd>~{estimatedTrackCount} Tracks</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-400">
          Die exakte Track-Anzahl wird nach der Diff-Berechnung ermittelt.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button onClick={onConfirm} className="bg-sky-600 hover:bg-sky-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Erstellen
        </Button>
      </DialogFooter>
    </>
  )
}
```

**Mobile (Drawer) — gleicher Inhalt, anderer Wrapper:**
```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
```

**Vollständige ConfirmDialog-Komponente:**
```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery' // NEU: einfacher Hook

export function ConfirmDialog({ isOpen, onConfirm, onCancel, playlistName, sourceCount, excludeCount, estimatedTrackCount }: ConfirmDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
        <DialogContent>
          <DialogBody ... />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DrawerContent>
        <DrawerBody ... />
      </DrawerContent>
    </Drawer>
  )
}
```

---

### useMediaQuery-Hook — Implementierung

Da kein externes Hook-Library installiert ist, einen minimalen Hook erstellen:

```typescript
// src/hooks/useMediaQuery.ts
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}
```

**Datei:** `src/hooks/useMediaQuery.ts`
**Hinweis:** Kein SSR-Problem da die App rein client-side ist. `window.matchMedia` ist immer verfügbar.

---

### PlaylistColumns.tsx-Anpassung — Minimal-Diff

Nur diese Änderungen — alles andere NICHT anfassen:

```typescript
// 1. Imports ergänzen:
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

// 2. Lokaler State (NICHT im Reducer):
const [isDialogOpen, setIsDialogOpen] = useState(false)

// 3. estimatedTracks bereits berechnet → für Dialog nutzen:
const estimatedTracks = playlists
  .filter((p) => selectedSources.includes(p.id))
  .reduce((sum, p) => sum + p.trackCount, 0)
// ↑ EXISTIERT BEREITS — nicht doppelt berechnen

// 4. onSubmit-Handler:
function handleSubmit() {
  setIsDialogOpen(true)
}

// 5. Dialog-Confirm-Handler:
function handleConfirm() {
  setIsDialogOpen(false)
  dispatch({ type: 'SET_PHASE', payload: 'creating' })
}

// 6. In der JSX — ConfirmDialog einbinden (NEBEN main, nicht drin):
return (
  <>
    <main className="max-w-6xl mx-auto p-6 md:p-8">
      {/* ... bestehender Content unverändert ... */}
      <div className="sticky bottom-0 md:static mt-6 -mx-6 md:mx-0 z-10">
        <Toolbar
          value={playlistName}
          onChange={(name) => dispatch({ type: 'SET_PLAYLIST_NAME', payload: name })}
          summary={summaryText}
          onSubmit={handleSubmit}  // ← GEÄNDERT: war () => {}
          disabled={isDisabled}
        />
      </div>
    </main>
    <ConfirmDialog
      isOpen={isDialogOpen}
      onConfirm={handleConfirm}
      onCancel={() => setIsDialogOpen(false)}
      playlistName={playlistName}
      sourceCount={selectedSources.length}
      excludeCount={selectedExcludes.length}
      estimatedTrackCount={estimatedTracks}
    />
  </>
)
```

**Warum Fragment statt einzelner main?** Der `Dialog`/`Drawer` nutzt ein Radix Portal und muss technisch nicht innerhalb von `<main>` liegen — Fragment ist sauber und verhindert Layout-Probleme.

---

### App.tsx-Anpassung — Placeholder für Phase `creating`

Minimal-Änderung: `case 'creating'` im Switch ergänzen:

```tsx
case 'creating':
  return (
    <>
      <AppHeader />
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" aria-hidden="true" />
        <p className="text-lg font-semibold text-gray-900">{state.playlistName}</p>
        <p className="text-sm text-gray-500">Erstelle Playlist…</p>
      </main>
    </>
  )
```

**Hinweis:** Dies ist ein bewusster Platzhalter. Die echte `CreationPhase`-Komponente mit 4-Schritt-Fortschrittsbalken, Track-Loading und API-Integration folgt in Story 3.3.

**`aria-busy`-Überlegung:** Optional `aria-live="polite"` auf die `<main>` setzen damit Screenreader die Zustandsänderung ankündigen.

---

### shadcn/ui Drawer — Installation & Struktur

```bash
yarn dlx shadcn@latest add drawer
```

Erzeugt: `src/components/ui/drawer.tsx`

**Abhängigkeit:** `vaul` (wird automatisch als `dependency` in `package.json` ergänzt)

**Drawer-Exports die wir brauchen:**
```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
```

**Drawer-Inhalt auf Mobile:**
```tsx
<Drawer open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
  <DrawerContent>
    <div className="p-4 pb-6">
      <DrawerHeader className="text-left px-0">
        <DrawerTitle>Playlist erstellen</DrawerTitle>
        <DrawerDescription>
          Überprüfe deine Auswahl, bevor die Playlist erstellt wird.
        </DrawerDescription>
      </DrawerHeader>
      {/* Gleicher dl-Block wie im Desktop-Dialog */}
      <div className="py-2 space-y-3">
        <p className="font-semibold text-base text-gray-900">{playlistName}</p>
        <dl className="space-y-1 text-sm text-gray-600">
          {/* ... */}
        </dl>
        <p className="text-xs text-gray-400">
          Die exakte Track-Anzahl wird nach der Diff-Berechnung ermittelt.
        </p>
      </div>
      <DrawerFooter className="px-0 gap-2">
        <Button onClick={onConfirm} className="bg-sky-600 hover:bg-sky-700 text-white w-full">
          <Plus className="h-4 w-4 mr-2" />
          Erstellen
        </Button>
        <DrawerClose asChild>
          <Button variant="outline" onClick={onCancel} className="w-full">Abbrechen</Button>
        </DrawerClose>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>
```

**Mobile-UX-Hinweis:** Auf Mobile zeigen die Buttons vertikal gestapelt — "Erstellen" oben (primäre Aktion), "Abbrechen" darunter. Das entspricht dem Bottom-Sheet-Pattern (primäre Aktion näher zum Daumen).

---

### Testing-Anforderungen

**Framework:** Vitest + @testing-library/react (jsdom) — wie in Stories 2.1–2.3

**Herausforderung:** `useMediaQuery` schlägt in jsdom-Tests fehl, da `window.matchMedia` nicht implementiert ist.

**Lösung:** `useMediaQuery` in Tests mocken:
```typescript
// In ConfirmDialog.test.tsx — am Anfang:
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn().mockReturnValue(true), // Desktop = true als Default
}))
```

**ConfirmDialog.test.tsx — Test-Cases:**
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { vi } from 'vitest'

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn().mockReturnValue(true), // Desktop
}))

const defaultProps = {
  isOpen: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  playlistName: 'Meine Playlist',
  sourceCount: 3,
  excludeCount: 1,
  estimatedTrackCount: 42,
}

test('Dialog zeigt Playlist-Namen', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText('Meine Playlist')).toBeInTheDocument()
})

test('Dialog zeigt Quellen-Anzahl', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText(/3 Playlisten/)).toBeInTheDocument()
})

test('Dialog zeigt geschätzte Tracks', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText(/~42 Tracks/)).toBeInTheDocument()
})

test('"Erstellen"-Button ruft onConfirm auf', async () => {
  const onConfirm = vi.fn()
  render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
  await userEvent.click(screen.getByRole('button', { name: /erstellen/i }))
  expect(onConfirm).toHaveBeenCalledOnce()
})

test('"Abbrechen"-Button ruft onCancel auf', async () => {
  const onCancel = vi.fn()
  render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
  await userEvent.click(screen.getByRole('button', { name: /abbrechen/i }))
  expect(onCancel).toHaveBeenCalledOnce()
})

test('Dialog nicht sichtbar wenn isOpen=false', () => {
  render(<ConfirmDialog {...defaultProps} isOpen={false} />)
  expect(screen.queryByText('Meine Playlist')).not.toBeInTheDocument()
})
```

**useMediaQuery.test.ts:** Optional, da sehr einfacher Hook. Kann übersprungen werden.

---

### Dateistruktur (Änderungen)

```
src/
  hooks/
    useMediaQuery.ts           ← NEU erstellen
  components/
    ConfirmDialog.tsx          ← NEU erstellen
    ConfirmDialog.test.tsx     ← NEU erstellen
    PlaylistColumns.tsx        ← ANPASSEN: isDialogOpen State, onSubmit-Handler, ConfirmDialog einbinden
  components/ui/
    drawer.tsx                 ← NEU via CLI: yarn dlx shadcn@latest add drawer
  App.tsx                     ← ANPASSEN: case 'creating' mit Placeholder-Screen ergänzen
```

**Nicht anfassen:**
- `src/context/appReducer.ts` — `SET_PHASE` und `'creating'` bereits vollständig
- `src/types/index.ts` — `AppPhase` enthält `'creating'` bereits
- `src/context/AppContext.tsx` — fertig
- `src/components/Toolbar.tsx` — Props unverändert (onSubmit wird jetzt mit echter Funktion versorgt)
- Alle anderen Komponenten und Hooks

---

### Anti-Pattern-Vermeidung

- **KEIN** `isDialogOpen` im globalen Reducer — das ist rein lokaler UI-State für `PlaylistColumns.tsx`
- **KEIN** `window.confirm()` — shadcn/ui `Dialog`/`Drawer` ist die korrekte Lösung
- **KEIN** `alert()` für Fehler oder Validierung
- **KEIN** `any` als TypeScript-Typ in der neuen Komponente
- **KEINE** Inline-Styles — nur Tailwind-Klassen
- **KEIN** direkter Phasen-Wechsel ohne Dialog (z.B. Toolbar onSubmit direkt zu `creating` → wäre falsch)
- **KEIN** State-Verlust beim Dialog-Abbrechen — Auswahlen bleiben erhalten (nur `setIsDialogOpen(false)`)
- **KEINE** Implementierung der echten Track-Loading-Logik in Story 2.4 — das ist Epic 3

---

### Vorherige Story Learnings (aus 2.1–2.3)

- CSS-Animationen gehen in `src/index.css` (nicht `App.css` — Projekt hat keine `App.css`)
- `AppContext` ist exportiert und kann direkt für Provider-Wrapping in Tests genutzt werden — aber `ConfirmDialog` braucht KEINEN Context-Wrap (rein props-basiert)
- `userEvent` aus `@testing-library/user-event` für Klick-Events in Tests
- shadcn/ui Komponenten über `@/components/ui/` importieren
- `vi.mock()` muss VOR dem `render()` stehen — in Vitest an den Anfang der Test-Datei
- Spinner via Tailwind-CSS: `animate-spin`, `border-t-transparent` für den Dreh-Effekt (kein separates Icon nötig)

### Git-Konvention

Commit-Format: `feat(story-2.4): Confirmation-Dialog vor der Erstellung`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (via Vertex AI)

### Debug Log References

- PlaylistColumns.test.tsx musste `vi.mock('@/hooks/useMediaQuery')` ergänzt werden, da die neu eingebundene ConfirmDialog-Komponente den Hook aufruft und `window.matchMedia` in jsdom nicht verfügbar ist.

### Completion Notes List

- `src/hooks/useMediaQuery.ts` — neuer Hook für responsive Breakpoint-Detection (min-width: 768px)
- `src/components/ConfirmDialog.tsx` — neue Komponente: Desktop via shadcn/ui Dialog, Mobile via shadcn/ui Drawer (Bottom Sheet)
- `src/components/ConfirmDialog.test.tsx` — 7 Tests: Anzeige von Name/Quellen/Ausschlüssen/Tracks, onConfirm/onCancel-Callbacks, Dialog hidden wenn isOpen=false
- `src/components/PlaylistColumns.tsx` — lokaler `isDialogOpen`-State, `handleSubmit`/`handleConfirm`-Handler, ConfirmDialog eingebunden (Fragment-Wrapper), `onSubmit={() => {}}` → `handleSubmit` ersetzt
- `src/components/PlaylistColumns.test.tsx` — `vi.mock('@/hooks/useMediaQuery')` ergänzt (Regression-Fix)
- `src/App.tsx` — `case 'creating'` mit Spinner-Placeholder-Screen ergänzt
- `src/components/ui/drawer.tsx` — via `yarn dlx shadcn@latest add drawer` installiert (inkl. `vaul`-Dependency)
- Alle 78 Tests grün, keine Regressionen

### File List

- src/hooks/useMediaQuery.ts (neu)
- src/components/ConfirmDialog.tsx (neu)
- src/components/ConfirmDialog.test.tsx (neu)
- src/components/PlaylistColumns.tsx (geändert)
- src/components/PlaylistColumns.test.tsx (geändert)
- src/App.tsx (geändert)
- src/components/ui/drawer.tsx (neu via CLI)
- package.json (geändert — vaul dependency)
- yarn.lock (geändert)

## Change Log

- 2026-03-25: Story erstellt — Confirmation-Dialog (shadcn/ui Dialog + Drawer), useMediaQuery-Hook, PlaylistColumns-Anbindung, Placeholder-Screen für Phase `creating`
- 2026-03-25: Story implementiert — alle Tasks abgeschlossen, 78 Tests grün, Status → review
