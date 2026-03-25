# Story 1.3: Session-Persistenz, Logout & AppHeader

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Als Nutzer der die Seite neu lädt
möchte ich nicht erneut durch den OAuth-Flow geführt werden,
damit meine Sitzung nahtlos weiterläuft.

## Acceptance Criteria

1. **Given** ein Nutzer hat sich erfolgreich angemeldet und der Token ist in localStorage gespeichert **When** der Nutzer die Seite neu lädt **Then** erkennt die App den gültigen Token beim Start **And** der LoginScreen wird übersprungen — die App wechselt direkt zu Phase `loading`

2. **Given** der Nutzer ist angemeldet **When** die App die `loading`- oder `selection`-Phase anzeigt **Then** ist der `AppHeader` sichtbar mit App-Name links und User-Info (Spotify-Displayname) + Logout-Button rechts

3. **Given** der Nutzer klickt den Logout-Button (LogOut-Icon, Textlink-Stil in Grau `#9CA3AF`) **When** Logout ausgelöst wird **Then** wird der Token aus localStorage gelöscht **And** der App-State wechselt zurück zu Phase `login` **And** der LoginScreen wird angezeigt

## Tasks / Subtasks

- [x] Task 1: `src/types/index.ts` erweitern (AC: 2)
  - [x] `userName: string | null` zu `AppState` hinzufügen (Initial: `null`)
  - [x] `{ type: 'SET_USER'; payload: string }` zu `AppAction` Discriminated Union hinzufügen

- [x] Task 2: `src/context/appReducer.ts` aktualisieren (AC: 2)
  - [x] `initialState` um `userName: null` erweitern
  - [x] `SET_USER`-Case im Reducer hinzufügen: gibt neuen State mit `userName: action.payload` zurück

- [x] Task 3: `src/lib/spotifyApi.ts` anlegen — minimaler API-Client (AC: 2)
  - [x] Interne Helper-Funktion `spotifyFetch(token, path)` definieren: setzt `Authorization: Bearer ${token}` Header, wirft Fehler bei nicht-OK Response
  - [x] `getUserProfile(token: string): Promise<{ displayName: string }>` exportieren: GET `/me`, gibt `{ displayName: display_name }` zurück
  - [x] **Wichtig:** Token wird als Parameter übergeben — kein direkter localStorage-Zugriff in dieser Datei

- [x] Task 4: `src/components/AppHeader.tsx` erstellen (AC: 2, 3)
  - [x] Layout: `header` mit `max-w-6xl mx-auto px-6 py-3 flex items-center justify-between`
  - [x] Links: App-Name "Playlist Cutter" als `span` mit `text-xl font-bold text-sky-600`
  - [x] Rechts: Flexbox mit `gap-3 items-center`
    - [x] Displayname als `span text-sm text-gray-500` (aus `state.userName`, Fallback: "Nutzer")
    - [x] Trennzeichen `|` als `text-gray-300`
    - [x] Logout-Button: shadcn/ui `Button variant="ghost"` mit Lucide `LogOut`-Icon (16px), Text "Abmelden", Farbe `text-gray-400 hover:text-gray-600`, kein Hintergrund
  - [x] Props: keine — liest State direkt aus `useAppContext()`, Logout über `useAuth().logout()`

- [x] Task 5: `src/App.tsx` auf Session-Persistenz erweitern (AC: 1, 2)
  - [x] **Session-Check beim Mount:** vor dem OAuth-Callback-Check `isTokenValid()` prüfen
    - [x] Wenn Token gültig: `loadToken()` holen, `getUserProfile(token)` aufrufen, `dispatch(SET_USER)` + `dispatch(SET_PHASE: 'loading')`, Funktion frühzeitig verlassen
    - [x] Wenn Token ungültig: bestehender OAuth-Callback-Check läuft weiter
  - [x] **AppHeader einbinden:** `<AppHeader>` in allen Phasen außer `login` anzeigen
    - [x] Phase-Router: `login` → nur `<LoginScreen />` (kein Header); `default` → `<AppHeader />` über dem Inhalt

- [x] Task 6: `src/lib/spotifyApi.test.ts` anlegen (AC: 2)
  - [x] `getUserProfile()` testen: fetch mit korrektem Authorization-Header mocken, gibt `displayName` zurück
  - [x] Fehlerfall: 401-Response → wirft Fehler

- [x] Task 7: `useAuth.test.ts` ergänzen (AC: 3)
  - [x] `logout()` Test: prüft dass `clearToken()` aufgerufen und Phase 'login' gesetzt wird (bereits vorhanden — sicherstellen dass bestehend)

- [x] Task 8: Abschluss-Verifikation
  - [x] `yarn build` ohne TypeScript-Fehler
  - [x] `yarn test:run` alle Tests grün
  - [x] Manueller Test: Seitenneuladen nach Login überspringt LoginScreen
  - [x] Manueller Test: AppHeader zeigt Displayname und Logout funktioniert

## Dev Notes

### Kritische Architektur-Entscheidungen für diese Story

**AppPhase-Klarstellung:** Die Planungsartefakte verwenden "Phase `authenticated`" — dieser Phase-Name existiert NICHT in `src/types/index.ts`. Die korrekte Phase nach Token-Check und nach OAuth-Callback ist **`'loading'`**. Kein neuer Phase-Typ wird eingeführt.

**Session-Check-Reihenfolge in App.tsx:** Die `useEffect`-Logik beim Mount muss diese Reihenfolge haben:
```
1. isTokenValid() prüfen → wenn ja: Profil laden + SET_USER + SET_PHASE('loading') + return
2. URL-Parameter auslesen (OAuth-Callback)
3. Wenn error-Parameter → URL bereinigen + return
4. Wenn code-Parameter → handleCallback(code) aufrufen
```

**getUserProfile-Fehlerbehandlung:** Fehlertyp-abhängiges Verhalten (entschieden im Code Review 2026-03-25):
- **401/403** (ungültiger/abgelaufener Token): `clearToken()` aufrufen + App bleibt auf Phase `login`. Kein Crash, kein Alert.
- **Netzwerkfehler / 5xx** (transienter Fehler): Token NICHT löschen. App bleibt auf Phase `login`. Nutzer sieht eine kurze Hinweismeldung "Verbindungsproblem — bitte Seite neu laden." (kein Alert, z.B. als `state.error` oder einfacher Text).
- Prüfung: `if (error instanceof Error && error.message.includes('Spotify API Fehler: 40'))` → Auth-Fehler. Alles andere → transienter Fehler.

**spotifyApi.ts: Token als Parameter:** Die Spotify-API-Funktionen erhalten den Token immer als Parameter — sie greifen NICHT auf localStorage zu. Das ist die architektonische Boundary: nur `src/lib/auth.ts` kennt localStorage. In App.tsx wird `loadToken()` gerufen und der Token dann übergeben.

**Warum `userName` in AppState statt lokalem State:** Der Displayname wird in `AppHeader` gebraucht und könnte auch in anderen Phasen (z.B. SuccessScreen) relevant werden. Zentraler State verhindert redundante API-Calls.

**Kein Confirmation-Dialog für Logout:** Logout ist eine sofortige, unkritische Aktion — kein Dialog, kein Toast, kein Spinner.

### AppHeader — UI-Spezifikation

```
[App-Name: "Playlist Cutter" (text-xl font-bold text-sky-600)]    [Displayname (text-sm text-gray-500)] | [LogOut-Icon + "Abmelden" (text-gray-400)]
```

- Hintergrund: `bg-white border-b border-gray-100` (schlank, flat)
- Kein `position: fixed` — normaler Dokumentfluss ist ausreichend für diese App
- Max-Width: `max-w-6xl mx-auto px-6 py-3`
- Logout: shadcn/ui `<Button variant="ghost" size="sm">` mit `<LogOut className="h-4 w-4 mr-1.5" />` aus Lucide

### spotifyApi.ts — Minimaler Aufbau für diese Story

```typescript
// src/lib/spotifyApi.ts
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

async function spotifyFetch(token: string, path: string): Promise<Response> {
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Spotify API Fehler: ${response.status}`)
  return response
}

export async function getUserProfile(token: string): Promise<{ displayName: string }> {
  const response = await spotifyFetch(token, '/me')
  const data = await response.json()
  return { displayName: data.display_name }
}
```

**Erweiterungshinweis:** Story 2.1 wird `getPlaylists(token, ...)` und spätere Stories weitere Funktionen zu dieser Datei hinzufügen. Die `spotifyFetch`-Helper-Funktion nicht exportieren — sie ist internal.

### App.tsx — Session-Check-Implementierung

```typescript
// Reihenfolge im useEffect:
useEffect(() => {
  if (callbackHandled.current) return

  // 1. Session-Persistenz: gültiger Token → direkt zu loading
  if (isTokenValid()) {
    const token = loadToken()!
    getUserProfile(token)
      .then(({ displayName }) => {
        dispatch({ type: 'SET_USER', payload: displayName })
        dispatch({ type: 'SET_PHASE', payload: 'loading' })
      })
      .catch(() => {
        clearToken()
        // Nutzer bleibt auf LoginScreen
      })
    callbackHandled.current = true
    return
  }

  // 2. OAuth-Callback verarbeiten
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const error = params.get('error')

  if (error || !code) {
    window.history.replaceState({}, '', '/')
    return
  }

  callbackHandled.current = true
  handleCallback(code)
}, [])
```

### App.tsx — Phase-Router mit AppHeader

```typescript
switch (state.phase) {
  case 'login':
    return <LoginScreen />
  default:
    return (
      <>
        <AppHeader />
        <div>Playlisten werden geladen…</div>  {/* Placeholder bis Story 2.1 */}
      </>
    )
}
```

### Lernübertrag aus Story 1.2 (Code Review Findings)

- **useAuth.handleCallback nutzen** statt direkte Auth-Funktionen in App.tsx importieren — der Callback in Story 1.3 (Session-Check) ist KEIN handleCallback-Fall, aber beim OAuth-Callback weiterhin `useAuth().handleCallback(code)` verwenden
- **useRef-Guard** (`callbackHandled.current`) ist bereits in App.tsx vorhanden — muss auch den Session-Check Guard umfassen
- **expiresIn** aus `exchangeCodeForToken` korrekt weitergeben (bereits in useAuth.handleCallback implementiert)
- **Verifier erst nach erfolgreicher Response löschen** (bereits in auth.ts behoben)
- **displayName aus Spotify-API:** `data.display_name` (snake_case) — nicht `data.displayName`

### Lernübertrag aus Story 1.1

- Paketmanager: ausschließlich `yarn`
- TypeScript strict: kein `any`
- Keine Inline-Styles: nur Tailwind-Klassen
- `@/`-Alias für alle Imports
- `console.log` verboten — nur `console.error` für echte Fehler
- Plus Jakarta Sans ist global konfiguriert — nicht erneut importieren

### Naming-Konventionen (projektweite Pflicht)

- Komponenten: PascalCase (`AppHeader.tsx`)
- Services: camelCase (`spotifyApi.ts`)
- Tests: co-located (`.test.ts` / `.test.tsx`)
- Reducer Actions: SCREAMING_SNAKE_CASE (`SET_USER`)
- Konstanten: SCREAMING_SNAKE_CASE (`SPOTIFY_BASE_URL`)

### Anti-Patterns — Verboten

- `any` als TypeScript-Type
- Inline-Styles statt Tailwind-Klassen
- `alert()` / `window.confirm()` für Nutzer-Feedback
- Direkter localStorage-Zugriff in `spotifyApi.ts` oder `AppHeader.tsx`
- `console.log` in Production-Code
- npm oder pnpm statt yarn
- Indigo-Gradient auf Buttons oder App-Name

### Scope dieser Story

**Implementiert:**
- Session-Persistenz: Token-Check beim App-Mount
- Spotify-Profil laden (Displayname)
- AppHeader-Komponente mit Logout
- `userName` in AppState + `SET_USER` Action
- Minimales `spotifyApi.ts` (nur `getUserProfile`)

**NICHT in dieser Story:**
- Playlisten laden (Story 2.1)
- `spotifyApi.getPlaylists()` / `getPlaylistTracks()` / `createPlaylist()` (Story 2.1+)
- Token-Ablauf-Erkennung bei 401-Responses (Story 1.4)
- Playlisten-Anzeige, Zwei-Spalten-Layout (Story 2.x)
- Fehler-Screen für Token-Ablauf (Story 1.4)

### Projektstruktur nach dieser Story

```
src/
  components/
    ui/              ← unverändert
    AppHeader.tsx    ← NEU
    LoginScreen.tsx  ← unverändert
  hooks/
    useAuth.ts       ← unverändert (logout() bereits implementiert)
    useAuth.test.ts  ← ggf. ergänzen
  lib/
    spotifyApi.ts    ← NEU (nur getUserProfile)
    spotifyApi.test.ts ← NEU
    auth.ts          ← unverändert
    auth.test.ts     ← unverändert
    utils.ts         ← unverändert
  context/
    AppContext.tsx   ← unverändert
    appReducer.ts   ← GEÄNDERT (userName + SET_USER)
    appReducer.test.ts ← ggf. ergänzen (SET_USER-Case)
  types/
    index.ts         ← GEÄNDERT (userName in AppState, SET_USER in AppAction)
  App.tsx            ← GEÄNDERT (Session-Check + AppHeader einbinden)
  main.tsx           ← unverändert
```

### Project Structure Notes

- Alignment: `AppHeader.tsx` in `src/components/` — entspricht Architecture-Dokument Abschnitt "Complete Project Directory Structure"
- `spotifyApi.ts` in `src/lib/` — architektonische Boundary: einziger Kontaktpunkt zur Spotify Web API
- `userName` in AppState ist die einfachste Lösung für Story-übergreifende Displayname-Verfügbarkeit — kein extra Context

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — Acceptance Criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Storage-Boundary, API-Boundary (spotifyApi.ts als einziger Kontaktpunkt)
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — AppState Shape, AppAction Format
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — AppHeader.tsx, spotifyApi.ts Pfade
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Logout-Icon: Tür/Exit, Farbe #9CA3AF; kein Gradient
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout Foundation] — Header: max-w-6xl, px-6
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button-Hierarchie] — Logout: Destructive-Neutral (Textlink, Farbe #9CA3AF)
- [Source: _bmad-output/implementation-artifacts/1-2-spotify-oauth-pkce-login.md#Code Review Findings] — useAuth.handleCallback nutzen, useRef-Guard, expiresIn korrekt weitergeben
- [Source: _bmad-output/implementation-artifacts/1-2-spotify-oauth-pkce-login.md#Dev Notes] — Stack-Versionen, Naming, Anti-Patterns, display_name (snake_case)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Keine Blocker — alle Tasks ohne Probleme implementiert.

### Completion Notes List

- `src/types/index.ts`: `userName: string | null` zu `AppState`, `SET_USER` zu `AppAction` hinzugefügt
- `src/context/appReducer.ts`: `initialState.userName = null`, neuer `SET_USER`-Case implementiert
- `src/lib/spotifyApi.ts`: Neu angelegt — `getUserProfile(token)` mit internem `spotifyFetch`-Helper, kein localStorage-Zugriff
- `src/components/AppHeader.tsx`: Neu — App-Name links, Displayname + Logout-Button rechts, shadcn/ui `Button variant="ghost"` mit Lucide `LogOut`
- `src/App.tsx`: Session-Check vor OAuth-Callback; `AppHeader` in allen Nicht-Login-Phasen; `callbackHandled.current` Guard deckt auch Session-Check ab
- `src/lib/spotifyApi.test.ts`: Neu — 3 Tests: korrekter Auth-Header, displayName-Mapping, 401/500 Fehlerfall
- `src/context/appReducer.test.ts`: `SET_USER`-Tests ergänzt (2 Tests)
- 35 Tests gesamt, alle grün; `yarn build` ohne TypeScript-Fehler

### File List

- src/types/index.ts (geändert)
- src/context/appReducer.ts (geändert)
- src/context/appReducer.test.ts (geändert)
- src/lib/spotifyApi.ts (neu)
- src/lib/spotifyApi.test.ts (neu)
- src/components/AppHeader.tsx (neu)
- src/App.tsx (geändert)

## Code Review Findings (2026-03-25)

Code Review durchgeführt nach Implementierung. 6 Patches, 1 Defer. Alle unten als Tasks dokumentiert.

### Review Fix Tasks

- [x] **Fix F1 — TOCTOU: `isTokenValid()` und `loadToken()` zusammenfassen** (`src/App.tsx`)
  - Einmal `loadToken()` aufrufen, Ergebnis speichern, dann `isTokenValid()` mit dem Ergebnis prüfen (oder einfach: `const token = loadToken(); if (token && isTokenValid()) { ... }`) — Non-Null-Assertion `!` entfernen.

- [x] **Fix F2 — Catch-Block dispatcht `SET_PHASE: 'login'` explizit** (`src/App.tsx`)
  - Im `.catch()` des Session-Checks: nach `clearToken()` auch `dispatch({ type: 'SET_PHASE', payload: 'login' })` aufrufen. Nicht auf `initialState.phase === 'login'` verlassen.

- [x] **Fix F3 — Fehlertyp-abhängiges Verhalten in `getUserProfile`-Catch** (`src/App.tsx`)
  - Bei 401/403 (Auth-Fehler): `clearToken()` + `dispatch(SET_PHASE: 'login')`.
  - Bei Netzwerkfehler / 5xx (transienter Fehler): Token NICHT löschen, `dispatch(SET_ERROR: 'Verbindungsproblem — bitte Seite neu laden.')` oder ähnlich. Phase bleibt `login`.
  - Erkennung: Der Fehler aus `spotifyFetch` enthält `"Spotify API Fehler: 4xx"` für Auth-Fehler. Alles andere ist transient.

- [x] **Fix F4 — `display_name` nullable absichern + Typ korrigieren** (`src/lib/spotifyApi.ts`, `src/types/index.ts`, `src/context/appReducer.ts`)
  - `getUserProfile` gibt `{ displayName: data.display_name ?? 'Nutzer' }` zurück (Fallback im API-Client, nicht nur in der UI).
  - `SET_USER` Payload-Typ auf `string | null` erweitern (`src/types/index.ts`).
  - `appReducer` SET_USER-Case läuft weiterhin durch, da `userName: string | null`.
  - Test ergänzen: Response mit `display_name: null` → `displayName` ist Fallback-String.

- [x] **Fix F5 — OAuth-Callback-Pfad setzt `userName` (AC 2)** (`src/hooks/useAuth.ts`)
  - Nach erfolgreichem Token-Exchange in `handleCallback`: `getUserProfile(token)` aufrufen und `dispatch({ type: 'SET_USER', payload: displayName })` dispatchen, bevor `SET_PHASE: 'loading'` gesetzt wird.
  - Fehler in `getUserProfile` hier ebenfalls nach Typ behandeln (analog F3).

- [x] **Fix F6 — Logout löscht `userName` aus State** (`src/hooks/useAuth.ts`, `src/types/index.ts`)
  - In `logout()`: nach `clearToken()` + `dispatch(SET_PHASE: 'login')` auch `dispatch({ type: 'SET_USER', payload: null })` aufrufen.
  - Erfordert, dass F4 (Payload-Typ `string | null`) bereits umgesetzt ist.

- [x] **Fix F7 — `response.json()` Fehler abfangen** (`src/lib/spotifyApi.ts`)
  - In `getUserProfile`: `response.json()` in try/catch wrappen. Bei `SyntaxError` einen sprechenden Fehler werfen (z.B. `throw new Error('Spotify API Fehler: ungültige Antwort')`), damit der Catch-Block in App.tsx ihn als transienten Fehler (nicht Auth-Fehler) klassifiziert.

### Abarbeitungsreihenfolge

1. F4 zuerst (Typ-Erweiterung `string | null` — Voraussetzung für F6)
2. F1, F2, F3 gemeinsam (`App.tsx`)
3. F5, F6 gemeinsam (`useAuth.ts`)
4. F7 (`spotifyApi.ts`)
5. Tests anpassen / ergänzen
6. `yarn test:run` + `yarn build` — alle grün

### Defer (kein Fix nötig)

- **F8** — `?code=` URL wird nicht bereinigt wenn gültiger Token vorhanden (seltener Edge-Case, kein Handlungsbedarf in diesem Sprint)

## Change Log

- 2026-03-25: Story 1.3 implementiert — Session-Persistenz, AppHeader mit Logout, minimaler Spotify API Client
- 2026-03-25: Code Review abgeschlossen — 6 Patches, 1 Defer dokumentiert; Spec für F3 (Fehlertyp-Unterscheidung) aktualisiert
- 2026-03-25: Alle 7 Code Review Findings (F1–F7) behoben — 40 Tests grün, yarn build sauber
