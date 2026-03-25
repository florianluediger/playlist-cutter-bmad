---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-23'
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'architecture'
project_name: 'playlist-cutter-bmad'
user_name: 'Flo'
date: '2026-03-23'
---

# Architecture Decision Document

_Dieses Dokument wird kollaborativ durch schrittweise Entdeckung aufgebaut. Abschnitte werden hinzugefügt, während wir gemeinsam architektonische Entscheidungen treffen._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
22 FRs in 5 Kategorien:
- **Authentifizierung & Session (FR1-FR4):** OAuth 2.0 PKCE-Flow, Logout, Session-Persistenz (localStorage), Token-Ablauf-Erkennung
- **Playlist-Verwaltung & Auswahl (FR5-FR9):** Zwei-Spalten-Layout mit Checkbox-Auswahl, Empty State, Duplikat-Warnung (gleiche Playlist in beiden Spalten)
- **Diff-Berechnung (FR10-FR13):** Paralleles Laden aller Tracks, Differenzmenge per Track-ID, Deduplizierung über Quell-Playlisten hinweg
- **Playlist-Erstellung (FR14-FR18):** Namenseingabe, Confirmation-Dialog, Spotify API Playlist-Erstellung, Validierung (leere Differenz, keine Quellen)
- **Fortschritt & Feedback (FR19-FR22):** Fortschrittsbalken, 10s Timeout-Erkennung, Erfolgs-/Fehlermeldungen mit Handlungsempfehlungen

**Non-Functional Requirements:**
- **Performance:** Playlisten-Liste < 3s, parallele API-Calls, 10s Timeout, UI bleibt responsiv
- **Sicherheit:** Token nur in localStorage, kein Drittanbieter-Transfer, HTTPS-only, keine serverseitige Komponente
- **Accessibility:** Keyboard-Navigation, WCAG AA Kontraste (4.5:1), ARIA-Attribute, semantisches HTML
- **Integration:** Spotify Web API Pagination (max. 100/Call), OAuth PKCE gemäß Spotify Developer Guidelines, Graceful Degradation

**Scale & Complexity:**
- Primäre Domäne: Web (Client-Side SPA)
- Komplexitätslevel: Niedrig bis Mittel
- Geschätzte architektonische Komponenten: ~8-10 (Auth-Modul, API-Client, State Management, Diff-Engine, UI-Komponenten, Error Handling, Progress Tracking, Layout-Phasen-Manager)

### Technical Constraints & Dependencies

- **Keine serverseitige Infrastruktur** — alles läuft im Browser; Secrets können nicht serverseitig geschützt werden
- **Spotify Web API als einzige externe Abhängigkeit** — Rate Limits, Pagination, Token-Lifecycle bestimmen die API-Schicht
- **OAuth PKCE** — erfordert korrektes Handling von Authorization Code, Code Verifier/Challenge, Token-Exchange und Redirect
- **Browser-Only Storage** — localStorage für Token-Persistenz; kein sicherer Server-Side-Session-Store verfügbar
- **Tech-Stack festgelegt durch UX-Spec:** React + Vite + Tailwind CSS + shadcn/ui (Radix UI) + Lucide Icons + Plus Jakarta Sans
- **Spotify Developer App** — Registrierte App mit Client ID und Redirect URIs ist Voraussetzung; OAuth-Scopes (`playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`) bestimmen den Consent-Screen
- **Deployment-Plattform** — Als pure Frontend-SPA benötigt die App ein Static Hosting mit HTTPS (z.B. Vercel, Netlify, GitHub Pages); Redirect URI muss zur Deployment-URL passen
- **Internes Datenmodell** — Architektonische Entscheidung über die interne Repräsentation von Playlisten und Tracks (welche Felder aus der Spotify API werden verwendet und wie transformiert)

### Cross-Cutting Concerns Identified

- **OAuth Token Lifecycle:** Token-Beschaffung, -Speicherung, -Ablauf-Erkennung und Re-Auth durchziehen Auth-Modul, API-Client und UI-Feedback
- **Error Handling & User Feedback:** Einheitliche Fehlerstrategie (API-Fehler, Timeouts, abgelaufene Tokens) mit nutzerfreundlichen Meldungen über alle Phasen hinweg
- **API-Pagination-Management:** Alle Spotify-Endpunkte paginieren bei 100 Items; paralleles Laden und Fortschrittsberechnung betreffen API-Client und Progress-Tracking gleichermaßen
- **Phasen-Management (State Machine):** Die App-Phasen (Login → Auswahl → Bestätigung → Erstellung → Erfolg → Fehler) sind ein zentrales Konzept, das Layout, Interaktion und Feedback steuert
- **State Management:** Die App-Zustandsmaschine (6 Phasen) plus Auswahl-State, geladene Playlisten/Tracks und API-Status erfordern eine bewusste State-Management-Entscheidung (React Context vs. dedizierte State-Library)
- **Concurrent Request Management:** Parallele API-Calls mit Token-Ablauf-Handling, Abbruchmöglichkeit und Fortschrittsaggregation über mehrere gleichzeitige Requests
- **Testbarkeit:** Vollständige Abhängigkeit von Spotify API erfordert eine Strategie für lokales Entwickeln und Testen (API-Mocking, Test-Accounts)

## Starter Template Evaluation

### Primary Technology Domain

Web Application (Client-Side SPA) basierend auf der Projektanforderungsanalyse — keine serverseitige Komponente, reines Frontend.

### Technische Präferenzen

| Entscheidung | Wahl |
|---|---|
| Sprache | TypeScript |
| Framework | React + Vite |
| Styling | Tailwind CSS v4.2 |
| Komponenten-Bibliothek | shadcn/ui (Radix UI) |
| Icons | Lucide Icons |
| Font | Plus Jakarta Sans (Fontsource) |
| Testing | Vitest v4.1 |
| Deployment | GitHub Pages |
| Paketmanager | yarn |

### Starter Options Considered

**Option A: Vite CLI (`yarn create vite --template react-ts`)**
- Liefert: Vite v8, React, TypeScript, ESLint-Konfiguration, HMR
- Fehlt: Tailwind CSS, shadcn/ui, Pfad-Aliase, Testing
- Vorteil: Maximale Kontrolle über jede Konfigurationsentscheidung
- Nachteil: Mehrere manuelle Setup-Schritte für Tailwind, shadcn/ui, Vitest

**Option B: shadcn/ui CLI (`yarn dlx shadcn@latest init -t vite`)**
- Liefert: Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Pfad-Aliase (`@/`) + CSS Variables für Theming + Radix UI Basis
- Fehlt: Vitest (muss ergänzt werden)
- Vorteil: One-Command-Setup für den gesamten UI-Stack; folgt shadcn/ui Best Practices
- Nachteil: Weniger transparente Konfiguration beim ersten Mal

### Selected Starter: shadcn/ui CLI (Option B)

**Rationale für die Auswahl:**
- Liefert 80% des benötigten Stacks in einem Kommando
- Pfad-Aliase (`@/components`, `@/lib`) sind korrekt konfiguriert
- Tailwind CSS Integration ist optimiert für shadcn/ui Theming (CSS Variables)
- Radix UI Accessibility-Primitives sind sofort verfügbar
- Nur Vitest muss manuell ergänzt werden — ein einzelner, gut dokumentierter Schritt

**Initialisierungs-Kommandos:**

```bash
# 1. Projekt mit shadcn/ui CLI scaffolden
yarn dlx shadcn@latest init -t vite

# 2. Vitest für Testing hinzufügen
yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# 3. Benötigte shadcn/ui Komponenten installieren
yarn dlx shadcn@latest add checkbox dialog progress input button badge separator
```

**Architektonische Entscheidungen durch den Starter:**

**Language & Runtime:**
- TypeScript mit strikter Konfiguration
- Vite v8 als Build-Tool und Dev-Server
- SWC oder esbuild für schnelle Transpilation

**Styling Solution:**
- Tailwind CSS v4.2 via Vite Plugin (`@tailwindcss/vite`)
- CSS Variables für shadcn/ui Theming (Farben, Radien, Spacing)
- `@/` Pfad-Alias für saubere Imports

**Build Tooling:**
- Vite v8 mit optimiertem Production Build (Tree-Shaking, Code-Splitting)
- GitHub Pages Deployment via `vite build` + Static Files

**Testing Framework:**
- Vitest v4.1 (manuell ergänzt) — teilt Vite-Konfiguration, Aliase und Plugins
- @testing-library/react für Komponenten-Tests
- jsdom als Browser-Umgebung für Tests

**Code Organization:**
- `src/components/ui/` — shadcn/ui Basis-Komponenten
- `src/components/` — Custom Komponenten (PlaylistRow, Toolbar, etc.)
- `src/lib/` — Utilities und Helper
- Pfad-Aliase: `@/components`, `@/lib`

**Development Experience:**
- Vite HMR (Hot Module Replacement) für sofortiges Feedback
- TypeScript-Fehler im Editor und Build
- Vitest Watch-Mode für kontinuierliches Testing

**Note:** Projektinitialisierung mit diesen Kommandos sollte die erste Implementation-Story sein.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- State Management: React Context + useReducer
- OAuth: Eigene PKCE-Implementierung, reaktiver Token-Ablauf
- API-Client: Einzelnes Modul, `Promise.all` mit begrenzter Parallelität
- Deployment: GitHub Pages via GitHub Actions

**Important Decisions (Shape Architecture):**
- Datenmodell: Minimalistisch (nur benötigte Felder)
- Animationen: CSS Transitions + Framer Motion für Layout-Transformation
- Environment: Vite Env Variables für Client ID + Redirect URI

**Deferred Decisions (Post-MVP):**
- Rate-Limit-Handling (PRD Phase 2)
- Caching-Strategie für Playlisten-Liste
- Fuzzy Matching als Alternative zur Track-ID-Deduplizierung (PRD Phase 3)

### Data Architecture

| Entscheidung | Wahl | Rationale |
|---|---|---|
| Internes Datenmodell | Minimalistisch | Nur `{ id, name, trackCount }` für Playlisten, `{ id }` für Tracks — reicht für Diff-Berechnung und Anzeige |
| Client-Side Storage | Nur Auth-Token | Access Token + Ablaufzeit in localStorage; Playlisten werden bei jedem App-Start frisch geladen — vermeidet Cache-Invalidierungskomplexität |

### Authentication & Security

| Entscheidung | Wahl | Rationale |
|---|---|---|
| OAuth-Implementierung | Eigene PKCE-Implementierung | ~100-150 Zeilen, volle Kontrolle über den Flow, keine externe Dependency; PKCE-Flow ist gut dokumentiert |
| Token-Ablauf-Strategie | Reaktiv | Bei 401-Response "Sitzung abgelaufen"-Meldung mit 1-Klick Re-Login; entspricht PRD FR4 |
| Token-Speicherung | localStorage | Access Token + Ablaufzeit; kein Refresh Token nötig bei reaktivem Ansatz |

### API & Communication Patterns

| Entscheidung | Wahl | Rationale |
|---|---|---|
| API-Client-Struktur | Einzelnes API-Modul (`spotifyApi.ts`) | 4-5 Endpunkte rechtfertigen keine Schichtung; Auth-Header und Fehlerbehandlung via interner Helper-Funktion |
| Parallele Requests | `Promise.all` mit begrenzter Parallelität | `Promise.all` weil ein Einzelfehler die Diff-Berechnung ungültig macht; begrenzte Parallelität (z.B. max. 5 gleichzeitig) schützt vor Spotify Rate Limits |
| Pagination | Automatisches Durchlaufen aller Pages | Spotify liefert max. 100 Items/Call; API-Modul iteriert automatisch bis `next === null` |

### Frontend Architecture

| Entscheidung | Wahl | Rationale |
|---|---|---|
| State Management | React Context + useReducer | Eingebaute React-Lösung, kein Extra-Dependency; Reducer bildet die 6-Phasen-Zustandsmaschine natürlich ab |
| Routing | Kein Router | App hat keine Navigation; OAuth-Callback über URL-Parameter auf der Hauptseite; Phasen-Wechsel durch State |
| Animationen | CSS Transitions + Framer Motion (nur Layout-Transformation) | Micro-Interactions (Checkbox-Pop, Badge-Bounce, Button-Ripple) via CSS; Framer Motion `AnimatePresence` nur für den Phasen-Übergang Auswahl → Erstellung |

### Infrastructure & Deployment

| Entscheidung | Wahl | Rationale |
|---|---|---|
| Hosting | GitHub Pages | Kostenlos, HTTPS out of the box, passt zum GitHub-Workflow |
| CI/CD | GitHub Actions | Automatisches Build + Deploy bei Push auf `main`; `vite build` → `gh-pages` Branch |
| Environment-Konfiguration | Vite Env Variables | `VITE_SPOTIFY_CLIENT_ID` + `VITE_SPOTIFY_REDIRECT_URI` in `.env`; unterschiedliche Werte für lokal vs. Production; GitHub Actions Repository Secrets |

### Decision Impact Analysis

**Implementation Sequence:**
1. Projekt-Setup (Starter + Env Variables)
2. OAuth PKCE-Flow + Token-Management
3. API-Modul (Playlisten laden, Tracks laden, Playlist erstellen)
4. State Management (Context + Reducer für Phasen-Maschine)
5. UI-Komponenten (Zwei-Spalten-Layout, PlaylistRow, Toolbar)
6. Diff-Engine (Track-ID-Deduplizierung + Differenzmenge)
7. Erstellungs-Flow (Confirmation → Progress → Erfolg/Fehler)
8. Animationen + Polish
9. GitHub Actions Deployment Pipeline

**Cross-Component Dependencies:**
- OAuth-Modul → API-Modul (Token-Injection)
- API-Modul → State Management (Daten-Loading + Fehler-Propagation)
- State Management → UI-Komponenten (Phasen-Rendering)
- Diff-Engine → API-Modul (Track-Daten) + State (Auswahl)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Kritische Konfliktpunkte identifiziert:** 4 Bereiche wo AI-Agenten unterschiedliche Entscheidungen treffen könnten

### Naming Patterns

**Datei-Naming:**
- Komponenten: PascalCase (`PlaylistRow.tsx`, `SuccessScreen.tsx`)
- Utilities/Services: camelCase (`spotifyApi.ts`, `diffEngine.ts`)
- Hooks: camelCase mit `use`-Prefix (`useAuth.ts`, `usePlaylistSelection.ts`)
- Tests: Co-located mit `.test.tsx`/`.test.ts` Suffix (`PlaylistRow.test.tsx`)
- Typen: `index.ts` in `types/`-Ordner

**Code-Naming:**
- Komponenten: PascalCase (`PlaylistRow`, `ColumnHeader`)
- Hooks: camelCase mit `use`-Prefix (`useAuth`, `usePlaylistSelection`)
- Funktionen/Variablen: camelCase (`calculateDiff`, `selectedPlaylists`)
- Typen/Interfaces: PascalCase ohne Prefix (`Playlist`, `AppPhase`) — kein `I`-Prefix, kein `Type`-Suffix
- Reducer Actions: SCREAMING_SNAKE_CASE (`SET_PHASE`, `TOGGLE_SOURCE`)
- Konstanten: SCREAMING_SNAKE_CASE (`MAX_CONCURRENT_REQUESTS`, `API_TIMEOUT_MS`)

### Structure Patterns

**Projekt-Organisation (By Type, flach):**
```
src/
  components/
    ui/              ← shadcn/ui Basis-Komponenten
    PlaylistRow.tsx
    PlaylistRow.test.tsx
    ColumnHeader.tsx
    Toolbar.tsx
    CreationPhase.tsx
    SuccessScreen.tsx
    ErrorState.tsx
  hooks/
    useAuth.ts
    usePlaylistSelection.ts
  lib/
    spotifyApi.ts
    diffEngine.ts
    auth.ts
  types/
    index.ts         ← alle TypeScript-Typen
  App.tsx
  main.tsx
```

**Rationale:** Bei ~10 Custom Components lohnen sich Feature-Ordner nicht. Die shadcn/ui-Struktur (`components/ui/`) gibt das Schema vor. Tests co-located für einfache Auffindbarkeit.

### State Management Patterns

**State Shape:** Flach — kein Nesting

```typescript
interface AppState {
  phase: AppPhase
  playlists: Playlist[]
  selectedSources: string[]      // Playlist-IDs
  selectedExcludes: string[]     // Playlist-IDs
  playlistName: string
  error: string | null
  progress: number
}
```

**Action Format:** Discriminated Union — TypeScript validiert Payload pro Action-Type

```typescript
type AppAction =
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_EXCLUDE'; payload: string }
  | { type: 'SET_PLAYLIST_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'RESET_SELECTION' }
```

**Regeln:**
- State-Updates nur über `dispatch()` — nie direkte Mutation
- Jede Komponente liest State über Context, dispatcht Actions für Änderungen
- Kein lokaler State für Daten die den Reducer betreffen

### Error Handling Patterns

- Alle API-Fehler setzen `SET_ERROR` im Reducer — kein `try/catch` das Fehler schluckt
- Fehler-Texte immer nutzerfreundlich (deutsch), nie technische Codes oder Stack Traces
- 401-Fehler triggern immer den Re-Login-Flow, nie eine generische Fehlermeldung
- Fehler werden über die `ErrorState`-Komponente angezeigt — kein `alert()`, kein `console.error` als einziges Feedback
- `console.error` nur zusätzlich für Debugging, nie als Nutzer-Feedback

### Loading State Patterns

- Die `phase` im State steuert alle Loading-Zustände — kein separater `isLoading`-Boolean
- Phase `'loading'`: Skeleton-Rows beim initialen Playlisten-Laden
- Phase `'creating'`: `CreationPhase`-Komponente mit Fortschrittsbalken
- Kein generischer Spinner — jeder Loading-Zustand hat seine eigene visuelle Repräsentation

### Validation Patterns

- Inline-Validierung — kein Blocking-Modal, kein `alert()`
- Button disabled statt Fehlermeldung wo möglich (z.B. "Erstellen"-Button ohne Quell-Playlisten)
- Warnungen (z.B. "0 Tracks") inline im Live-Zähler der Toolbar
- Duplikat-Warnung (gleiche Playlist in Quellen + Ausschlüssen) als nicht-blockierender Hinweis

### Enforcement Guidelines

**Alle AI-Agenten MÜSSEN:**
- PascalCase für Komponenten-Dateien und -Namen verwenden
- Alle State-Änderungen über den zentralen Reducer dispatchen
- Fehler-Texte in Deutsch und nutzerfreundlich formulieren
- Tests co-located neben der Implementierung ablegen
- TypeScript Discriminated Unions für Action-Types verwenden

**Anti-Patterns (verboten):**
- `any` als TypeScript-Type (stattdessen explizite Types oder `unknown`)
- `alert()` oder `window.confirm()` für Nutzer-Feedback
- Inline-Styles statt Tailwind-Klassen
- Direkte localStorage-Zugriffe außerhalb des Auth-Moduls
- `console.log` in Production-Code (nur `console.error` für echte Fehler)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
playlist-cutter/
├── .github/
│   └── workflows/
│       └── deploy.yml                ← GitHub Actions: Build + Deploy to Pages
├── .env.local                        ← Lokale Env Variables (VITE_SPOTIFY_*)
├── .env.example                      ← Template für Env Variables
├── .gitignore
├── index.html                        ← Vite Entry Point
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts                  ← Vitest-Konfiguration (jsdom, Aliase)
├── components.json                   ← shadcn/ui Konfiguration
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                      ← React Entry Point
    ├── App.tsx                       ← Root-Komponente, Phase-Router
    ├── App.css                       ← Globale Styles + Tailwind Import
    ├── components/
    │   ├── ui/                       ← shadcn/ui Basis-Komponenten
    │   │   ├── button.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── dialog.tsx
    │   │   ├── progress.tsx
    │   │   ├── input.tsx
    │   │   ├── badge.tsx
    │   │   └── separator.tsx
    │   ├── AppHeader.tsx             ← Header: App-Name, User-Info, Logout
    │   ├── LoginScreen.tsx           ← Login-Ansicht mit Spotify-Button
    │   ├── PlaylistRow.tsx           ← Einzelne Playlist-Zeile mit Checkbox
    │   ├── PlaylistRow.test.tsx
    │   ├── ColumnHeader.tsx          ← Spalten-Überschrift mit Icon + Badge
    │   ├── PlaylistColumns.tsx       ← Zwei-Spalten-Layout Container
    │   ├── Toolbar.tsx               ← Name-Input + Live-Summary + Erstellen-Button
    │   ├── ConfirmDialog.tsx         ← Confirmation-Dialog vor Erstellung
    │   ├── CreationPhase.tsx         ← Vollbild-Fortschritts-Ansicht
    │   ├── SuccessScreen.tsx         ← Erfolgs-Screen mit Spotify-Link
    │   ├── ErrorState.tsx            ← Fehler-Anzeige mit Handlungsempfehlung
    │   └── EmptyState.tsx            ← Hinweis für Nutzer ohne Playlisten
    ├── hooks/
    │   ├── useAuth.ts                ← OAuth-State + Login/Logout Funktionen
    │   ├── useAuth.test.ts
    │   ├── usePlaylistSelection.ts   ← Auswahl-Logik (Toggle, Zähler, Validierung)
    │   └── usePlaylistSelection.test.ts
    ├── lib/
    │   ├── spotifyApi.ts             ← Spotify API Client (alle Endpunkte)
    │   ├── spotifyApi.test.ts
    │   ├── auth.ts                   ← PKCE-Helpers (Verifier, Challenge, Token-Exchange)
    │   ├── auth.test.ts
    │   ├── diffEngine.ts             ← Track-ID Differenzmenge + Deduplizierung
    │   ├── diffEngine.test.ts
    │   ├── concurrency.ts            ← Promise.all mit begrenzter Parallelität
    │   └── utils.ts                  ← Kleine Hilfsfunktionen (cn, etc.)
    ├── context/
    │   ├── AppContext.tsx             ← React Context Provider + useReducer
    │   ├── appReducer.ts             ← Reducer + Action Types + State Interface
    │   └── appReducer.test.ts
    └── types/
        └── index.ts                  ← Playlist, Track, AppPhase, AppState, AppAction
```

### Architectural Boundaries

**Externe API-Boundary:**
- Einziger Kontaktpunkt zur Spotify Web API: `src/lib/spotifyApi.ts`
- Kein anderes Modul ruft Spotify direkt auf
- Auth-Token wird vom `useAuth`-Hook bereitgestellt und an API-Funktionen übergeben

**State-Boundary:**
- Einziger globaler State: `AppContext` via `useReducer`
- Nur `dispatch()` ändert State — keine direkte Mutation
- Komponenten lesen über `useContext(AppContext)`

**Storage-Boundary:**
- Einziger localStorage-Zugriff: `src/lib/auth.ts` (Token speichern/laden/löschen)
- Kein anderes Modul greift auf localStorage zu

**Logik-Boundary:**
- Diff-Berechnung ist reine Funktion in `diffEngine.ts` — kein React, kein State, kein API-Call
- Concurrency-Utility in `concurrency.ts` — generisch, nicht Spotify-spezifisch

### Requirements to Structure Mapping

**FR1-FR4 (Authentifizierung & Session):**
- `src/lib/auth.ts` — PKCE-Flow, Token-Exchange, localStorage
- `src/hooks/useAuth.ts` — Auth-State, Login/Logout
- `src/components/LoginScreen.tsx` — Login-UI
- `src/components/AppHeader.tsx` — Logout-Link

**FR5-FR9 (Playlist-Verwaltung & Auswahl):**
- `src/lib/spotifyApi.ts` — `getPlaylists()`
- `src/components/PlaylistColumns.tsx` — Zwei-Spalten-Layout
- `src/components/PlaylistRow.tsx` — Einzelne Zeile
- `src/components/ColumnHeader.tsx` — Spalten-Header mit Badge
- `src/components/EmptyState.tsx` — Keine Playlisten
- `src/hooks/usePlaylistSelection.ts` — Toggle, Duplikat-Warnung

**FR10-FR13 (Diff-Berechnung):**
- `src/lib/spotifyApi.ts` — `getPlaylistTracks()` mit Pagination
- `src/lib/diffEngine.ts` — Differenzmenge + Deduplizierung
- `src/lib/concurrency.ts` — Begrenzte Parallelität

**FR14-FR18 (Playlist-Erstellung):**
- `src/lib/spotifyApi.ts` — `createPlaylist()`, `addTracksToPlaylist()`
- `src/components/Toolbar.tsx` — Name-Input + Erstellen-Button
- `src/components/ConfirmDialog.tsx` — Bestätigung

**FR19-FR22 (Fortschritt & Feedback):**
- `src/components/CreationPhase.tsx` — Fortschritts-Ansicht
- `src/components/SuccessScreen.tsx` — Erfolg + Spotify-Link
- `src/components/ErrorState.tsx` — Fehlermeldungen

### Data Flow

```
Spotify OAuth → auth.ts → useAuth → AppContext (phase: 'authenticated')
                                         ↓
spotifyApi.getPlaylists() → AppContext (playlists: [...])
                                         ↓
User wählt aus → usePlaylistSelection → dispatch(TOGGLE_SOURCE/EXCLUDE)
                                         ↓
User klickt "Erstellen" → ConfirmDialog → dispatch(SET_PHASE: 'creating')
                                         ↓
spotifyApi.getPlaylistTracks() → diffEngine.calculateDiff()
                                         ↓
spotifyApi.createPlaylist() + addTracks() → dispatch(SET_PHASE: 'success')
                                         ↓
                                    SuccessScreen
```

### Development Workflow

**Lokale Entwicklung:**
- `yarn dev` — Vite Dev Server auf `localhost:5173`
- Spotify Redirect URI: `http://localhost:5173`
- `.env.local` mit `VITE_SPOTIFY_CLIENT_ID` und `VITE_SPOTIFY_REDIRECT_URI`

**Testing:**
- `yarn test` — Vitest im Watch-Mode
- `yarn test:run` — Einmaliger Test-Durchlauf (CI)
- Tests co-located neben Implementierung

**Build & Deploy:**
- `yarn build` — Vite Production Build nach `dist/`
- GitHub Actions: Push auf `main` → Build → Deploy auf `gh-pages`
- `vite.config.ts` mit `base: '/playlist-cutter/'` für GitHub Pages Subpath

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Alle Technologie-Entscheidungen sind vollständig kompatibel. React + Vite v8 + TypeScript + Tailwind CSS v4.2 + shadcn/ui + Vitest v4.1 + Framer Motion sind eine industrieerprobte Kombination ohne bekannte Konflikte.

**Pattern Consistency:**
Naming-Konventionen (PascalCase Komponenten, camelCase Utilities, SCREAMING_SNAKE_CASE Actions) sind konsistent mit React/TypeScript-Ökosystem und shadcn/ui-Konventionen. Co-located Tests folgen Vitest-Defaults.

**Structure Alignment:**
Projektstruktur spiegelt die 4 definierten Boundaries wider: API (`lib/spotifyApi.ts`), State (`context/`), Storage (`lib/auth.ts`), Logik (`lib/diffEngine.ts`). Keine Boundary-Überschneidungen.

### Requirements Coverage Validation ✅

**Functional Requirements:** 22/22 FRs sind architektonisch abgedeckt und konkreten Dateien zugeordnet.

**Non-Functional Requirements:** Alle NFRs (Performance, Sicherheit, Accessibility, Integration) sind durch Architektur-Entscheidungen und Technologie-Stack adressiert.

### Implementation Readiness Validation ✅

**Decision Completeness:** Alle kritischen und wichtigen Entscheidungen sind dokumentiert mit Versionen und Rationale.

**Structure Completeness:** Vollständige Verzeichnisstruktur mit allen Dateien, Boundaries und FR-Mapping definiert.

**Pattern Completeness:** Naming, State Management, Error Handling, Loading States und Validation Patterns vollständig spezifiziert mit Enforcement Guidelines.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Projektkontext analysiert
- [x] Scale und Komplexität bewertet
- [x] Technische Constraints identifiziert
- [x] Cross-Cutting Concerns gemappt

**✅ Architectural Decisions**
- [x] Kritische Entscheidungen mit Versionen dokumentiert
- [x] Tech-Stack vollständig spezifiziert
- [x] Integrations-Patterns definiert
- [x] Performance-Anforderungen adressiert

**✅ Implementation Patterns**
- [x] Naming-Konventionen etabliert
- [x] Struktur-Patterns definiert
- [x] State-Management-Patterns spezifiziert
- [x] Error/Loading/Validation-Patterns dokumentiert

**✅ Project Structure**
- [x] Vollständige Verzeichnisstruktur definiert
- [x] Komponenten-Boundaries etabliert
- [x] Integrationspunkte gemappt
- [x] Requirements-to-Structure Mapping vollständig

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** Hoch

**Key Strengths:**
- Klare Boundaries verhindern Modul-Überschneidungen
- Bewusst minimalistischer Ansatz (kein Over-Engineering)
- Jede Entscheidung hat explizites Rationale
- FR-Mapping gibt Agents eine präzise Implementierungsanleitung

**Areas for Future Enhancement:**
- Rate-Limit-Handling (Post-MVP, PRD Phase 2)
- Responsive Mobile-Layout (Post-MVP)
- Caching-Strategie bei wachsender Nutzerbasis

### Implementation Handoff

**AI Agent Guidelines:**
- Alle architektonischen Entscheidungen exakt wie dokumentiert befolgen
- Implementation Patterns konsistent über alle Komponenten anwenden
- Projektstruktur und Boundaries respektieren
- Dieses Dokument für alle Architektur-Fragen heranziehen

**Erste Implementierungs-Priorität:**
```bash
yarn dlx shadcn@latest init -t vite
yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom
yarn dlx shadcn@latest add checkbox dialog progress input button badge separator
```
