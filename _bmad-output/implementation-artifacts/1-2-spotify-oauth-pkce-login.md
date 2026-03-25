# Story 1.2: Spotify OAuth PKCE Login

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Als Spotify-Nutzer
möchte ich mich über einen "Mit Spotify anmelden"-Button authentifizieren,
damit ich Zugriff auf meine Playlisten erhalte ohne mein Passwort an die App weiterzugeben.

## Acceptance Criteria

1. **Given** der Nutzer öffnet die App und ist nicht eingeloggt **When** die App lädt **Then** wird der `LoginScreen` angezeigt mit App-Name in Plus Jakarta Sans und einem primären "Mit Spotify anmelden"-Button (Sky `#0284C7`)

2. **Given** der Nutzer klickt "Mit Spotify anmelden" **When** der OAuth-Flow startet **Then** wird ein PKCE Code Verifier und Code Challenge generiert (`auth.ts`) **And** der Nutzer wird zu Spotify weitergeleitet mit korrekten Scopes (`playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`)

3. **Given** der Nutzer hat Spotify-Berechtigungen erteilt **When** Spotify zum Redirect URI zurückleitet (mit Authorization Code) **Then** tauscht die App den Authorization Code gegen einen Access Token (`auth.ts`) **And** der Token wird in localStorage gespeichert **And** der App-State wechselt zu Phase `loading`

4. **Given** der OAuth-Flow schlägt fehl oder wird vom Nutzer abgebrochen **When** der Redirect zurückkommt ohne gültigen Code (oder mit `?error=...`) **Then** bleibt der Nutzer auf dem `LoginScreen` ohne Fehlerzustand

## Tasks / Subtasks

- [x] Task 1: TypeScript-Typen in `src/types/index.ts` anlegen (AC: 1, 3)
  - [x] `AppPhase` Type definieren: `'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error'`
  - [x] `AppState` Interface definieren (flach, kein Nesting — siehe Dev Notes)
  - [x] `AppAction` Discriminated Union definieren (alle Actions — auch für spätere Stories)
  - [x] `Playlist` Interface definieren: `{ id: string; name: string; trackCount: number }`
  - [x] `Track` Interface definieren: `{ id: string }`

- [x] Task 2: `src/vite-env.d.ts` erstellen (AC: 2)
  - [x] Datei anlegen mit `/// <reference types="vite/client" />`
  - [x] `ImportMetaEnv` Interface augmentieren mit `VITE_SPOTIFY_CLIENT_ID: string` und `VITE_SPOTIFY_REDIRECT_URI: string`
  - [x] Prüfen: TypeScript erkennt `import.meta.env.VITE_SPOTIFY_CLIENT_ID` ohne `any`-Cast

- [x] Task 3: `src/lib/auth.ts` implementieren — PKCE-Helpers + localStorage-Boundary (AC: 2, 3)
  - [x] Konstanten definieren: localStorage-Keys, Spotify-Endpoints, Scopes (alle als `const` in SCREAMING_SNAKE_CASE)
  - [x] `generateCodeVerifier()` implementieren: 64 URL-safe zufällige Zeichen via `crypto.getRandomValues()`
  - [x] `generateCodeChallenge(verifier)` implementieren: SHA-256 via `crypto.subtle.digest()` + base64url ohne Padding
  - [x] `buildAuthUrl(verifier)` implementieren: speichert Verifier in sessionStorage, gibt Spotify-Auth-URL zurück
  - [x] `exchangeCodeForToken(code)` implementieren: liest Verifier aus sessionStorage, POST zu Spotify-Token-Endpoint, löscht Verifier
  - [x] `saveToken(accessToken, expiresIn)` implementieren: speichert Token + Ablaufzeitpunkt in localStorage
  - [x] `loadToken()` implementieren: gibt Token zurück oder `null` wenn abgelaufen oder nicht vorhanden
  - [x] `isTokenValid()` implementieren: prüft ob Token im localStorage und nicht abgelaufen
  - [x] `clearToken()` implementieren: löscht Token-Keys aus localStorage

- [x] Task 4: `src/lib/auth.test.ts` erstellen (AC: 2, 3)
  - [x] `generateCodeVerifier()` — Länge und Zeichensatz testen
  - [x] `generateCodeChallenge()` — Determinismus für bekannte Verifier-Eingabe testen
  - [x] `saveToken()` / `loadToken()` / `clearToken()` / `isTokenValid()` — localStorage-Interaktion testen (localStorage mocken)
  - [x] Abgelaufener Token → `loadToken()` gibt `null` zurück

- [x] Task 5: `src/context/appReducer.ts` implementieren (AC: 3)
  - [x] Initial State definieren: `{ phase: 'login', playlists: [], selectedSources: [], selectedExcludes: [], playlistName: '', error: null, progress: 0 }`
  - [x] Reducer-Funktion implementieren für alle Actions (SET_PHASE, SET_PLAYLISTS, TOGGLE_SOURCE, TOGGLE_EXCLUDE, SET_PLAYLIST_NAME, SET_ERROR, SET_PROGRESS, RESET_SELECTION)
  - [x] Reducer-Tests in `src/context/appReducer.test.ts` anlegen: SET_PHASE, TOGGLE_SOURCE/EXCLUDE, RESET_SELECTION

- [x] Task 6: `src/context/AppContext.tsx` implementieren (AC: 3)
  - [x] Context mit `createContext()` definieren (State + Dispatch exportieren)
  - [x] `AppProvider` Komponente mit `useReducer(appReducer, initialState)` implementieren
  - [x] `useAppContext()` Custom Hook exportieren (wirft Fehler wenn außerhalb Provider verwendet)
  - [x] Auf OAuth-Callback beim Mount prüfen: URL-Params `code` und `state` lesen — wenn vorhanden, Token-Exchange starten

- [x] Task 7: `src/hooks/useAuth.ts` implementieren (AC: 2, 3, 4)
  - [x] `login()` Funktion: `buildAuthUrl()` aufrufen und zu Spotify weiterleiten (`window.location.href`)
  - [x] `logout()` Funktion: `clearToken()` + `dispatch(SET_PHASE: 'login')`
  - [x] `handleCallback(code)` Funktion: `exchangeCodeForToken()` aufrufen, bei Erfolg `saveToken()` + `dispatch(SET_PHASE: 'loading')`, bei Fehler URL bereinigen + auf LoginScreen bleiben
  - [x] `useAuth.test.ts` anlegen: `logout()` und Error-Fallback testen

- [x] Task 8: `src/components/LoginScreen.tsx` erstellen (AC: 1)
  - [x] App-Name `"Playlist Cutter"` als `text-4xl font-bold` mit Sky-Farbe (`text-sky-600` entspricht #0284C7)
  - [x] Kurze Beschreibung darunter als `text-sm text-secondary`
  - [x] "Mit Spotify anmelden"-Button: shadcn/ui `Button`, Sky-Hintergrund (`bg-sky-600 hover:bg-sky-700`), weißer Text, Lucide `LogIn`-Icon links
  - [x] Zentriertes Layout, großzügiges Whitespace (Linear-Prinzip)
  - [x] Kein Gradient auf dem Button — flat Sky gemäß finaler UX-Entscheidung

- [x] Task 9: `src/App.tsx` auf Phase-Router umstellen (AC: 1, 3)
  - [x] App mit `AppProvider` umhüllen
  - [x] Auf OAuth-Callback beim Mount prüfen (URL-Params auslesen)
  - [x] Phase-Routing: `login` → `<LoginScreen>`, alle anderen Phasen → Placeholder-Div "Playlisten werden geladen…" (wird in Story 2.1 ersetzt)

- [x] Task 10: Abschluss-Verifikation
  - [x] `yarn build` ohne TypeScript-Fehler
  - [x] `yarn test:run` alle Tests grün
  - [x] Manueller Test: Login-Flow durchlaufen (erfordert `.env.local` mit echter Client-ID)

## Dev Notes

### Kritische Architektur-Entscheidungen für diese Story

**Storage-Boundary:** Ausschließlich `src/lib/auth.ts` greift auf localStorage zu. Kein anderes Modul (Context, Hooks, Komponenten) darf localStorage direkt ansprechen. Verletzung dieser Boundary ist ein kritischer Anti-Pattern.

**sessionStorage für Code Verifier:** Der PKCE Code Verifier muss den Browser-Redirect zu Spotify und zurück überleben. `sessionStorage` ist dafür geeignet (überlebt Redirects im gleichen Tab, wird bei Tab-Schließen gelöscht). Schlüssel: `'pkce_code_verifier'`.

**Kein Refresh Token:** Die App verwendet den reaktiven Ansatz: Bei 401-Fehlern (Story 1.4) wird der Nutzer neu angemeldet. Kein Refresh-Token-Flow nötig.

**Phasen-Maschine vollständig aufsetzen:** In dieser Story werden ALLE AppPhases, AppState, AppAction-Types definiert — auch die die erst in späteren Stories genutzt werden. Das verhindert Breaking Changes am State-Shape in späteren Stories.

**URL bereinigen nach OAuth-Callback:** Nach dem Token-Austausch müssen `?code=...&state=...` aus der URL entfernt werden, damit ein Seitenneuladen keinen erneuten (fehlschlagenden) Token-Austausch auslöst. `window.history.replaceState({}, '', '/')` verwenden.

### Farbsystem — Kritische Abweichung UX-Spec vs. Design-Entscheidung

Die UX-Spec beschreibt initial einen Indigo-Violet-Gradient (`from-indigo-500 to-violet-500`). Dieser wurde **in der Design Direction Decision explizit gestrichen**. Die finale Entscheidung:

- **Primär-Akzentfarbe:** Sky `#0284C7` (`sky-600` in Tailwind)
- **Kein Gradient** auf Buttons, App-Name oder anderen UI-Elementen
- Ausschluss-Spalte: Rose `#C9445A` (kommt in Story 2.2)
- Login-Button muss **flat Sky** sein, kein Gradient

Die ältere Typografie-Beschreibung "App-Name mit Gradient-Text-Effekt" gilt **nicht mehr**. App-Name ist bold in Sky-Farbe oder neutral Dunkel — kein Gradient.

### PKCE-Implementierung — Technische Spezifikation

```typescript
// Code Verifier: 64 zufällige URL-safe Zeichen
const ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map(byte => ALLOWED_CHARS[byte % ALLOWED_CHARS.length])
    .join('')
}

// Code Challenge: SHA-256 + base64url ohne Padding
async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
```

### Spotify-Endpunkte und Konstanten

```typescript
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SCOPES = 'playlist-read-private playlist-modify-public playlist-modify-private'
const PKCE_VERIFIER_KEY = 'pkce_code_verifier'
const TOKEN_KEY = 'playlist_cutter_access_token'
const TOKEN_EXPIRY_KEY = 'playlist_cutter_token_expiry'
```

### Token-Exchange — POST-Request-Format

Spotify erwartet `application/x-www-form-urlencoded`, **kein JSON**:

```typescript
async function exchangeCodeForToken(code: string): Promise<string> {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
  if (!verifier) throw new Error('Code verifier nicht gefunden')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  if (!response.ok) throw new Error('Token-Exchange fehlgeschlagen')

  const data = await response.json()
  return data.access_token  // expires_in ist typischerweise 3600 Sekunden
}
```

### State Shape und Action Types (vollständig für alle Stories)

```typescript
// src/types/index.ts

export interface Playlist {
  id: string
  name: string
  trackCount: number
}

export interface Track {
  id: string
}

export type AppPhase = 'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error'

export interface AppState {
  phase: AppPhase
  playlists: Playlist[]
  selectedSources: string[]    // Playlist-IDs
  selectedExcludes: string[]   // Playlist-IDs
  playlistName: string
  error: string | null
  progress: number             // 0–100
}

export type AppAction =
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_EXCLUDE'; payload: string }
  | { type: 'SET_PLAYLIST_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'RESET_SELECTION' }
```

### AppContext-Struktur

```typescript
// src/context/AppContext.tsx

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext muss innerhalb von AppProvider verwendet werden')
  return context
}
```

### App.tsx Phase-Router-Struktur

```typescript
// src/App.tsx

function AppContent() {
  const { state, dispatch } = useAppContext()

  // OAuth-Callback verarbeiten (einmalig beim Mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      window.history.replaceState({}, '', '/')
      return
    }

    if (code) {
      handleCallback(code, dispatch)  // aus useAuth oder direkt
    }
  }, [])

  switch (state.phase) {
    case 'login':
      return <LoginScreen />
    default:
      return <div>Playlisten werden geladen…</div>  // Placeholder bis Story 2.1
  }
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
```

### vite-env.d.ts — Pflichtinhalt

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_SPOTIFY_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### LoginScreen — Layout-Richtlinien

```
Zentriert auf der Seite (flex flex-col items-center justify-center min-h-screen)
  App-Name: text-4xl font-bold text-sky-600
  Tagline: text-sm text-gray-500 mt-2
  [Abstand: mt-8]
  Button: "Mit Spotify anmelden" mit LogIn-Icon (Lucide), bg-sky-600 hover:bg-sky-700 text-white
```

- Kein Gradient, kein dunkles Theme
- Hintergrund `bg-[#FAFAFA]` (Off-White aus UX-Spec)
- Button-Komponente: shadcn/ui `<Button>` mit überridetem Styling

### Lernübertrag aus Story 1.1

- **Paketmanager:** Ausschließlich `yarn` — kein `npm` oder `pnpm`
- **TypeScript strict:** kein `any` — alles explizit typen
- **Keine Inline-Styles:** nur Tailwind-Klassen
- **`@/`-Alias** für alle Imports (nicht relative `../../lib/...`)
- **`console.log` verboten** in Production-Code — nur `console.error` für echte Fehler
- **Direkter localStorage-Zugriff** außerhalb `src/lib/auth.ts` ist verboten
- **Tests co-located** neben der Implementierung (z.B. `auth.ts` + `auth.test.ts`)
- **Plus Jakarta Sans** ist bereits als globaler Font in `src/index.css` + `src/main.tsx` konfiguriert — nicht erneut importieren

### Naming-Konventionen (projektweite Pflicht)

- Komponenten-Dateien: PascalCase (`LoginScreen.tsx`)
- Utilities/Services: camelCase (`auth.ts`, `appReducer.ts`)
- Hooks: camelCase mit `use`-Prefix (`useAuth.ts`)
- Tests: Co-located mit `.test.ts`/`.test.tsx` Suffix
- Reducer Actions: SCREAMING_SNAKE_CASE (`SET_PHASE`, `TOGGLE_SOURCE`)
- Konstanten: SCREAMING_SNAKE_CASE (`TOKEN_KEY`, `SCOPES`)
- Kein `I`-Prefix für Interfaces, kein `Type`-Suffix

### Anti-Patterns — Verboten

- `any` als TypeScript-Type
- Inline-Styles statt Tailwind-Klassen
- `alert()` / `window.confirm()` für Nutzer-Feedback
- Direkter localStorage-Zugriff außerhalb `src/lib/auth.ts`
- `console.log` in Production-Code
- npm oder pnpm verwenden statt yarn
- Indigo-Gradient auf Buttons (war Design-Idee, wurde gestrichen)

### Scope dieser Story

**Diese Story implementiert:**
- Vollständiger PKCE OAuth-Flow (Forward + Callback)
- localStorage-Boundary (auth.ts)
- AppContext + Reducer (alle Types und Actions, auch für spätere Stories)
- LoginScreen-Komponente
- App.tsx als Phase-Router (mit Placeholder für phase ≠ 'login')

**Diese Story enthält NICHT:**
- AppHeader (Story 1.3)
- Session-Persistenz beim Seitenneuladen (Story 1.3)
- Logout-Funktion im UI (Story 1.3)
- Token-Ablauf-Handling mit 401 (Story 1.4)
- Playlisten laden (Story 2.1)
- Playlisten-Anzeige oder Zwei-Spalten-Layout (Story 2.x)
- `spotifyApi.ts` (Story 2.1)

### Projektstruktur nach dieser Story

```
src/
  components/
    ui/              ← unverändert (Story 1.1)
    LoginScreen.tsx  ← NEU
  hooks/
    useAuth.ts       ← NEU
    useAuth.test.ts  ← NEU
  lib/
    auth.ts          ← NEU (PKCE + localStorage-Boundary)
    auth.test.ts     ← NEU
    utils.ts         ← unverändert (Story 1.1)
  context/
    AppContext.tsx   ← NEU
    appReducer.ts    ← NEU
    appReducer.test.ts ← NEU
  types/
    index.ts         ← ERWEITERT mit Playlist, Track, AppPhase, AppState, AppAction
  test/              ← unverändert (Story 1.1)
  App.tsx            ← GEÄNDERT (Phase-Router)
  main.tsx           ← unverändert (Story 1.1)
  index.css          ← unverändert (Story 1.1)
  vite-env.d.ts      ← NEU
```

### Project Structure Notes

- Alignment: Struktur entspricht dem Architecture-Dokument (Abschnitt "Complete Project Directory Structure")
- `vite-env.d.ts` liegt direkt in `src/` — Standard-Vite-Konvention
- `AppContext.tsx` und `appReducer.ts` in `src/context/` — klar getrennte Zuständigkeiten
- `useAuth.ts` in `src/hooks/` ist ein dünner Adapter zwischen `auth.ts` und dem App-State

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Authentication & Security] — PKCE-Ansatz und reaktives Token-Ablauf-Handling
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — AppState Shape, AppAction Format
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries — Storage-Boundary] — localStorage nur in auth.ts
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming-Konventionen und Anti-Patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance Criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Kein Gradient, flat Sky #0284C7 als primäre Akzentfarbe
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Basis-Palette: #FAFAFA Hintergrund, #111827 Text Primary
- [Source: _bmad-output/implementation-artifacts/1-1-projekt-setup-mit-shadcn-ui-cli-und-vitest.md#Dev Notes] — Stack-Versionen, Naming-Konventionen, Anti-Patterns

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- jsdom v29 liefert kein vollständiges localStorage-API (kein `.clear()`). Behoben durch Map-basierten Mock in `src/test/setup.ts` via `vi.stubGlobal`.
- TypeScript `verbatimModuleSyntax` erfordert `import type` für reine Typ-Imports. Alle betroffenen Dateien korrigiert.

### Completion Notes List

- PKCE OAuth-Flow vollständig implementiert (Forward + Callback)
- localStorage-Boundary strikt eingehalten: nur `src/lib/auth.ts` greift auf localStorage zu
- AppContext + Reducer mit allen Actions für alle Stories (1–4) aufgesetzt
- LoginScreen mit flat Sky `#0284C7`, kein Gradient, Plus Jakarta Sans (bereits global konfiguriert)
- App.tsx als Phase-Router: `login` → LoginScreen, alle anderen → Placeholder
- 30 Tests, alle grün; `yarn build` ohne TypeScript-Fehler

### File List

- src/types/index.ts (erweitert)
- src/vite-env.d.ts (neu)
- src/lib/auth.ts (neu)
- src/lib/auth.test.ts (neu)
- src/context/appReducer.ts (neu)
- src/context/appReducer.test.ts (neu)
- src/context/AppContext.tsx (neu)
- src/hooks/useAuth.ts (neu)
- src/hooks/useAuth.test.ts (neu)
- src/components/LoginScreen.tsx (neu)
- src/App.tsx (geändert)
- src/test/setup.ts (geändert — localStorage-Mock für jsdom v29)

## Code Review Findings (2026-03-25)

Status: 4 Patches zu fixen, 0 Intent Gaps (geklärt), 4 Defer (kein Fix nötig)

### Patch 1: App.tsx umgeht useAuth.handleCallback — MUSS GEFIXT WERDEN

`App.tsx` ruft `exchangeCodeForToken`/`saveToken` direkt auf statt `useAuth.handleCallback` zu nutzen. Das widerspricht der Spec-Vorgabe. `handleCallback` im Hook ist toter Code.

**Fix:** App.tsx soll `useAuth().handleCallback(code)` nutzen statt die Auth-Funktionen direkt zu importieren. Die direkten Imports von `exchangeCodeForToken` und `saveToken` in App.tsx entfernen.

**Dateien:** `src/App.tsx`

### Patch 2: exchangeCodeForToken verwirft expires_in — MUSS GEFIXT WERDEN

Die Funktion gibt nur `data.access_token` zurück und ignoriert `data.expires_in`. Beide Aufrufe verwenden hardcoded `3600`.

**Fix:** `exchangeCodeForToken` soll ein Objekt `{ accessToken: string; expiresIn: number }` zurückgeben. Alle Aufrufer entsprechend anpassen. Tests aktualisieren.

**Dateien:** `src/lib/auth.ts`, `src/hooks/useAuth.ts`, `src/lib/auth.test.ts`, `src/hooks/useAuth.test.ts`

### Patch 3: Code Verifier wird vor Response-Check gelöscht — MUSS GEFIXT WERDEN

`sessionStorage.removeItem(PKCE_VERIFIER_KEY)` steht vor `if (!response.ok)`. Bei fehlgeschlagenem Token-Exchange ist der Verifier weg und der User muss komplett neu starten.

**Fix:** `sessionStorage.removeItem(PKCE_VERIFIER_KEY)` erst NACH dem `if (!response.ok)` Check ausführen (nur bei Erfolg löschen).

**Dateien:** `src/lib/auth.ts`

### Patch 4: React 18 StrictMode Doppel-Invocation — MUSS GEFIXT WERDEN

React 18 StrictMode doppelt Effects in Development. Der useEffect in App.tsx würde `exchangeCodeForToken` zweimal aufrufen. Authorization Codes sind Single-Use.

**Fix:** Ref-Guard (`useRef` Flag) einsetzen um doppelte Ausführung zu verhindern. Wird durch Patch 1 teilweise adressiert wenn handleCallback verwendet wird, aber der Guard ist trotzdem nötig.

**Dateien:** `src/App.tsx`

### Geklärte Intent Gaps (KEIN FIX NÖTIG)

- **Token-Check beim Mount:** Gehört in Story 1.3 (Session-Persistenz). `loadToken()`/`isTokenValid()` existieren als Utility, werden aber bewusst noch nicht beim Mount aufgerufen.
- **OAuth `state`-Parameter:** Ignoriert. PKCE reicht als Schutz aus.

## Change Log

- 2026-03-25: Story erstellt — Story-Kontext-Engine-Analyse abgeschlossen, umfassender Entwicklerleitfaden erstellt.
- 2026-03-25: Story implementiert — PKCE OAuth-Flow, AppContext, LoginScreen, Phase-Router. 30 Tests grün, Build sauber.
- 2026-03-25: Code Review abgeschlossen — 4 Patches identifiziert (Callback-Duplikation, expires_in hardcoded, Verifier-Löschung, StrictMode). Story bleibt in `review` bis Fixes implementiert.
- 2026-03-25: Review-Patches implementiert — Alle 4 Code-Review-Findings behoben. 30 Tests grün, Build sauber.
