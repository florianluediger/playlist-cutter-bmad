---
project_name: 'playlist-cutter-bmad'
user_name: 'Flo'
date: '2026-03-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 55
optimized_for_llm: true
---

# Project Context für KI-Agenten

_Diese Datei enthält kritische Regeln und Muster, die KI-Agenten beim Implementieren von Code in diesem Projekt befolgen müssen. Fokus auf nicht-offensichtliche Details, die Agenten sonst übersehen könnten._

---

## Technology Stack & Versions

- **React** 19.2.4 — keine Legacy Class Components
- **TypeScript** 5.9.3 — strict mode via tsconfig.app.json
- **Vite** 8.0.1 — Build-Tool, Base-Path `/playlist-cutter-bmad/` (GitHub Pages)
- **Tailwind CSS** 4.2.2 — via `@tailwindcss/vite` Plugin (KEIN PostCSS-Setup)
- **Vitest** 4.1.1 + jsdom 29.0.1 — Test-Runner
- **Framer Motion** 12.38.0 — Animationen
- **Radix UI** 1.4.3 + shadcn 4.1.0 — UI-Komponenten
- **class-variance-authority** 0.7.1 + clsx 2.1.1 + tailwind-merge 3.5.0 — Styling-Utilities
- **Paketmanager**: Yarn (nicht npm)
- **Path-Alias**: `@/` → `./src/`
- **ESM-Modul**: `"type": "module"` in package.json

## Critical Implementation Rules

### Sprach-spezifische Regeln (TypeScript)

- **Named Exports überall** — kein `export default` außer in `App.tsx` und `main.tsx`
- **Imports immer via `@/`** — niemals relative Pfade mit `../` aus `src/`
- **Keine `any`-Typen** — unbekannte Fehler werden als `unknown` getypt, dann mit `instanceof Error` geprüft
- **Fehlerformat**: `throw new Error('Spotify API Fehler: 401')` — Statuscode als String im Message
- **Async/Await statt `.then()`-Chains** — in internen Funktionen; `.then().catch()` nur in useEffect-Callbacks
- **Cancel-Pattern in useEffect**: immer `let cancelled = false` + `return () => { cancelled = true }` bei async Operationen
- **`eslint-disable-next-line react-hooks/exhaustive-deps`** ist erlaubt bei bewusst eingeschränkten Dependencies in useEffect
- **Alle Typen in `src/types/index.ts`** — kein lokales Interface-Definieren in Komponenten oder Libs

### Framework-Regeln (React)

- **State Management**: `useReducer` + Context — kein Redux, kein Zustand, kein useState für App-State
- **AppPhase-State-Machine**: Phasen-Übergänge NUR via `dispatch({ type: 'SET_PHASE' })` — niemals direkt
- **Erlaubte Phasen**: `'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error' | 'session-expired'`
- **AppProvider**: Muss Root-Wrapper sein — `useAppContext()` wirft Error wenn außerhalb verwendet
- **Keine lokalen States für Business-Logic** — nur für UI-State (z.B. Focus, Hover)
- **AnimatePresence mit `key={state.phase}`** — jede Phase bekommt eigenen Framer-Motion-Wrapper
- **Animationsdefaults**: `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -8 }}`, `transition={{ duration: 0.2, ease: 'easeInOut' }}`
- **Auth-Fehler 401/403**: Immer → `handleAuthError()` (session-expired Flow), nie → generischer Error-Screen
- **useRef für one-shot Flags**: z.B. `callbackHandled.current`, `playlistsLoaded.current` — verhindert doppelte Ausführung in Strict Mode

### Testing-Regeln

- **Test-Framework**: Vitest + `@testing-library/react` + `@testing-library/user-event`
- **Test-Dateien**: Neben der Quelldatei — `ComponentName.test.tsx` oder `libName.test.ts`
- **Test-Setup**: `src/test/setup.ts` — importiert `@testing-library/jest-dom/vitest`
- **localStorage/sessionStorage**: NICHT nativ verwenden — jsdom 29 implementiert es unvollständig. Setup mockt beide global via `vi.stubGlobal()`
- **`userEvent.setup()`** vor jedem Interaktionstest aufrufen — nicht `fireEvent` verwenden
- **Keine API-Mocks über MSW** — stattdessen `vi.fn()` direkt auf Modul-Exports
- **Komponenten-Tests**: Immer über öffentliche Schnittstelle testen (aria-Attribute, sichtbarer Text) — keine internen State-Checks
- **Test-Sprache**: Deutsch — Beschreibungen in `describe`/`it` auf Deutsch
- **globals: true** in vitest.config — `describe`, `it`, `expect`, `vi` ohne Import verfügbar (aber expliziter Import ist auch OK)

### Code-Qualität & Style-Regeln

- **Tailwind v4-Syntax**: Utility-Klassen direkt, kein `@apply` in CSS-Dateien — Tailwind wird via Vite-Plugin eingebunden
- **`cn()` Helper** aus `src/lib/utils.ts` für bedingte Klassen-Kombinationen (clsx + tailwind-merge)
- **Kein direktes `className` mit Strings konkatenieren** — immer `cn()` verwenden wenn Klassen kombiniert werden
- **Spacing/Layout**: Tailwind-Klassen bevorzugen — kein Inline-Style außer für dynamische Werte
- **Komponenten-Struktur**: Props-Interface direkt über der Funktion, kein separater `type Props = ...` Export
- **Kommentare**: Auf Deutsch — Code-Kommentare im Projekt sind durchgehend Deutsch
- **Keine Default-Exports** in Bibliotheks-Dateien (`src/lib/`, `src/hooks/`, `src/context/`)
- **shadcn-Komponenten**: In `src/components/ui/` — nicht modifizieren, nur konsumieren
- **ESLint**: `eslint.config.js` mit `typescript-eslint` und `react-hooks` Plugin — alle Warnungen beheben

### Development-Workflow-Regeln

- **Paketmanager**: Yarn — niemals `npm install` oder `npx` verwenden; immer `yarn add` / `yarn dlx`
- **Dev-Server**: `yarn dev` — läuft auf `127.0.0.1` (nicht `localhost`), gesetzt in vite.config.ts
- **Build**: `yarn build` — führt `tsc -b && vite build` aus; TypeScript-Fehler blockieren den Build
- **Tests**: `yarn test` (watch) oder `yarn test:run` (einmalig)
- **GitHub Pages Deployment**: Base-Path `/playlist-cutter-bmad/` — alle Asset-Referenzen müssen relativ sein
- **Umgebungsvariablen**: `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` — via `import.meta.env.VITE_*` abrufen
- **Kein `.env`-File im Repo** — Secrets nur über CI/CD-Secrets oder lokale `.env.local`
- **Commit-Konvention**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)

### Kritische Anti-Patterns & Sicherheitsregeln

- **Token NIE im State oder Props übergeben** — immer via `loadToken()` aus `src/lib/auth.ts` direkt abrufen
- **localStorage-Zugriff NUR in `src/lib/auth.ts`** — kein direkter `localStorage`-Zugriff in Komponenten, Hooks oder anderen Libs
- **spotifyApi.ts ist Single-Responsibility** — keine UI-Logik, kein State-Zugriff, nur HTTP-Calls
- **Spotify API `next`-URL**: IMMER via `new URL(data.next)` parsen und nur `pathname + search` verwenden — niemals die vollständige URL an `spotifyFetch` übergeben
- **Leere Diff-Menge abfangen**: Wenn `calculateDiff()` leeres Array zurückgibt → Error-Phase, nicht Playlist erstellen
- **Playlist erstellt aber Track-Add fehlgeschlagen**: Separate Fehlermeldung mit URL der leeren Playlist — nicht generischer Error
- **`AbortSignal.timeout(10_000)`** bei allen Spotify-Fetch-Calls — kein unbegrenztes Warten
- **Concurrency-Limit**: `runWithConcurrency(tasks, 5)` — nie alle Playlist-Track-Requests gleichzeitig senden
- **PKCE-Verifier in sessionStorage** (nicht localStorage) — wird nach Token-Exchange gelöscht
- **Keine `console.log`-Statements** im committed Code

---

## Usage Guidelines

**Für KI-Agenten:**

- Diese Datei vor jeder Code-Implementierung lesen
- ALLE Regeln exakt wie dokumentiert befolgen
- Im Zweifel die restriktivere Option wählen
- Datei aktualisieren wenn neue Muster entstehen

**Für Menschen:**

- Datei schlank und auf Agenten-Bedürfnisse fokussiert halten
- Bei Tech-Stack-Änderungen aktualisieren
- Regeln entfernen, die mit der Zeit offensichtlich werden

_Zuletzt aktualisiert: 2026-03-27_
