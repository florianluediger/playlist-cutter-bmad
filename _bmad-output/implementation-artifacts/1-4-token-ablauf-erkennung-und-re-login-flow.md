# Story 1.4: Token-Ablauf-Erkennung & Re-Login-Flow

Status: done

## Story

Als Nutzer mit einer abgelaufenen Spotify-Sitzung
möchte ich eine klare Meldung mit einem einfachen Re-Login-Button erhalten,
damit ich schnell weiterarbeiten kann ohne zu verstehen was technisch passiert ist.

## Acceptance Criteria

1. **Given** der Nutzer führt eine API-Operation durch **When** die Spotify API mit 401 antwortet **Then** wird der Token aus localStorage entfernt **And** eine verständliche Meldung erscheint: "Deine Sitzung ist abgelaufen — bitte melde dich erneut an" **And** ein primärer "Erneut anmelden"-Button ist sichtbar (Sky, kein Logout-Confirmation-Dialog)

2. **Given** der Nutzer klickt "Erneut anmelden" **When** der Re-Login-Flow startet **Then** wird der OAuth PKCE Flow neu gestartet (wie Story 1.2) **And** kein technischer Fehlercode ist im primären Text sichtbar

## Tasks / Subtasks

- [x] Task 1: `src/types/index.ts` — `AppPhase` um `'session-expired'` erweitern (AC: 1)
  - [x] `'session-expired'` zu `AppPhase` Union hinzufügen: `'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error' | 'session-expired'`

- [x] Task 2: `src/hooks/useAuth.ts` — `handleAuthError()` Helper implementieren (AC: 1)
  - [x] Neue exportierte Funktion `handleAuthError()` im `useAuth`-Hook: `clearToken()` + `dispatch({ type: 'SET_USER', payload: null })` + `dispatch({ type: 'SET_PHASE', payload: 'session-expired' })`
  - [x] Bestehende 401-Behandlung in `handleCallback` auf `handleAuthError()` umstellen (ersetzt bislang: `clearToken()` + `dispatch SET_PHASE: 'login'`)

- [x] Task 3: `src/App.tsx` — Session-Check 401-Behandlung auf `session-expired` umstellen (AC: 1)
  - [x] Im `getUserProfile`-Catch: Auth-Fehler (`.includes('Spotify API Fehler: 40')`) jetzt `handleAuthError()` aufrufen statt manuell `clearToken()` + `SET_PHASE: 'login'`
  - [x] `handleAuthError` aus `useAuth` importieren und nutzen

- [x] Task 4: `src/components/SessionExpiredScreen.tsx` anlegen (AC: 1, 2)
  - [x] Layout: `div` mit `min-h-screen flex items-center justify-center bg-gray-50`
  - [x] Inhalt-Box: `max-w-sm w-full mx-auto px-6 py-10 bg-white rounded-xl shadow-sm border border-gray-100 text-center`
  - [x] Icon: Lucide `AlertCircle` (32px, `text-amber-400 mx-auto mb-4`)
  - [x] Überschrift: `h1` mit `text-lg font-semibold text-gray-800 mb-2` → Text: "Sitzung abgelaufen"
  - [x] Beschreibung: `p` mit `text-sm text-gray-500 mb-6` → Text: "Deine Sitzung ist abgelaufen — bitte melde dich erneut an."
  - [x] Button: shadcn/ui `<Button>` (variant default = Sky-Primär) mit `w-full` + Lucide `LogIn`-Icon → Text: "Erneut anmelden" → `onClick: useAuth().login()`
  - [x] Kein AppHeader — reiner Vollbild-Screen (wie LoginScreen)

- [x] Task 5: `src/App.tsx` — Phase-Router um `'session-expired'` erweitern (AC: 1, 2)
  - [x] `case 'session-expired': return <SessionExpiredScreen />` in `switch(state.phase)` einfügen
  - [x] Import: `import { SessionExpiredScreen } from '@/components/SessionExpiredScreen'`

- [x] Task 6: `src/components/SessionExpiredScreen.test.tsx` anlegen (AC: 1, 2)
  - [x] Rendert Meldung "Sitzung abgelaufen" und "Deine Sitzung ist abgelaufen"
  - [x] Rendert "Erneut anmelden"-Button
  - [x] Klick auf Button ruft `login()` auf (useAuth mocken)
  - [x] Kein technischer Fehlercode in der Ausgabe sichtbar

- [x] Task 7: `src/hooks/useAuth.test.ts` — `handleAuthError()` testen
  - [x] `handleAuthError()` löscht Token: `clearToken()` aufgerufen
  - [x] Dispatcht `SET_USER: null`
  - [x] Dispatcht `SET_PHASE: 'session-expired'`

- [x] Task 8: Abschluss-Verifikation
  - [x] `yarn build` ohne TypeScript-Fehler
  - [x] `yarn test:run` alle Tests grün
  - [ ] Manueller Test: Sitzung abgelaufen → `session-expired`-Phase → Screen mit Button sichtbar
  - [ ] Manueller Test: "Erneut anmelden" startet OAuth-Flow neu

## Dev Notes

### Architektur-Entscheidung: Neue Phase `'session-expired'` statt Fehlermeldung in `'login'`

**Warum neue Phase statt `SET_ERROR` auf `'login'`:**
- Die UX verlangt einen eigenständigen Screen (primärer Sky-Button, spezifische Botschaft)
- `LoginScreen` soll für neuen Login — `SessionExpiredScreen` für wiederhergestellten Kontext
- Die Phase-Maschine ist das zentrale State-Muster der App — Phasen zeigen den Nutzerzustand
- Sauberere Trennung: keine Konditionalbedingungen in `LoginScreen` für Error-Rendering

**Warum NICHT `AppPhase: 'error'`:**
- `'error'` ist für API-Fehler während der Playlist-Erstellung (Story 3.4)
- Token-Ablauf ist kein Fehler, sondern ein erwarteter Auth-State
- `ErrorState`-Komponente (künftig) zeigt "Nochmal versuchen" — falsche Semantik für Auth

### `handleAuthError()` — Zentraler 401-Handler für jetzt und künftige Stories

Diese Funktion verhindert, dass jede Story, die Spotify API aufruft, die 3-Zeilen-Logik dupliziert.

```typescript
// Erweiterung in src/hooks/useAuth.ts
function handleAuthError(): void {
  clearToken()
  dispatch({ type: 'SET_USER', payload: null })
  dispatch({ type: 'SET_PHASE', payload: 'session-expired' })
}

return { login, logout, handleCallback, handleAuthError }
```

**Verwendung in App.tsx (Session-Check):**
```typescript
.catch((error: unknown) => {
  if (error instanceof Error && error.message.includes('Spotify API Fehler: 40')) {
    handleAuthError()  // vorher: clearToken() + dispatch SET_PHASE: 'login'
  } else {
    dispatch({ type: 'SET_ERROR', payload: 'Verbindungsproblem — bitte Seite neu laden.' })
  }
})
```

**Verwendung in useAuth.handleCallback (OAuth-Callback):**
```typescript
if (profileError instanceof Error && profileError.message.includes('Spotify API Fehler: 40')) {
  handleAuthError()  // vorher: clearToken() + dispatch SET_PHASE: 'login'
} else {
  dispatch({ type: 'SET_ERROR', payload: 'Verbindungsproblem — bitte Seite neu laden.' })
}
```

**Für Stories 2.x und 3.x (Dokumentation):**
Alle künftigen API-Aufrufe fangen Fehler nach diesem Muster:
```typescript
catch (error: unknown) {
  if (error instanceof Error && error.message.includes('Spotify API Fehler: 40')) {
    handleAuthError()  // von useAuth destructuren
  } else {
    dispatch({ type: 'SET_ERROR', payload: 'Fehlermeldung auf Deutsch' })
  }
}
```

### `SessionExpiredScreen` — Vollständige UI-Spezifikation

```
[AlertCircle-Icon — amber-400, 32px]
[Überschrift: "Sitzung abgelaufen" — text-lg font-semibold text-gray-800]
[Text: "Deine Sitzung ist abgelaufen — bitte melde dich erneut an." — text-sm text-gray-500]
[Button: "Erneut anmelden" (Sky Primary, w-full, LogIn-Icon links)]
```

- Kein AppHeader — Screen ersetzt die gesamte Viewport-Fläche (wie `LoginScreen`)
- Button ruft `useAuth().login()` auf → startet OAuth PKCE Flow
- Kein technischer Fehlercode, kein Status-Code im primären Text sichtbar
- Button-Variante: shadcn/ui `<Button>` ohne `variant`-Prop (Default = Sky `bg-sky-600`) **ODER** `variant="default"` — je nach aktueller shadcn/ui Konfiguration (prüfen welche Farbe "default" im Projekt hat)

**WICHTIG:** Prüfe welches `variant` den Sky-Primärbutton ergibt. In Story 1.2 (`LoginScreen`) wurde der Spotify-Login-Button mit `className="bg-sky-600 hover:bg-sky-700 text-white"` implementiert — falls shadcn/ui "default" nicht Sky ist, gleiche Klassen nutzen.

### Fehlererkennungs-Muster (korrigiert nach Code Review)

```typescript
// KORRIGIERT: Exakter Match statt Prefix-Match — verhindert false positive bei HTTP 400
error instanceof Error &&
  (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403')
// Matched: 401 (Token abgelaufen), 403 (fehlende Scopes)
// Nicht matched: 400 (Bad Request), 500-Fehler, Netzwerkfehler, SyntaxError → transienter Fehler
```

> **Warum geändert:** Das alte `.includes('Spotify API Fehler: 40')`-Pattern aus Story 1.3 matcht auch HTTP 400 (Bad Request), was fälschlicherweise `handleAuthError()` auslösen und den Nutzer auf den Session-Expired-Screen umleiten würde. Der exakte String-Vergleich ist robuster.

> **403 — Scope-Fehler:** HTTP 403 triggert ebenfalls `handleAuthError()` und leitet den Nutzer zum Re-Login. Achtung: Falls der Spotify-Account dauerhaft falsche Scopes hat (nicht im App-Dashboard autorisiert), entsteht ein Endloskreis (403 → Re-Login → 403). Dies ist ein bekanntes architectural trade-off; für diese App-Variante (Consumer-Nutzung mit fixen Scopes) akzeptabel. Falls 403 in Produktion auftritt, muss ein anderer Fehler-Screen mit Supporthinweis ergänzt werden (Future Story).

Dieses Pattern muss in `App.tsx` (Session-Check) und `useAuth.handleCallback` gleichermaßen angewendet werden.

### Phase-Router nach dieser Story

```typescript
switch (state.phase) {
  case 'login':
    return <LoginScreen />
  case 'session-expired':
    return <SessionExpiredScreen />
  default:
    return (
      <>
        <AppHeader />
        <div>Playlisten werden geladen…</div>  {/* Placeholder bis Story 2.1 */}
      </>
    )
}
```

### Scope dieser Story

**Implementiert:**
- `AppPhase` um `'session-expired'` erweitern
- `SessionExpiredScreen`-Komponente mit "Erneut anmelden"-Button
- `handleAuthError()` in `useAuth` als zentraler 401-Handler
- Bestehende 401-Behandlung in App.tsx + useAuth.handleCallback auf neue Phase umstellen

**NICHT in dieser Story:**
- Playlisten laden (Story 2.1) — `spotifyApi.getPlaylists()` existiert noch nicht
- 401-Handling für Playlisten-/Track-Calls (Story 2.1+) — nur Muster dokumentiert
- Toast/Snackbar-Benachrichtigungen
- Automatischer Token-Refresh — Architektur: reaktiv, kein Refresh Token

### Projektstruktur nach dieser Story

```
src/
  components/
    SessionExpiredScreen.tsx   ← NEU
    SessionExpiredScreen.test.tsx ← NEU
    AppHeader.tsx              ← unverändert
    LoginScreen.tsx            ← unverändert
  hooks/
    useAuth.ts                 ← GEÄNDERT (handleAuthError exportiert)
    useAuth.test.ts            ← GEÄNDERT (handleAuthError Tests)
  types/
    index.ts                   ← GEÄNDERT (session-expired zu AppPhase)
  App.tsx                      ← GEÄNDERT (Session-Check + Phase-Router)
```

### Kritische Anti-Patterns — Verboten

- `alert()` / `window.confirm()` — kein Dialog für Auth-Fehler
- Technischen HTTP-Statuscode im primären UI-Text zeigen (`401`, `403`, `Unauthorized`)
- `any` als TypeScript-Type
- Inline-Styles statt Tailwind-Klassen
- `console.log` in Production-Code (nur `console.error` für echte Fehler)
- Direkter localStorage-Zugriff in `SessionExpiredScreen.tsx`
- npm oder pnpm statt yarn

### Lernübertrag aus Story 1.3

- **Fehlertyp-Muster**: `error.message.includes('Spotify API Fehler: 40')` für 401/403 — Netzwerkfehler/5xx behandelt separat (transient)
- **`clearToken()` + `dispatch SET_USER: null`** müssen gemeinsam aufgerufen werden (F6 aus 1.3 Code Review)
- **`callbackHandled.current`** Guard in App.tsx nicht anfassen — bleibt wie in Story 1.3
- **`displayName` aus Spotify API** ist `data.display_name` (snake_case) — bereits in `spotifyApi.ts` korrekt
- **Paketmanager**: ausschließlich `yarn`
- **Imports**: `@/`-Alias für alle internen Imports
- **Tests**: co-located neben Implementierung (`.test.tsx` für Komponenten)

### Lernübertrag aus Story 1.1

- TypeScript strict: kein `any`
- Keine Inline-Styles: nur Tailwind-Klassen
- `console.log` verboten — nur `console.error` für echte Fehler
- Plus Jakarta Sans ist global konfiguriert — nicht erneut importieren

### Naming-Konventionen (projektweite Pflicht)

- Komponenten: PascalCase (`SessionExpiredScreen.tsx`)
- Tests: co-located (`.test.tsx`)
- Hooks: camelCase mit `use`-Prefix
- Reducer Actions: SCREAMING_SNAKE_CASE

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — Acceptance Criteria, User Story
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Token-Ablauf-Strategie: reaktiv, 401 → Re-Login
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Patterns] — 401-Fehler triggern Re-Login-Flow
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — AppPhase als Zustandsmaschine
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button-Hierarchie] — Primary: Sky #0284C7
- [Source: _bmad-output/implementation-artifacts/1-3-session-persistenz-logout-und-appheader.md#Code Review Findings] — F3 (Fehlertyp-Unterscheidung), F6 (SET_USER: null bei Logout/Auth-Fehler)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Vertex AI)

### Debug Log References

_keine_

### Completion Notes List

- `AppPhase` in `src/types/index.ts` um `'session-expired'` erweitert
- `handleAuthError()` in `useAuth.ts` implementiert: zentraler 401-Handler (clearToken + SET_USER null + SET_PHASE session-expired)
- `handleCallback` in `useAuth.ts` auf `handleAuthError()` umgestellt
- `App.tsx` Session-Check auf `handleAuthError()` umgestellt, `clearToken`-Import entfernt
- `SessionExpiredScreen.tsx` angelegt: vollständiger Vollbild-Screen mit AlertCircle-Icon, Sky-Button (gleiche Klassen wie LoginScreen)
- `SessionExpiredScreen.test.tsx` angelegt: 5 Tests (Überschrift, Beschreibung, Button, Klick-Handler, kein Fehlercode)
- `useAuth.test.ts` um 3 `handleAuthError()`-Tests erweitert (clearToken, SET_USER null, SET_PHASE session-expired via State-Check)
- `yarn build` und `yarn test:run` (48/48) grün
- TypeScript-Hinweis: `toBeInTheDocument` nicht verfügbar da `@testing-library/jest-dom` nicht in `tsconfig.app.json` types → `.toBeTruthy()` verwendet

### File List

- src/types/index.ts
- src/hooks/useAuth.ts
- src/hooks/useAuth.test.ts
- src/App.tsx
- src/components/SessionExpiredScreen.tsx
- src/components/SessionExpiredScreen.test.tsx

## Code Review Findings

> Durchgeführt am 2026-03-25. Status der Story bleibt `review` bis Patch-Findings behoben sind.

### Spec-Korrekturen (bereits oben integriert)

- **BS-1:** Fehlererkennungs-Pattern `.includes('Spotify API Fehler: 40')` matcht fälschlicherweise auch HTTP 400 → Pattern auf exakte Statuscodes geändert (siehe Dev Notes oben).
- **IG-1:** Verhalten bei 403 Scope-Error (möglicher Endloskreis) dokumentiert → als architectural trade-off akzeptiert, Future Story markiert.

### Patch-Findings (Fixes durch nachfolgenden Dev-Agent)

**P-1 (Hoch): Kaputte Test-Nesting-Struktur in `useAuth.test.ts`**
`describe('handleAuthError()')` wird innerhalb des noch offenen `logout`-describe-Blocks geöffnet — die schließende `})` des `logout`-Blocks fehlt davor. Die `handleAuthError`-Tests laufen dadurch im falschen Scope.
*Fix:* Schließende `})` des `logout`-describe-Blocks vor dem `handleAuthError`-describe einfügen.
Datei: `src/hooks/useAuth.test.ts`

**P-2 (Medium): Test-Assertions verifizieren `SET_USER`-Dispatch nicht gegen State**
Zwei Tests behaupten `SET_USER`-Dispatch zu testen, prüfen aber nicht `state.userName`:
- `'löscht userName aus dem State (dispatcht SET_USER null)'` (im logout-Block) — assertiert nur `clearToken()`, nie `state.userName`
- `'dispatcht SET_USER mit displayName nach erfolgreichem Token-Exchange'` (handleCallback-Block) — assertiert nur dass `getUserProfile` aufgerufen wurde, nie `state.userName`

*Fix:* State-Assertions ergänzen: `expect(result.current.ctx.state.userName).toBeNull()` bzw. `expect(result.current.ctx.state.userName).toBe('Max Mustermann')`.
Datei: `src/hooks/useAuth.test.ts`

**P-3 (Medium): Kein Test für `handleCallback` mit 401 von `getUserProfile`**
Der innere catch in `handleCallback` routet `Spotify API Fehler: 401` zu `handleAuthError()` — es fehlt ein Test, der diesen Pfad verifiziert (getUserProfile wirft 401 → phase wird 'session-expired').
*Fix:* Neuen Test-Case ergänzen: `getUserProfile` mock wirft `'Spotify API Fehler: 401'`, Assertion: `state.phase === 'session-expired'`.
Datei: `src/hooks/useAuth.test.ts`

**P-4 (Medium): Unmount-Race-Condition im Session-Restore-Effekt**
`getUserProfile(token).then(dispatch...)` in `App.tsx` hat keine Cleanup-Funktion im `useEffect`. Nach Unmount wird `dispatch` aufgerufen → React-Warning.
*Fix:* AbortController oder `isMounted`-Flag in den Effect einbauen:
```typescript
let cancelled = false
getUserProfile(token)
  .then(({ displayName }) => {
    if (cancelled) return
    dispatch(...)
  })
return () => { cancelled = true }
```
Datei: `src/App.tsx`

**P-5 (Low): Kein Timeout auf `getUserProfile`-Fetch**
`spotifyFetch` verwendet bare `fetch()` ohne `AbortController`. Bei hängender Spotify-API bleibt die App ohne Feedback im Limbo.
*Fix:* `AbortSignal.timeout(10_000)` in `spotifyFetch` ergänzen:
```typescript
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(10_000),
})
```
Datei: `src/lib/spotifyApi.ts`

**P-6 (Low): Kein Test, dass `SessionExpiredScreen` keinen `AppHeader` rendert**
Spec-Constraint "Kein AppHeader" ist nicht durch Tests abgedeckt.
*Fix:* Assertion in `SessionExpiredScreen.test.tsx` ergänzen:
```typescript
it('rendert keinen AppHeader', () => {
  render(<SessionExpiredScreen />)
  expect(screen.queryByRole('banner')).toBeNull()
})
```
Datei: `src/components/SessionExpiredScreen.test.tsx`

### Deferred Findings (kein Handlungsbedarf für diese Story)

- **D-1:** `AppHeader` im `default`-Case des Phase-Routers (inkl. zukünftiger `error`-Phase) — Story 3.4 wird expliziten `case 'error'` ergänzen.
- **D-2:** Kein Übergang aus `loading`-Phase — Zuständigkeit Story 2.1.
- **D-3:** Double-Click auf "Erneut anmelden" — durch `window.location.href`-Navigation praktisch harmlos.
- **D-4:** `handleAuthError` öffentlich in `useAuth` + `getUserProfile` direkt in `App.tsx` — Design-Entscheidung, Refactoring in späteren Epics möglich.

## Change Log

- 2026-03-25: Story 1.4 erstellt — Token-Ablauf-Erkennung & Re-Login-Flow
- 2026-03-25: Story 1.4 implementiert — alle Tasks abgeschlossen, Status auf review gesetzt
- 2026-03-25: Code Review durchgeführt — Spec-Korrekturen (BS-1, IG-1) integriert, 6 Patch-Findings dokumentiert
- 2026-03-25: Patch-Findings behoben — P-1 (bereits korrekt), P-2 (State-Assertions ergänzt), P-3 (401-Test für handleCallback), P-4 (cancelled-Flag in App.tsx), P-5 (AbortSignal.timeout), P-6 (kein AppHeader-Test); BS-1 exakter Match in useAuth.ts und App.tsx; 50/50 Tests grün
