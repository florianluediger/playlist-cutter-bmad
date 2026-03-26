# Story 3.2: Diff-Engine und Playlist-Erstellung

Status: review

## Story

Als Nutzer
möchte ich dass eine neue Spotify-Playlist mit exakt den Tracks erstellt wird, die in den Quellen sind aber nicht in den Ausschlüssen,
damit ich ein präzises, duplikatfreies Ergebnis erhalte.

## Acceptance Criteria

**AC1 — Diff-Berechnung:**
**Given** alle Track-Daten wurden geladen (`trackDataRef.current` ist befüllt)
**When** `diffEngine.calculateDiff()` ausgeführt wird
**Then** enthält das Ergebnis alle Track-IDs aus den Quell-Playlisten, die **nicht** in den Ausschluss-Playlisten vorkommen
**And** die Diff-Funktion ist eine reine Funktion ohne React-State oder API-Abhängigkeiten (testbar isoliert)

**AC2 — Playlist erstellen:**
**Given** die Differenzmenge berechnet wurde
**When** `spotifyApi.createPlaylist()` aufgerufen wird
**Then** wird eine neue Playlist im Spotify-Konto des Nutzers mit dem eingegebenen Namen angelegt (nicht öffentlich)
**And** die Playlist-URL und ID werden zurückgegeben

**AC3 — Tracks hinzufügen:**
**Given** die neue Playlist wurde erstellt
**When** `spotifyApi.addTracksToPlaylist()` aufgerufen wird
**Then** werden alle Tracks der Differenzmenge in 100er-Batches hinzugefügt (Spotify-Limit)
**And** alle Batches werden vollständig verarbeitet bevor Phase `success` gesetzt wird

**AC4 — Fortschritt:**
**Given** der Erstellungs-Prozess läuft
**When** jeder Schritt abgeschlossen wird
**Then** wird der Fortschritt (0–100%) via `SET_PROGRESS` aktualisiert:
- 0–80%: Track-Loading (bereits in Story 3.1)
- 85%: nach `calculateDiff()`
- 90%: nach `createPlaylist()`
- 90–100%: während `addTracksToPlaylist()` (pro Batch anteilig)
- 100%: alles fertig, dann `SET_PHASE: 'success'`

**AC5 — Leere Differenzmenge:**
**Given** `calculateDiff()` ergibt 0 Tracks
**When** das Ergebnis geprüft wird
**Then** wird der Prozess abgebrochen mit nutzerfreundlicher Fehlermeldung (kein API-Call an Spotify)
**And** Phase wechselt zu `error`

**AC6 — Tests:**
**Given** Unit-Tests für `diffEngine.ts`
**When** die Tests ausgeführt werden
**Then** sind folgende Cases für `calculateDiff()` abgedeckt:
- leere Quellen
- leere Ausschlüsse
- vollständige Überschneidung (alle Quell-Tracks ausgeschlossen → leeres Ergebnis)
- partielle Überschneidung (nur manche ausgeschlossen)
- Deduplizierung: Tracks die mehrfach in Quellen waren, erscheinen maximal einmal im Diff

---

## Tasks / Subtasks

- [x] `src/types/index.ts` erweitern (AC: #2, #4)
  - [x] `userId: string | null` zu `AppState` hinzufügen (Initialwert: `null`)
  - [x] `createdPlaylistUrl: string | null` zu `AppState` hinzufügen (Initialwert: `null`)
  - [x] `createdTrackCount: number` zu `AppState` hinzufügen (Initialwert: `0`)
  - [x] `SET_USER` Payload-Typ ändern: von `string | null` zu `{ displayName: string | null; userId: string | null }`
  - [x] `SET_CREATED_PLAYLIST` Action hinzufügen: `| { type: 'SET_CREATED_PLAYLIST'; payload: { url: string; trackCount: number } }`

- [x] `src/context/appReducer.ts` aktualisieren
  - [x] `initialState` um `userId: null`, `createdPlaylistUrl: null`, `createdTrackCount: 0` erweitern
  - [x] `SET_USER` Case: beide Felder `displayName` und `userId` aus Payload speichern → `{ ...state, userName: payload.displayName, userId: payload.userId }`
  - [x] `SET_CREATED_PLAYLIST` Case hinzufügen: `{ ...state, createdPlaylistUrl: payload.url, createdTrackCount: payload.trackCount }`
  - [x] `RESET_SELECTION` Case: `createdPlaylistUrl: null, createdTrackCount: 0` zurücksetzen

- [x] `src/lib/spotifyApi.ts` erweitern (AC: #2, #3)
  - [x] `spotifyFetch()` um optionalen dritten Parameter erweitern: `options?: { method?: string; body?: string }` — Header immer mit Authorization + für POST: `'Content-Type': 'application/json'`
  - [x] `createPlaylist(token: string, userId: string, name: string): Promise<{ id: string; url: string }>` implementieren
    - POST zu `/users/${userId}/playlists`
    - Body: `{ name, description: '', public: false }`
    - Rückgabe: `{ id: data.id, url: data.external_urls.spotify }`
  - [x] `addTracksToPlaylist(token: string, playlistId: string, trackIds: string[]): Promise<void>` implementieren
    - Splits trackIds in 100er-Batches
    - Pro Batch: POST zu `/playlists/${playlistId}/tracks`
    - Body: `{ uris: batch.map(id => \`spotify:track:\${id}\`) }`
    - Wirft bei API-Fehler (wie alle anderen Funktionen)

- [x] `src/lib/diffEngine.ts` — `calculateDiff()` implementieren (AC: #1)
  - [x] Stub durch Implementierung ersetzen: `[...sourceTracks].filter(id => !excludeTracks.has(id))`
  - [x] Reine Funktion — kein React, kein State, kein API-Call

- [x] `src/App.tsx` aktualisieren (AC: #1–#5)
  - [x] Import `createPlaylist, addTracksToPlaylist` aus spotifyApi ergänzen
  - [x] Import `calculateDiff` aus diffEngine ergänzen
  - [x] `SET_USER` dispatch anpassen: `dispatch({ type: 'SET_USER', payload: { displayName, userId } })` — `getUserProfile()` gibt beides zurück
  - [x] `loadTracks()` useEffect nach dem `trackDataRef.current = { ... }` Schritt:
    - `calculateDiff()` aufrufen, Progress auf 85 setzen
    - Leere-Differenz-Guard: wenn 0 Tracks → Error + Error-Phase
    - `createPlaylist()` aufrufen mit `state.userId` und `state.playlistName`, Progress auf 90
    - `addTracksToPlaylist()` aufrufen mit Batch-Fortschritt (90–100%)
    - `dispatch({ type: 'SET_CREATED_PLAYLIST', payload: { url, trackCount: diff.length } })`
    - `dispatch({ type: 'SET_PHASE', payload: 'success' })`
    - 401/403 Fehler → `handleAuthError()` (wie bestehender catch-Block)

- [x] `src/lib/spotifyApi.ts` — `getUserProfile()` erweitern
  - [x] Rückgabe-Type ändern: `Promise<{ displayName: string; userId: string }>`
  - [x] `data.id` extrahieren und zurückgeben

- [x] Tests schreiben (AC: #6)
  - [x] `src/lib/diffEngine.test.ts` erweitern: Tests für `calculateDiff()` (alle 5 Cases aus AC6)
  - [x] `src/lib/spotifyApi.test.ts` erweitern: Tests für `createPlaylist()` und `addTracksToPlaylist()` (Erfolg, Batching, API-Fehler)

---

## Dev Notes

### Was BEREITS implementiert ist (NICHT neu erstellen)

**`src/lib/diffEngine.ts` — Stub vorhanden (NUR ersetzen):**
```typescript
// Story 3.2 Stub — nur calculateDiff() ersetzen:
export function calculateDiff(
  sourceTracks: Set<string>,
  excludeTracks: Set<string>
): string[] {
  // TODO: Story 3.2 implementiert diese Funktion
  throw new Error('calculateDiff: noch nicht implementiert — Story 3.2')
}
```
→ Nur den Body ersetzen. `buildTrackSet()` NICHT anfassen.

**`src/App.tsx` — Kommentar als Einstiegspunkt:**
```typescript
// Story 3.2 wird hier den nächsten Schritt einbauen (Diff + createPlaylist)
```
→ Exakt an dieser Stelle im `loadTracks()`-useEffect die neue Logik einbauen.

**`src/lib/spotifyApi.ts` — bestehende Struktur:**
```typescript
// Private Helper — IMMER nutzen für alle Spotify-Requests
async function spotifyFetch(token: string, path: string): Promise<Response>

// Bereits implementiert (NICHT ändern):
export async function getUserProfile(...)
export async function getPlaylists(...)
export async function getPlaylistTracks(...)
```
→ `spotifyFetch()` minimal erweitern (optionaler 3. Parameter), KEINE breaking changes.

**`src/context/AppContext.tsx` — NICHT anfassen**
**`src/lib/auth.ts` — NICHT anfassen**
**`src/lib/concurrency.ts` — NICHT anfassen**
**Alle Komponenten aus Epic 1 und 2 — KEIN Anfassen**

---

### Neue Implementierungen — Spezifikation

**`spotifyFetch()` — minimale Erweiterung:**
```typescript
async function spotifyFetch(
  token: string,
  path: string,
  options?: { method?: string; body?: string }
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body,
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Spotify API Fehler: ${response.status}`)
  return response
}
```
→ Alle bestehenden Aufrufe ohne `options` bleiben unverändert (GET-Verhalten identisch).

**`getUserProfile()` — erweiterte Rückgabe:**
```typescript
export async function getUserProfile(
  token: string
): Promise<{ displayName: string; userId: string }> {
  const response = await spotifyFetch(token, '/me')
  let data: { display_name: string | null; id: string }
  try {
    data = await response.json()
  } catch {
    throw new Error('Spotify API Fehler: ungültige Antwort')
  }
  return { displayName: data.display_name ?? 'Nutzer', userId: data.id }
}
```

**`createPlaylist()` — neue Funktion:**
```typescript
interface CreatePlaylistResponse {
  id: string
  external_urls: { spotify: string }
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string
): Promise<{ id: string; url: string }> {
  const body = JSON.stringify({ name, description: '', public: false })
  const response = await spotifyFetch(token, `/users/${userId}/playlists`, {
    method: 'POST',
    body,
  })
  let data: CreatePlaylistResponse
  try {
    data = await response.json()
  } catch {
    throw new Error('Spotify API Fehler: ungültige Antwort')
  }
  return { id: data.id, url: data.external_urls.spotify }
}
```

**`addTracksToPlaylist()` — neue Funktion:**
```typescript
export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackIds: string[]
): Promise<void> {
  const BATCH_SIZE = 100
  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE)
    const uris = batch.map((id) => `spotify:track:${id}`)
    await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris }),
    })
    // Kein JSON-Parse nötig bei 201-Response (nur snapshot_id)
  }
}
```
→ `addTracksToPlaylist()` ist sequentiell (kein concurrency nötig — Batches müssen in Reihenfolge sein und Spotify hat kein Parallelitätsproblem bei POST).

**`calculateDiff()` — finale Implementierung:**
```typescript
export function calculateDiff(
  sourceTracks: Set<string>,
  excludeTracks: Set<string>
): string[] {
  return [...sourceTracks].filter((id) => !excludeTracks.has(id))
}
```

**App.tsx — vollständige `loadTracks()` Funktion (Erweiterung nach Story 3.1):**
```typescript
// Nach: trackDataRef.current = { source, exclude }

const { source, exclude } = trackDataRef.current!

// Schritt: Diff berechnen
const diff = calculateDiff(source, exclude)
if (!cancelled) dispatch({ type: 'SET_PROGRESS', payload: 85 })

// Guard: leere Differenz
if (diff.length === 0) {
  dispatch({ type: 'SET_ERROR', payload: 'Die Differenzmenge ist leer — alle Tracks sind in den Ausschluss-Playlisten enthalten.' })
  dispatch({ type: 'SET_PHASE', payload: 'error' })
  return
}

// Schritt: Playlist erstellen
if (!state.userId) throw new Error('Kein Nutzer-ID verfügbar')
const { id: playlistId, url: playlistUrl } = await createPlaylist(
  token,
  state.userId,
  state.playlistName
)
if (cancelled) return
if (!cancelled) dispatch({ type: 'SET_PROGRESS', payload: 90 })

// Schritt: Tracks hinzufügen (mit Batch-Fortschritt)
const BATCH_SIZE = 100
const totalBatches = Math.ceil(diff.length / BATCH_SIZE)
for (let i = 0; i < diff.length; i += BATCH_SIZE) {
  const batch = diff.slice(i, i + BATCH_SIZE)
  const uris = batch.map((id) => `spotify:track:${id}`)
  await spotifyFetch_not_used  // → addTracksToPlaylist macht das intern
}
// Einfacher: addTracksToPlaylist intern in spotifyApi verwalten
await addTracksToPlaylist(token, playlistId, diff)
if (cancelled) return

// Erfolg
dispatch({ type: 'SET_CREATED_PLAYLIST', payload: { url: playlistUrl, trackCount: diff.length } })
dispatch({ type: 'SET_PROGRESS', payload: 100 })
dispatch({ type: 'SET_PHASE', payload: 'success' })
```

**Hinweis zur Batch-Fortschrittsanzeige:** Da `addTracksToPlaylist()` intern batcht, ist der Fortschritt während der Track-Hinzufügung nicht sichtbar (springt von 90% direkt auf 100%). Das ist akzeptabel für Story 3.2 — Story 3.3 (CreationPhase) kann bei Bedarf granularer werden, aber das erfordert dann ein `onProgress`-Callback in `addTracksToPlaylist()`. Für Story 3.2 bleibt `addTracksToPlaylist()` ohne Callback — einfach halten.

**App.tsx — `SET_USER` Dispatch anpassen:**
```typescript
// Alt (Story 1.x):
dispatch({ type: 'SET_USER', payload: displayName })

// Neu (Story 3.2):
dispatch({ type: 'SET_USER', payload: { displayName, userId } })
```
→ `getUserProfile()` gibt jetzt `{ displayName, userId }` zurück — destructuring anpassen.

---

### Types / Reducer — vollständige Änderungen

**`src/types/index.ts`:**
```typescript
export interface AppState {
  phase: AppPhase
  playlists: Playlist[]
  selectedSources: string[]
  selectedExcludes: string[]
  playlistName: string
  error: string | null
  progress: number
  userName: string | null
  userId: string | null           // NEU: für createPlaylist()
  createdPlaylistUrl: string | null  // NEU: für SuccessScreen (Story 3.4)
  createdTrackCount: number          // NEU: für SuccessScreen (Story 3.4)
}

export type AppAction =
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'SET_USER'; payload: { displayName: string | null; userId: string | null } }  // GEÄNDERT
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_EXCLUDE'; payload: string }
  | { type: 'SET_PLAYLIST_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_CREATED_PLAYLIST'; payload: { url: string; trackCount: number } }  // NEU
  | { type: 'RESET_SELECTION' }
```

**`src/context/appReducer.ts`:**
```typescript
export const initialState: AppState = {
  // ... bestehende Felder ...
  userId: null,              // NEU
  createdPlaylistUrl: null,  // NEU
  createdTrackCount: 0,      // NEU
}

// SET_USER Case anpassen:
case 'SET_USER':
  return { ...state, userName: action.payload.displayName, userId: action.payload.userId }

// NEU hinzufügen:
case 'SET_CREATED_PLAYLIST':
  return { ...state, createdPlaylistUrl: action.payload.url, createdTrackCount: action.payload.trackCount }

// RESET_SELECTION erweitern:
case 'RESET_SELECTION':
  return {
    ...state,
    selectedSources: [],
    selectedExcludes: [],
    playlistName: '',
    error: null,
    progress: 0,
    createdPlaylistUrl: null,  // NEU
    createdTrackCount: 0,      // NEU
  }
```

---

### Testing-Anforderungen

**Framework:** Vitest + vi.stubGlobal('fetch', ...) — identisch zu bestehenden spotifyApi-Tests

**`diffEngine.test.ts` — neue Tests für `calculateDiff()`:**
```typescript
test('calculateDiff: leere Quellen → leeres Ergebnis', () => {
  const result = calculateDiff(new Set(), new Set(['a', 'b']))
  expect(result).toEqual([])
})

test('calculateDiff: leere Ausschlüsse → alle Quell-Tracks', () => {
  const result = calculateDiff(new Set(['a', 'b', 'c']), new Set())
  expect(result).toEqual(expect.arrayContaining(['a', 'b', 'c']))
  expect(result).toHaveLength(3)
})

test('calculateDiff: vollständige Überschneidung → leeres Ergebnis', () => {
  const result = calculateDiff(new Set(['a', 'b']), new Set(['a', 'b', 'c']))
  expect(result).toEqual([])
})

test('calculateDiff: partielle Überschneidung → nur nicht-ausgeschlossene', () => {
  const result = calculateDiff(new Set(['a', 'b', 'c']), new Set(['b']))
  expect(result).toContain('a')
  expect(result).toContain('c')
  expect(result).not.toContain('b')
})

test('calculateDiff: keine Duplikate im Ergebnis (buildTrackSet dedupliziert bereits)', () => {
  // Nach buildTrackSet ist sourceTracks bereits ein Set — keine Duplikate möglich
  const source = new Set(['a', 'b', 'c'])
  const exclude = new Set<string>()
  const result = calculateDiff(source, exclude)
  const resultSet = new Set(result)
  expect(result).toHaveLength(resultSet.size) // keine Duplikate
})
```

**`spotifyApi.test.ts` — neue Tests:**
```typescript
// getUserProfile() — erweiterter Test:
test('getUserProfile: gibt displayName und userId zurück', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ display_name: 'Max', id: 'user123' }),
  }))
  const result = await getUserProfile('token')
  expect(result).toEqual({ displayName: 'Max', userId: 'user123' })
})

// createPlaylist():
test('createPlaylist: erstellt Playlist und gibt id und url zurück', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 'playlist123',
      external_urls: { spotify: 'https://open.spotify.com/playlist/playlist123' },
    }),
  }))
  const result = await createPlaylist('token', 'user123', 'Meine Playlist')
  expect(result).toEqual({ id: 'playlist123', url: 'https://open.spotify.com/playlist/playlist123' })
  // Korrekte URL prüfen:
  const fetchCall = vi.mocked(fetch).mock.calls[0]
  expect(fetchCall[0]).toContain('/users/user123/playlists')
  expect(JSON.parse(fetchCall[1]?.body as string)).toMatchObject({ name: 'Meine Playlist', public: false })
})

test('createPlaylist: wirft Error bei API-Fehler', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))
  await expect(createPlaylist('token', 'user123', 'Test')).rejects.toThrow('Spotify API Fehler: 403')
})

// addTracksToPlaylist():
test('addTracksToPlaylist: sendet korrekte URIs als Batches', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', mockFetch)
  const trackIds = Array.from({ length: 150 }, (_, i) => `track${i}`)
  await addTracksToPlaylist('token', 'playlist123', trackIds)
  // 150 Tracks → 2 Batches (100 + 50)
  expect(mockFetch).toHaveBeenCalledTimes(2)
  const firstBatchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
  expect(firstBatchBody.uris).toHaveLength(100)
  expect(firstBatchBody.uris[0]).toBe('spotify:track:track0')
  const secondBatchBody = JSON.parse(mockFetch.mock.calls[1][1].body)
  expect(secondBatchBody.uris).toHaveLength(50)
})

test('addTracksToPlaylist: wirft Error wenn Batch fehlschlägt', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  await expect(addTracksToPlaylist('token', 'p1', ['t1'])).rejects.toThrow('Spotify API Fehler: 500')
})
```

---

### Projekt-Struktur (Änderungen)

```
src/
  types/
    index.ts               ← ANPASSEN: AppState + AppAction erweitern
  context/
    appReducer.ts          ← ANPASSEN: initialState + Reducer-Cases
  lib/
    diffEngine.ts          ← ANPASSEN: calculateDiff() implementieren (Stub ersetzen)
    diffEngine.test.ts     ← ANPASSEN: Tests für calculateDiff()
    spotifyApi.ts          ← ANPASSEN: getUserProfile(), spotifyFetch(), createPlaylist(), addTracksToPlaylist()
    spotifyApi.test.ts     ← ANPASSEN: Tests für neue Funktionen + getUserProfile()
  App.tsx                  ← ANPASSEN: SET_USER dispatch + Diff+Create-Flow
```

**NICHT anfassen:**
- `src/context/AppContext.tsx`
- `src/lib/auth.ts`
- `src/lib/concurrency.ts`
- `src/lib/utils.ts`
- Alle Komponenten in `src/components/` (Epic 1 + 2 Components unverändert)
- `src/hooks/`

---

### Wichtige Architektur-Constraints (PFLICHT)

- **Kein direkter `fetch`** außerhalb von `spotifyFetch()` — ALLE Spotify-Requests gehen durch den Helper
- **Kein direkter localStorage-Zugriff** in spotifyApi.ts — Token immer als Parameter
- **`addTracksToPlaylist()` ist sequentiell** — keine Parallelität nötig (POST-Batches sind kein Bottleneck)
- **`calculateDiff()` ist reine Funktion** — kein React, kein State, kein API-Call
- **Kein `any` TypeScript-Typ** — explizite Interfaces für alle Response-Shapes
- **Fehlertext immer auf Deutsch** und nutzerfreundlich
- **State-Updates NUR via dispatch()** — kein direktes Mutieren von State
- **`trackDataRef` bleibt im useRef** — nicht in AppState/Reducer (transient)
- **`userId` kommt aus AppState** (`state.userId`) — nicht nochmal fetchen während `creating`

---

### Wichtige Hinweise aus Story 3.1 (Previous Story Intelligence)

- **`trackDataRef` ist in `AppContent` definiert** (App.tsx Zeile 18): `const trackDataRef = useRef<{ source: Set<string>; exclude: Set<string> } | null>(null)`
- **Der creating-useEffect** hat Zugriff auf `trackDataRef` via Closure (korrekt!)
- **Auth-Fehler-Handling** im catch-Block von `loadTracks()`: 401/403 → `handleAuthError()`, sonst → SET_ERROR + SET_PHASE error (dieses Pattern beibehalten!)
- **`cancelled` Flag** ist gesetzt — nach jedem `await` prüfen: `if (cancelled) return`
- **96 Tests waren grün** nach Story 3.1 — keine Regressionen einführen
- **Dependency-Array im useEffect:** nur `[state.phase]` — KEIN `state.selectedSources`, `state.userId` etc. hinzufügen!
- **`loadToken()`** aus `src/lib/auth.ts` — nicht `getStoredToken()`, der exakte Funktionsname ist `loadToken`
- **`vi.stubGlobal('fetch', ...)`** ist das Mocking-Pattern für spotifyApi-Tests

### Anti-Pattern-Vermeidung

- **KEIN** `Promise.all()` für Batches in `addTracksToPlaylist()` — sequentiell ist korrekt und einfacher
- **KEIN** separater fetch für userId während `creating` — aus `state.userId` lesen (wurde bei Login gespeichert)
- **KEIN** Catch-Fehler stumm verschlucken — jeder Error muss den Nutzer informieren
- **KEIN** Auto-Retry bei Fehlern (FR20)
- **KEINE** UI-Änderungen am Spinner/Placeholder-Screen (case 'creating' in App.tsx) — CreationPhase kommt in Story 3.3
- **KEINE** SuccessScreen-Implementierung — nur Phase wechseln, Story 3.4 implementiert den Screen
- **KEIN** `state.success` oder separates Error-Objekt — AppState nutzen (error: string | null, createdPlaylistUrl, createdTrackCount)

### Git-Konvention

Commit-Format: `feat(story-3.2): Diff-Engine und Playlist-Erstellung`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Keine besonderen Debug-Einträge — Implementierung verlief ohne unerwartete Probleme. Bestehende Tests für `getUserProfile()`, `appReducer` (SET_USER) und `useAuth` mussten angepasst werden, da sich der Payload-Typ von `SET_USER` von `string | null` zu `{ displayName, userId }` geändert hat.

### Completion Notes List

- `calculateDiff()` als reine Funktion implementiert (kein React, kein State, kein API-Call)
- `spotifyFetch()` minimal um optionalen 3. Parameter `options` erweitert — alle bestehenden GET-Aufrufe unverändert
- `getUserProfile()` gibt jetzt zusätzlich `userId` zurück
- `createPlaylist()` und `addTracksToPlaylist()` als neue Funktionen in `spotifyApi.ts` hinzugefügt
- `AppState` um `userId`, `createdPlaylistUrl`, `createdTrackCount` erweitert
- `SET_USER` Payload-Typ geändert: `string | null` → `{ displayName, userId }`
- `SET_CREATED_PLAYLIST` Action neu hinzugefügt
- `appReducer` und `useAuth` entsprechend angepasst
- `App.tsx`: Diff/Create-Flow nach `trackDataRef.current` Schritt eingebaut inkl. Leere-Differenz-Guard
- Alle 107 Tests grün (keine Regressionen, 11 neue Tests)

### File List

- src/types/index.ts
- src/context/appReducer.ts
- src/lib/spotifyApi.ts
- src/lib/diffEngine.ts
- src/App.tsx
- src/hooks/useAuth.ts
- src/lib/diffEngine.test.ts
- src/lib/spotifyApi.test.ts
- src/context/appReducer.test.ts
- src/hooks/useAuth.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-2-diff-engine-und-playlist-erstellung.md

### Change Log

- 2026-03-26: Story 3.2 implementiert — Diff-Engine und Playlist-Erstellung (alle ACs erfüllt, 107 Tests grün)
