# Story 4.2: Framer Motion Phasen-Übergänge & Mobile-Layout finalisieren

Status: done

## Story

Als Nutzer
möchte ich fließende Übergänge zwischen den App-Phasen und ein vollständig nutzbares Mobile-Layout,
damit die App sich durchdacht und poliert anfühlt auf allen Geräten.

## Acceptance Criteria

1. **Given** der Nutzer bestätigt "Erstellen" im Confirmation-Dialog
   **When** die App von Phase `selection` zu `creating` wechselt
   **Then** animiert Framer Motion `AnimatePresence` das Zwei-Spalten-Layout heraus und die `CreationPhase` herein
   **And** die Animation blockiert keine Interaktionen und läuft parallel zur Funktionsausführung

2. **Given** der Nutzer befindet sich auf einem Gerät mit Viewport < 768px
   **When** er die App öffnet
   **Then** sind Quellen-Spalte und Ausschlüsse-Spalte vertikal gestapelt (Quellen oben, Ausschlüsse darunter)
   **And** die Toolbar ist als `sticky bottom-0` Footer fixiert (Mobile) statt oberhalb (Desktop)
   **And** alle Features sind vollständig nutzbar — kein Funktionsverlust gegenüber Desktop

3. **Given** der Nutzer auf Mobile den "Erstellen"-Button klickt
   **When** der Confirmation-Dialog öffnet
   **Then** erscheint er als Bottom Sheet (`shadcn/ui Drawer`) — ergonomisch mit dem Daumen erreichbar

## Aktueller Implementierungsstand — KRITISCH LESEN!

**⚠️ AC2 und AC3 sind bereits vollständig implementiert!** Prüfe dies zuerst, bevor du Code schreibst.

### AC2 — bereits erledigt in `src/components/PlaylistColumns.tsx`

- `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">` → vertikales Stacking auf Mobile ✓
- `<div className="sticky bottom-0 md:static mt-6 -mx-6 md:mx-0 z-10">` → Sticky-Footer auf Mobile ✓

### AC3 — bereits erledigt in `src/components/ConfirmDialog.tsx`

- `useMediaQuery('(min-width: 768px)')` → isDesktop-Flag ✓
- Desktop → `shadcn/ui Dialog`, Mobile → `shadcn/ui Drawer` (vaul) ✓

**Die einzige fehlende Implementierung ist AC1 (Framer Motion Phasen-Animationen).**

Validiere dies zu Beginn durch Lesen der aktuellen Dateien. Falls die Dateien wider Erwarten
keinen dieser Codes enthalten, implementiere sie ebenfalls.

## Tasks / Subtasks

- [x] Task 1: framer-motion in `App.tsx` integrieren (AC: 1)
  - [x] `AnimatePresence` und `motion` aus `framer-motion` importieren
  - [x] `AppContent` render-Logik umstrukturieren: Phasen-Content in `<motion.div key={state.phase}>` wickeln
  - [x] `AnimatePresence mode="wait"` über den phasen-spezifischen Content legen
  - [x] Animations-Varianten definieren: `initial`, `animate`, `exit`, `transition`
  - [x] Sicherstellen dass `AppHeader` AUSSERHALB der AnimatePresence bleibt (kein Flackern)
  - [x] Sicherstellen dass keine Interaktionen blockiert werden (kein `pointer-events: none` während Animation)

- [x] Task 2: Animations-Qualität sicherstellen (AC: 1)
  - [x] Transition-Dauer ≤ 250ms (UX-Spezifikation: subtil, nicht ablenkend) — duration: 0.2 (200ms)
  - [x] `mode="wait"` sicherstellen: Exit läuft ab, bevor Enter beginnt (kein Layout-Clash)
  - [x] Manuell testen: selection → creating → success-/error-Übergang

- [x] Task 3: AC2 + AC3 verifizieren (AC: 2, 3)
  - [x] Prüfen ob `PlaylistColumns.tsx` die Grid- und Sticky-Klassen bereits hat (dann kein Code nötig)
  - [x] Prüfen ob `ConfirmDialog.tsx` bereits Drawer/Dialog-Switch hat (dann kein Code nötig)
  - [x] Falls ein AC doch fehlt: implementieren analog zu Dev Notes

- [x] Task 4: Tests schreiben (AC: 1)
  - [x] `framer-motion` in Vitest mocken (siehe Dev Notes)
  - [x] Test: Phase-Wechsel rendert den neuen Phasen-Content
  - [x] Test: AnimatePresence-Motion-Wrapper hat den richtigen `key` (state.phase)

## Dev Notes

### Framer Motion v12 — was zu wissen ist

Framer Motion v12.38.0 ist in `package.json` eingetragen und bereits installiert. **Kein `yarn add` nötig.**

Für Phase-Animationen in React ist der Standardansatz:

```tsx
import { AnimatePresence, motion } from 'framer-motion'

// Innerhalb AppContent — AppHeader AUSSERHALB der AnimatePresence lassen:
<AnimatePresence mode="wait">
  <motion.div
    key={state.phase}           // Pflicht: wechselt bei jedem Phasen-Wechsel
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
  >
    {/* phase-spezifischer Content */}
  </motion.div>
</AnimatePresence>
```

**Wichtig für App.tsx-Struktur:** Der aktuelle switch-Statement gibt JSX mit `<AppHeader />` + Content zurück. Die `AppHeader`-Komponente soll NICHT animiert werden. Refaktoriere so, dass `AppHeader` fest im Root bleibt und nur der Content-Bereich animiert wird.

Empfohlene Struktur nach dem Refactoring:

```tsx
function AppContent() {
  // ... useEffect-Logik unverändert ...

  const phaseContent = (() => {
    switch (state.phase) {
      case 'login': return <LoginScreen />
      case 'session-expired': return <SessionExpiredScreen />
      case 'loading':
      case 'selection': return <PlaylistColumns />
      case 'creating': return <CreationPhase />
      case 'success': return <SuccessScreen />
      case 'error': return <ErrorState />
      default: return <div>Playlisten werden geladen…</div>
    }
  })()

  const showHeader = state.phase !== 'login' && state.phase !== 'session-expired'

  return (
    <>
      {showHeader && <AppHeader />}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {phaseContent}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
```

**Alternativ (minimal-invasiv):** Wenn das Refactoring den Switch zu stark ändert, kann auch nur der selection→creating-Übergang gezielt animiert werden. Aber die obige Lösung ist sauberer.

### framer-motion in Vitest mocken

framer-motion rendert Motion-Komponenten mit echten DOM-Animationen, die in jsdom-Tests problematisch sein können. Standard-Mock:

```ts
// In jedem Test, der App.tsx oder Komponenten mit motion rendert:
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}))
```

Falls schon ein globaler Mock in `src/test/setup.ts` existiert, prüfe das zuerst. Andernfalls mock lokal in den betroffenen Test-Dateien.

### Mobile-Layout — Referenz-Implementierung (bereits vorhanden)

Falls du siehst, dass AC2/AC3 fehlen, hier die exakten Patterns:

**PlaylistColumns.tsx — Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

**PlaylistColumns.tsx — Sticky Toolbar:**
```tsx
<div className="sticky bottom-0 md:static mt-6 -mx-6 md:mx-0 z-10">
  <Toolbar ... />
</div>
```

**ConfirmDialog.tsx — Desktop vs. Mobile:**
```tsx
const isDesktop = useMediaQuery('(min-width: 768px)')
if (isDesktop) {
  return <Dialog ...> ... </Dialog>
}
return <Drawer ...> ... </Drawer>
```

### Animations-Design-Richtlinien (UX-Spec)

Aus `ux-design-specification.md`:
- Übergänge: subtil, nicht ablenkend, maximal 250ms
- Micro-interactions: unterstützen den Flow ohne den Nutzer aufzuhalten
- Gefühl: "durchdacht und poliert"
- Keine Animationen die Interaktionen blockieren

### Bestehende Bibliotheken — keine neuen installieren

| Bibliothek | Version | Zweck |
|------------|---------|-------|
| framer-motion | ^12.38.0 | Phase-Animationen |
| vaul | ^1.1.2 | Drawer (Basis für shadcn/ui Drawer) |
| radix-ui | ^1.4.3 | Dialog und weitere UI-Primitives |

### Tech-Stack (Überblick)

- React 19 + Vite 8 + TypeScript ~5.9
- Tailwind CSS v4.2 (kein tailwind.config.ts — Konfiguration in `index.css`)
- shadcn/ui Komponenten in `src/components/ui/`
- Testing: Vitest 4 + @testing-library/react 16 + jsdom
- Package Manager: **Yarn** (nicht npm)

### Project Structure Notes

**Relevante Dateien für diese Story:**

| Datei | Änderung |
|-------|---------|
| `src/App.tsx` | AnimatePresence + motion.div für Phasen-Übergänge |
| `src/components/PlaylistColumns.tsx` | Wahrscheinlich keine Änderung nötig (AC2 bereits implementiert) |
| `src/components/ConfirmDialog.tsx` | Wahrscheinlich keine Änderung nötig (AC3 bereits implementiert) |
| ggf. neue Test-Datei für App.tsx oder bestehende anpassen | framer-motion mocken |

**Keine neuen Dateien oder Ordner anlegen** — alle Änderungen innerhalb bestehender Dateien.

### Naming Conventions (Architektur)

- Komponenten: PascalCase (`AppContent`, `PlaylistColumns`)
- Hooks: camelCase mit `use`-Prefix (`useMediaQuery`)
- Utility-Funktionen: camelCase
- CSS-Klassen: Tailwind utility classes

### Bekannte Stolpersteine

1. **`key` auf `motion.div` ist Pflicht:** Ohne `key={state.phase}` erkennt AnimatePresence keinen Wechsel
2. **`mode="wait"` vs. `mode="sync"`:** `wait` ist sicherer — Exit läuft komplett ab, bevor Enter startet. Verhindert Layout-Überlappungen.
3. **`AppHeader` nicht animieren:** Header soll durchgehend sichtbar bleiben — kein Flackern
4. **`loading` + `selection` können denselben Content rendern** (`PlaylistColumns`). Mit key={state.phase} gibt es dann einen Übergang auch beim loading→selection-Wechsel, was gewünscht ist.
5. **Tailwind CSS v4:** Verwendet keine `tailwind.config.ts`. Custom CSS-Variablen sind in `src/index.css`.

### References

- [Framer Motion AnimatePresence Docs](https://www.framer.com/motion/animate-presence/)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Micro-interactions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Tech Stack]
- [Source: src/App.tsx] — aktuelle Phasen-Switch-Logik
- [Source: src/components/PlaylistColumns.tsx] — AC2 Referenz
- [Source: src/components/ConfirmDialog.tsx] — AC3 Referenz

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (via BMad create-story workflow)

### Debug Log References

(keine Blocker — Implementierung war geradlinig)

### Completion Notes List

- Task 1+2: `App.tsx` auf `AnimatePresence mode="wait"` + `motion.div key={state.phase}` umgestellt. `AppHeader` bleibt außerhalb der AnimatePresence (kein Flackern). Transition: opacity + y-Offset, duration 200ms (≤ 250ms UX-Spec).
- Task 3: AC2 und AC3 waren bereits vollständig implementiert — `PlaylistColumns.tsx` (grid, sticky toolbar) und `ConfirmDialog.tsx` (useMediaQuery, Dialog/Drawer-Switch) unverändert.
- Task 4: `src/App.test.tsx` neu erstellt — 10 Tests für Phasen-Rendering mit framer-motion-Mock und kontrolliertem AppContext. Alle 139 Tests (16 Dateien) grün.

### File List

- src/App.tsx (geändert — AnimatePresence + motion.div Phasen-Animationen)
- src/App.test.tsx (neu — 10 Tests für Phasen-Content und Animation-Wrapper)

## Change Log

- 2026-03-26: Framer Motion AnimatePresence für Phasen-Übergänge in App.tsx integriert. App.test.tsx neu erstellt (10 Tests). AC2+AC3 als bereits implementiert verifiziert — keine weiteren Codeänderungen nötig.
