# Story 1.1: Projekt-Setup mit shadcn/ui CLI und Vitest

Status: ready-for-dev

## Story

Als Entwickler
möchte ich ein vollständig konfiguriertes Projekt-Grundgerüst,
damit ich sofort mit der Feature-Entwicklung beginnen kann ohne manuelle Konfigurationsarbeit.

## Acceptance Criteria

1. **Given** ein leeres Verzeichnis mit Node.js und yarn **When** `yarn dev` gestartet wird **Then** läuft die App fehlerfrei auf `localhost:5173`
2. **Given** das Projekt-Grundgerüst **When** `yarn test` ausgeführt wird **Then** läuft Vitest erfolgreich durch (mindestens ein Smoke-Test)
3. **Given** die Konfiguration **Then** sind Tailwind CSS v4.2, React, TypeScript, shadcn/ui und Pfad-Alias `@/` korrekt konfiguriert
4. **Given** shadcn/ui CLI **Then** sind Komponenten `checkbox`, `dialog`, `progress`, `input`, `button`, `badge`, `separator` installiert unter `src/components/ui/`
5. **Given** Umgebungsvariablen **Then** existiert `.env.local` mit Platzhalterwerten für `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI` (nicht committed)
6. **Given** Umgebungsvariablen **Then** existiert `.env.example` als Template ohne echte Secrets (committed)
7. **Given** die Projektstruktur **Then** entspricht sie exakt: `src/components/`, `src/components/ui/`, `src/hooks/`, `src/lib/`, `src/context/`, `src/types/`
8. **Given** Plus Jakarta Sans **Then** ist die Schrift via Fontsource installiert und als globaler Standard-Font in CSS konfiguriert

## Tasks / Subtasks

- [ ] Task 1: Projekt mit shadcn/ui CLI initialisieren (AC: 1, 3)
  - [ ] `yarn dlx shadcn@latest init -t vite` im Projekt-Root ausführen
  - [ ] Im CLI-Dialog: TypeScript, Tailwind CSS v4 (Vite Plugin), `@/` Alias, dark mode `class` wählen
  - [ ] Prüfen: `components.json`, `vite.config.ts`, `tsconfig.app.json` mit `@/`-Alias konfiguriert
  - [ ] Prüfen: `yarn dev` startet auf `localhost:5173` ohne Fehler

- [ ] Task 2: Vitest und Testing-Libraries installieren (AC: 2)
  - [ ] `yarn add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react`
  - [ ] `vitest.config.ts` erstellen mit `environment: 'jsdom'`, `globals: true`, `@/`-Alias, `setupFiles: ['./src/test/setup.ts']`, `plugins: [react()]`
  - [ ] `src/test/setup.ts` erstellen mit `import '@testing-library/jest-dom/vitest'` (Vitest-spezifisches Subpath für korrekte TypeScript-Typen)
  - [ ] `package.json` Scripts ergänzen: `"test": "vitest"`, `"test:run": "vitest run"`
  - [ ] Smoke-Test erstellen: `src/test/smoke.test.ts` mit trivialem `expect(true).toBe(true)`
  - [ ] Prüfen: `yarn test:run` läuft grün durch

- [ ] Task 3: shadcn/ui Komponenten installieren (AC: 4)
  - [ ] `yarn dlx shadcn@latest add checkbox dialog progress input button badge separator`
  - [ ] Prüfen: Alle 7 Komponenten unter `src/components/ui/` vorhanden

- [ ] Task 4: Weitere Abhängigkeiten installieren (AC: 3, 8)
  - [ ] `yarn add @fontsource/plus-jakarta-sans` — Schrift
  - [ ] `yarn add lucide-react` — Icons (im gesamten Projekt verwendet)
  - [ ] `yarn add framer-motion` — Layout-Animationen (Auswahl → Erstellungs-Phase, Epic 4)

- [ ] Task 5: Plus Jakarta Sans konfigurieren (AC: 8)
  - [ ] Import in `src/main.tsx` (nur benötigte Gewichte für kleinere Bundle-Size): `import '@fontsource/plus-jakarta-sans/400.css'` + `import '@fontsource/plus-jakarta-sans/500.css'` + `import '@fontsource/plus-jakarta-sans/600.css'` + `import '@fontsource/plus-jakarta-sans/700.css'`
  - [ ] In `src/index.css` (oder `src/App.css`): `font-family: 'Plus Jakarta Sans', sans-serif` als `body`-Default setzen
  - [ ] Tailwind-Konfiguration prüfen: shadcn/ui CSS Variable `--font-sans` auf Plus Jakarta Sans zeigen lassen (falls vorhanden)

- [ ] Task 6: Vollständige Projektstruktur anlegen (AC: 7)
  - [ ] `src/hooks/` — Verzeichnis anlegen
  - [ ] `src/lib/` — Verzeichnis anlegen
  - [ ] `src/context/` — Verzeichnis anlegen
  - [ ] `src/types/index.ts` — Leere Datei mit Kommentar `// Alle TypeScript-Typen des Projekts` anlegen
  - [ ] Hinweis: `src/components/ui/` wird durch shadcn/ui CLI automatisch angelegt

- [ ] Task 7: Umgebungsvariablen konfigurieren (AC: 5, 6)
  - [ ] `.env.local` erstellen (nicht committed, in `.gitignore` prüfen):
    ```
    VITE_SPOTIFY_CLIENT_ID=your_client_id_here
    VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
    ```
  - [ ] `.env.example` erstellen (committed, ohne echte Werte):
    ```
    VITE_SPOTIFY_CLIENT_ID=
    VITE_SPOTIFY_REDIRECT_URI=
    ```
  - [ ] Prüfen: `.env.local` steht in `.gitignore`

- [ ] Task 8: vite.config.ts für GitHub Pages vorbereiten (AC: 1)
  - [ ] `base: '/playlist-cutter/'` in `vite.config.ts` setzen — PFLICHT für GitHub Pages Deployment (Epic 4)
  - [ ] `@/`-Alias in `vite.config.ts` sicherstellen: `resolve: { alias: { '@': path.resolve(__dirname, './src') } }`

- [ ] Task 9: App.tsx bereinigen (AC: 1)
  - [ ] Von shadcn/ui CLI generierte Demo-Inhalte aus `App.tsx` entfernen
  - [ ] `App.tsx` auf Minimal-Stub reduzieren: `<div>Playlist Cutter</div>` reicht für diese Story
  - [ ] Nicht benötigte Demo-CSS-Klassen aus `App.css` / `index.css` entfernen

- [ ] Task 10: Abschluss-Verifikation (AC: 1–8)
  - [ ] `yarn dev` → keine Fehler, Browser zeigt einfachen Content
  - [ ] `yarn test:run` → alle Tests grün
  - [ ] `yarn build` → Build läuft ohne TypeScript-Fehler durch
  - [ ] Projektstruktur-Check: Alle 6 Verzeichnisse vorhanden, `src/types/index.ts` existiert

## Dev Notes

### Kritische Architektur-Entscheidungen für diese Story

**Starter-Wahl:** shadcn/ui CLI (nicht Vite CLI direkt) — liefert Vite + React + TypeScript + Tailwind CSS + shadcn/ui + `@/`-Alias in einem Kommando. Nur Vitest muss manuell ergänzt werden.

**Paketmanager:** `yarn` — NICHT `npm` oder `pnpm`. Alle Kommandos mit `yarn` / `yarn dlx`.

**Tailwind-Version:** v4.2 via Vite Plugin (`@tailwindcss/vite`) — wird durch shadcn/ui CLI automatisch konfiguriert. Keine `tailwind.config.js` wie in v3 nötig.

**GitHub Pages Base Path:** `base: '/playlist-cutter/'` in `vite.config.ts` MUSS in dieser Story gesetzt werden — sonst scheitert das Deployment in Epic 4 und alle relativen Pfade brechen.

**State Management kommt später:** Kein AppContext/Reducer in dieser Story. Nur Projektstruktur-Verzeichnisse anlegen.

### Technischer Stack (Versionen)

| Technologie | Version | Bemerkung |
|---|---|---|
| React | via Vite CLI | mit TypeScript |
| Vite | v8+ | Build-Tool |
| TypeScript | strict | kein `any` erlaubt |
| Tailwind CSS | v4.2 | via `@tailwindcss/vite` Plugin |
| shadcn/ui | latest | Radix UI Basis |
| Vitest | v4.1 | teilt Vite-Config |
| @testing-library/react | latest | Komponenten-Tests |
| jsdom | latest | Browser-Simulation |
| lucide-react | latest | Icons |
| framer-motion | latest | Layout-Animationen (ab Epic 4) |
| @fontsource/plus-jakarta-sans | latest | Standard-Font |

### vitest.config.ts — Pflichtinhalt

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Wichtig:**
- `plugins: [react()]` — notwendig für JSX-Transformation in Tests
- `globals: true` — `describe`, `it`, `expect` ohne Import verfügbar
- `setupFiles` → `src/test/setup.ts` für jest-dom Matchers

### src/test/setup.ts — Pflichtinhalt

```typescript
import '@testing-library/jest-dom/vitest'
```

**Wichtig:** `/vitest` Subpath (nicht einfach `@testing-library/jest-dom`) — augmentiert Vitests `expect`-Types korrekt, verhindert TypeScript-Konflikte mit Jest-Typen.

### Projektstruktur nach dieser Story (Pflicht)

```
src/
  components/
    ui/              ← shadcn/ui: checkbox, dialog, progress, input, button, badge, separator
  hooks/             ← leer (Hooks kommen ab Story 1.2)
  lib/               ← leer (API-Clients kommen ab Story 1.2)
  context/           ← leer (AppContext kommt ab Story 2.1 oder später)
  types/
    index.ts         ← Leere Datei mit Kommentar
  test/
    setup.ts         ← jest-dom Setup
    smoke.test.ts    ← Trivial-Test
  App.tsx            ← Minimal-Stub, keine Demo-Inhalte
  main.tsx           ← Mit Fontsource-Import
  index.css          ← Tailwind-Direktiven + body font-family
```

### Naming-Konventionen (für alle folgenden Stories)

- Komponenten-Dateien: PascalCase (`PlaylistRow.tsx`, `SuccessScreen.tsx`)
- Utilities/Services: camelCase (`spotifyApi.ts`, `diffEngine.ts`)
- Hooks: camelCase mit `use`-Prefix (`useAuth.ts`, `usePlaylistSelection.ts`)
- Tests: Co-located mit `.test.tsx`/`.test.ts` Suffix
- Typen: Alle in `src/types/index.ts`
- **Kein `I`-Prefix für Interfaces, kein `Type`-Suffix**
- **SCREAMING_SNAKE_CASE** für Reducer Actions und Konstanten

### Anti-Patterns — Verboten

- `any` als TypeScript-Type → stattdessen explizite Types oder `unknown`
- Inline-Styles statt Tailwind-Klassen
- `alert()` / `window.confirm()` für Nutzer-Feedback
- Direkter localStorage-Zugriff außerhalb `src/lib/auth.ts` (kommt in Story 1.2)
- `console.log` in Production-Code (nur `console.error` für echte Fehler)
- npm oder pnpm verwenden statt yarn

### Umgebungsvariablen-Muster (für Story 1.2+)

```typescript
// Zugriff auf Env-Variablen — NUR so
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
```

TypeScript-Typen für Vite Env in `vite-env.d.ts` (automatisch von shadcn/ui CLI):
```typescript
interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_SPOTIFY_REDIRECT_URI: string
}
```
→ Diese Felder manuell in `vite-env.d.ts` ergänzen falls nicht vorhanden.

### Scope dieser Story

**Diese Story endet mit:** Funktionierendem Grundgerüst, laufendem Dev-Server, laufenden Tests, korrekter Verzeichnisstruktur.

**Diese Story enthält NICHT:**
- OAuth/Auth-Logik (Story 1.2)
- Spotify API Client (Story 1.2+)
- AppContext/Reducer (Story 2.1 oder später)
- Irgendwelche echten UI-Komponenten außer App.tsx-Stub
- GitHub Actions Workflow (Epic 4, Story 4.1)

### Project Structure Notes

- Alignment: Struktur entspricht 1:1 dem Architecture-Dokument (Abschnitt "Complete Project Directory Structure")
- Einzige Ausnahme: `.github/workflows/deploy.yml` kommt in Epic 4 Story 4.1 — jetzt noch nicht anlegen
- `src/components/AppHeader.tsx`, `src/components/LoginScreen.tsx` etc. kommen in späteren Stories — NICHT in dieser Story vorab anlegen

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Begründung für shadcn/ui CLI als Starter
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming-Konventionen und Anti-Patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — Vollständige Verzeichnisstruktur
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — GitHub Pages base path Anforderung
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Acceptance Criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
