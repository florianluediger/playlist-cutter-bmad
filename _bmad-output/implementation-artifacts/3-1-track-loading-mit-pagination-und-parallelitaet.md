# Story 3.1: Track-Loading mit Pagination und Parallelität

Status: done

## Story

Als System
möchte ich alle Tracks der ausgewählten Quell- und Ausschluss-Playlisten effizient laden,
damit die Diff-Berechnung in Story 3.2 korrekte und vollständige Daten erhält.

## Acceptance Criteria

**AC1 — Paralleles Track-Loading mit Pagination:**
**Given** der Nutzer hat Quell- und/oder Ausschluss-Playlisten ausgewählt und "Erstellen" bestätigt
**When** der Track-Loading-Prozess startet (Phase `creating`)
**Then** ruft `spotifyApi.getPlaylistTracks()` die Tracks aller ausgewählten Playlisten ab
**And** die Spotify API Pagination wird vollständig durchlaufen (max. 100 Items/Call, iteriert bis `next === null`)
**And** alle Playlisten werden parallel geladen via `concurrency.ts` (max. 5 gleichzeitige Requests)

**AC2 — Deduplizierung im Quell-Set:**
**Given** mehrere Quell-Playlisten denselben Track enthalten
**When** die Tracks zusammengeführt werden
**Then** erscheint jede Track-ID maximal einmal im Quell-Set (Deduplizierung in `diffEngine.ts`)

**AC3 — Fehlerbehandlung:**
**Given** die Spotify API liefert einen Fehler während des Track-Loadings
**When** ein Request fehlschlägt
**Then** wird der gesamte Erstellungs-Prozess abgebrochen (kein stummer partieller Erfolg)
**And** der Fehler wird via `dispatch({ type: 'SET_ERROR' })` + `dispatch({ type: 'SET_PHASE', payload: 'error' })` weitergegeben

## Tasks / Subtasks

- [x] `getPlaylistTracks()` in `src/lib/spotifyApi.ts` implementieren (AC: #1)
  - [x] Funktion `getPlaylistTracks(token: string, playlistId: string): Promise<Track[]>` hinzufügen
  - [x] Pagination-Loop: `while (path && pageCount < MAX_PAGES)` — exakt wie `getPlaylists()` aufgebaut
  - [x] API-Pfad: `/playlists/${playlistId}/tracks?limit=100` (max 100 statt 50 wie bei Playlisten)
  - [x] Nur `id` aus `item.track` extrahieren — `Track` ist `{ id: string }`
  - [x] Tracks mit `null`-ID filtern (Podcasts/lokale Dateien liefern null-Tracks)
  - [x] Gleiches Error-Handling wie bestehende Funktionen: `throw new Error('Spotify API Fehler: ...')`

- [x] `src/lib/concurrency.ts` erstellen (AC: #1)
  - [x] Funktion `runWithConcurrency<T>(tasks: Array<() => Promise<T>>, max: number): Promise<T[]>` implementieren
  - [x] Semantik: Immer alle Tasks ausführen, nie mehr als `max` gleichzeitig
  - [x] Gibt `Promise<T[]>` zurück — Ergebnisse in Reihenfolge der Tasks (nicht Abschluss-Reihenfolge)
  - [x] Wenn ein Task fehlschlägt → gesamter `Promise.all` schlägt fehl (kein stilles Verschlucken)

- [x] `src/lib/diffEngine.ts` erstellen (AC: #2)
  - [x] Funktion `buildTrackSet(trackArrays: Track[][]): Set<string>` implementieren
  - [x] Nimmt Array von Track-Arrays (eine Entry pro Playlist) und gibt Set aller eindeutigen Track-IDs zurück
  - [x] Reine Funktion: kein React, kein State, keine API-Calls — vollständig testbar isoliert
  - [x] Vorbereitung für Story 3.2: `calculateDiff(sourceTracks: Set<string>, excludeTracks: Set<string>): string[]` als Stub anlegen (leerer Body, korrekte Signatur)

- [x] App.tsx: Trigger für Track-Loading bei Phase `creating` (AC: #1, #2, #3)
  - [x] `useEffect` hinzufügen, der auf `state.phase === 'creating'` reagiert
  - [x] Token aus `useAuth()` holen (oder direkt aus localStorage via `getStoredToken()` aus `src/lib/auth.ts`)
  - [x] `runWithConcurrency()` für alle selectedSources + selectedExcludes parallel aufrufen (max 5)
  - [x] Progress-Updates via `dispatch({ type: 'SET_PROGRESS', payload: percent })` (0 → 100 während Loading)
  - [x] Geladene Track-Sets in `useRef<{ source: Set<string>; exclude: Set<string> } | null>` speichern — KEIN Reducer-State (transiente Daten, nur für Erstellungs-Flow)
  - [x] Nach erfolgreichem Loading: ref befüllen, dann Phase zu `creating` belassen (Story 3.2 setzt den nächsten Schritt fort)
  - [x] Fehlerfall: `dispatch({ type: 'SET_ERROR', payload: 'Tracks konnten nicht geladen werden.' })` + `dispatch({ type: 'SET_PHASE', payload: 'error' })`

- [x] Tests schreiben
  - [x] `src/lib/spotifyApi.test.ts` erweitern: Tests für `getPlaylistTracks()` — Pagination, null-Track-Filter, Fehler-Propagation
  - [x] `src/lib/concurrency.test.ts` (neu): max-Parallelität-Einschränkung, Ergebnis-Reihenfolge, Fehler-Propagation
  - [x] `src/lib/diffEngine.test.ts` (neu): `buildTrackSet()` — leere Inputs, Duplikate, mehrere Playlisten

## Dev Notes

### Was BEREITS implementiert ist (NICHT neu erstellen)

**`src/lib/spotifyApi.ts` — bestehende Struktur:**
```typescript
// Private Helper — IMMER nutzen statt direktem fetch
async function spotifyFetch(token: string, path: string): Promise<Response> {
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),  // 10s Timeout bereits eingebaut!
  })
  if (!response.ok) throw new Error(`Spotify API Fehler: ${response.status}`)
  return response
}

// Pagination-Muster — getPlaylistTracks() MUSS identisch aufgebaut sein:
let path: string | null = '/me/playlists?limit=50'
while (path && pageCount < MAX_PAGES) {
  const response = await spotifyFetch(token, path)
  // ...
  if (data.next) {
    const nextUrl = new URL(data.next)
    path = nextUrl.pathname + nextUrl.search  // ← next URL zu relativem Pfad konvertieren
  } else {
    path = null
  }
}
```

**`src/types/index.ts` — bereits definiert:**
```typescript
interface Track { id: string }  // ← kein Änderungsbedarf
interface Playlist { id: string; name: string; trackCount: number }
type AppPhase = 'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error' | 'session-expired'
```

**`src/context/appReducer.ts` — bereits verfügbar:**
```typescript
// SET_PROGRESS Action bereits vorhanden:
| { type: 'SET_PROGRESS'; payload: number }
// progress: number im AppState bereits definiert (0–100)

// SET_ERROR Action:
| { type: 'SET_ERROR'; payload: string | null }

// SET_PHASE Action:
| { type: 'SET_PHASE'; payload: AppPhase }
```

**`src/App.tsx` — case 'creating' bereits als Placeholder vorhanden:**
```typescript
case 'creating':
  return (
    <>
      <AppHeader />
      <main aria-live="polite" className="...">
        <div className="h-8 w-8 animate-spin ..." />  // ← Spinner bleibt in Story 3.1
        <p>{state.playlistName}</p>
        <p>Erstelle Playlist…</p>
      </main>
    </>
  )
```
Der Placeholder-Spinner bleibt — CreationPhase-Komponente mit Fortschrittsbalken kommt erst in Story 3.3.

**`src/lib/auth.ts` — Token aus Storage lesen:**
```typescript
// Funktion existiert bereits — für App.tsx useEffect nutzen:
export function getStoredToken(): string | null  // (oder ähnlich — Datei lesen!)
```
→ Lese `src/lib/auth.ts` um die exakte Funktion zu finden.

---

### Neue Dateien — Spezifikation

**`src/lib/concurrency.ts` — Implementierung:**
```typescript
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  max: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let currentIndex = 0

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++
      results[index] = await tasks[index]()
    }
  }

  const workers = Array.from({ length: Math.min(max, tasks.length) }, () => runNext())
  await Promise.all(workers)
  return results
}
```

**`src/lib/diffEngine.ts` — Story 3.1 Scope:**
```typescript
import type { Track } from '@/types'

// Story 3.1: Deduplication
export function buildTrackSet(trackArrays: Track[][]): Set<string> {
  const ids = new Set<string>()
  for (const tracks of trackArrays) {
    for (const track of tracks) {
      ids.add(track.id)
    }
  }
  return ids
}

// Story 3.2 Stub — Signatur anlegen, leerer Body
export function calculateDiff(
  sourceTracks: Set<string>,
  excludeTracks: Set<string>
): string[] {
  // TODO: Story 3.2 implementiert diese Funktion
  throw new Error('calculateDiff: noch nicht implementiert — Story 3.2')
}
```

**`spotifyApi.getPlaylistTracks()` — Spezifikation:**
```typescript
interface TracksPage {
  items: Array<{
    track: { id: string | null } | null  // null bei Podcasts/lokalen Dateien
  }> | null
  next: string | null
}

export async function getPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
  const allTracks: Track[] = []
  let path: string | null = `/playlists/${playlistId}/tracks?limit=100`
  let pageCount = 0

  while (path && pageCount < MAX_PAGES) {
    pageCount++
    const response = await spotifyFetch(token, path)
    let data: TracksPage
    try {
      data = await response.json()
    } catch {
      throw new Error('Spotify API Fehler: ungültige Antwort')
    }

    for (const item of data.items ?? []) {
      if (item.track?.id) {  // null-Tracks herausfiltern (Podcasts, lokale Dateien)
        allTracks.push({ id: item.track.id })
      }
    }

    if (data.next) {
      const nextUrl = new URL(data.next)
      path = nextUrl.pathname + nextUrl.search
    } else {
      path = null
    }
  }

  return allTracks
}
```

**App.tsx `useEffect` — Track-Loading-Trigger:**
```typescript
// Im Komponenten-Body von App (oder einem separaten Hook):
const trackDataRef = useRef<{ source: Set<string>; exclude: Set<string> } | null>(null)

useEffect(() => {
  if (state.phase !== 'creating') return

  let cancelled = false

  async function loadTracks() {
    const token = getStoredToken()  // aus src/lib/auth.ts
    if (!token) {
      dispatch({ type: 'SET_PHASE', payload: 'session-expired' })
      return
    }

    try {
      const allIds = [...state.selectedSources, ...state.selectedExcludes]
      const tasks = allIds.map(
        (playlistId) => () => getPlaylistTracks(token, playlistId)
      )

      // Progress während Loading: 0 → 80% (20% reserviert für Diff+Erstellung in 3.2)
      let completed = 0
      const wrappedTasks = tasks.map((task, i) => async () => {
        const result = await task()
        if (!cancelled) {
          completed++
          dispatch({ type: 'SET_PROGRESS', payload: Math.round((completed / tasks.length) * 80) })
        }
        return result
      })

      const results = await runWithConcurrency(wrappedTasks, 5)
      if (cancelled) return

      const sourceResults = results.slice(0, state.selectedSources.length)
      const excludeResults = results.slice(state.selectedSources.length)

      trackDataRef.current = {
        source: buildTrackSet(sourceResults),
        exclude: buildTrackSet(excludeResults),
      }

      // Story 3.2 wird hier den nächsten Schritt einbauen (Diff + createPlaylist)
    } catch (err) {
      if (!cancelled) {
        dispatch({ type: 'SET_ERROR', payload: 'Tracks konnten nicht geladen werden. Bitte versuche es erneut.' })
        dispatch({ type: 'SET_PHASE', payload: 'error' })
      }
    }
  }

  loadTracks()
  return () => { cancelled = true }
}, [state.phase])  // ← Nur phase als Dependency — nicht state.selectedSources!
```

**Wichtig:** `trackDataRef` muss an einer Stelle leben, auf die auch Story 3.2 Zugriff hat. Am sichersten ist es, `trackDataRef` im App.tsx Root zu definieren und als Prop oder via Closure in die Funktion zu übergeben.

---

### Testing-Anforderungen

**Framework:** Vitest + @testing-library/react (jsdom) — wie in allen vorherigen Stories

**`spotifyApi.test.ts` — neue Tests für `getPlaylistTracks()`:**
```typescript
// Mocking-Pattern aus bestehenden spotifyApi-Tests übernehmen (vi.stubGlobal('fetch', ...))
test('lädt alle Tracks mit Pagination', async () => {
  // Page 1: next-URL gesetzt, Page 2: next null
  // → Ergebnis: alle Items beider Pages
})

test('filtert null-Tracks heraus', async () => {
  // items enthält { track: null } und { track: { id: null } }
  // → Ergebnis: keine null-Tracks im Array
})

test('wirft Error bei API-Fehler', async () => {
  // response.ok = false (z.B. 401)
  // → expect(getPlaylistTracks(...)).rejects.toThrow('Spotify API Fehler')
})
```

**`concurrency.test.ts` — neue Datei:**
```typescript
test('führt alle Tasks aus', async () => {
  // 10 Tasks → alle 10 Ergebnisse vorhanden
})

test('begrenzt parallele Ausführung auf max', async () => {
  // Messe via Counter wie viele Tasks gleichzeitig laufen
  // Bei max=3: counter darf nie > 3 sein
})

test('gibt Ergebnisse in Task-Reihenfolge zurück', async () => {
  // Tasks mit unterschiedlichen Delays → trotzdem Ergebnisse in Reihenfolge [0, 1, 2, ...]
})

test('propagiert Fehler wenn ein Task scheitert', async () => {
  // Ein Task wirft Error → Promise.all schlägt fehl
})
```

**`diffEngine.test.ts` — neue Datei:**
```typescript
test('buildTrackSet: leere Input-Arrays', () => {
  expect(buildTrackSet([])).toEqual(new Set())
  expect(buildTrackSet([[]])).toEqual(new Set())
})

test('buildTrackSet: Duplikate über Playlisten hinweg dedupliciert', () => {
  const result = buildTrackSet([[{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]])
  expect(result).toEqual(new Set(['a', 'b', 'c']))  // 'b' nur einmal
})

test('buildTrackSet: mehrere Playlisten zusammengeführt', () => {
  // 3 Playlisten mit je 2 einzigartigen Tracks → Set mit 6 IDs
})
```

---

### Projekt-Struktur (Änderungen)

```
src/
  lib/
    spotifyApi.ts          ← ANPASSEN: getPlaylistTracks() hinzufügen
    spotifyApi.test.ts     ← ANPASSEN: Tests für getPlaylistTracks()
    concurrency.ts         ← NEU erstellen
    concurrency.test.ts    ← NEU erstellen
    diffEngine.ts          ← NEU erstellen (buildTrackSet + calculateDiff Stub)
    diffEngine.test.ts     ← NEU erstellen
  App.tsx                  ← ANPASSEN: useEffect + trackDataRef für Track-Loading
```

**NICHT anfassen:**
- `src/types/index.ts` — Track-Typ bereits korrekt definiert
- `src/context/appReducer.ts` — alle benötigten Actions (SET_PROGRESS, SET_ERROR, SET_PHASE) existieren
- `src/context/AppContext.tsx` — unverändert
- Alle Komponenten aus Epic 2 — KEIN Anfassen
- `src/lib/auth.ts` — nur lesen welche Funktion Token aus Storage liest, NICHT ändern

---

### Wichtige Architektur-Constraints (PFLICHT)

- **Kein direkter `fetch`** außerhalb von `spotifyFetch()` in spotifyApi.ts — immer den Helper nutzen
- **Kein direkter localStorage-Zugriff** in spotifyApi.ts — Token immer als Parameter
- **`runWithConcurrency()` max=5** — nicht höher (Spotify Rate Limit Schutz)
- **`diffEngine.ts` ist eine reine Funktion** — kein React, kein State, keine API-Calls
- **`trackDataRef` ist NICHT im Reducer** — transiente Daten, die nur während der Erstellung benötigt werden
- **Kein `any` TypeScript-Typ** — explizite Interfaces für API-Response-Shapes
- **Fehlertext immer auf Deutsch** und nutzerfreundlich, kein technischer Code im UI

---

### Learnings aus Epic 2 (wichtige Muster)

- `vi.mock()` muss VOR dem `render()` / `import`-Block stehen — bei globalen Fetch-Mocks: `vi.stubGlobal('fetch', ...)`
- Bestehende `spotifyApi.test.ts` als Vorlage nutzen für Fetch-Mocking-Muster
- Tests co-located neben der Implementierung (`concurrency.test.ts` neben `concurrency.ts`)
- CSS-Animationen gehen in `src/index.css` — aber hier nicht benötigt
- 78 Tests waren grün vor dieser Story — keine Regressionen einführen

### Git-Konvention

Commit-Format: `feat(story-3.1): Track-Loading mit Pagination und Parallelität`

---

### Anti-Pattern-Vermeidung

- **KEIN** `Promise.all(allTasks)` ohne Concurrency-Begrenzung — bei vielen Playlisten würde das hunderte simultane Spotify-Requests auslösen
- **KEIN** stiller Partial-Fail — wenn ein Track-Request scheitert, muss die gesamte Operation abgebrochen werden
- **KEIN** `tracks` in den globalen AppState/Reducer packen — nur `trackDataRef` (useRef)
- **KEIN** Dependency-Array im useEffect mit `state.selectedSources` — nur `[state.phase]` (sonst Re-Trigger bei jedem State-Update)
- **KEINE** `calculateDiff`-Implementierung in dieser Story — das ist Story 3.2; Stub reicht
- **KEINE** UI-Änderungen am Spinner/Placeholder-Screen — CreationPhase-Komponente kommt in Story 3.3
- **KEIN** Auto-Retry — User muss selbst entscheiden (FR20)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (via Vertex AI)

### Debug Log References

### Completion Notes List

- `getPlaylistTracks()` implementiert mit identischem Pagination-Muster wie `getPlaylists()` — max 100 Items/Call, null-Track-Filter für Podcasts/lokale Dateien, fehlerrobust.
- `runWithConcurrency()` implementiert als Worker-Pool-Pattern: N Worker laufen parallel, jeder holt sich den nächsten Task atomisch via `currentIndex++`. Ergebnisse bleiben in Task-Reihenfolge. Fehler propagieren via `Promise.all`.
- `buildTrackSet()` ist reine Funktion ohne Seiteneffekte. `calculateDiff()` ist Story-3.2-Stub der sofort wirft.
- App.tsx: `useEffect` auf `[state.phase]` (nicht selectedSources) um Re-Trigger zu vermeiden. `trackDataRef` im AppContent-Body definiert, sodass Story 3.2 via Closure Zugriff hat.
- 96 Tests grün (78 Vorher + 18 neu): 5 für `getPlaylistTracks()`, 6 für `concurrency`, 5 für `diffEngine`, 2 für `calculateDiff`-Stub.

### File List

- src/lib/spotifyApi.ts
- src/lib/spotifyApi.test.ts
- src/lib/concurrency.ts
- src/lib/concurrency.test.ts
- src/lib/diffEngine.ts
- src/lib/diffEngine.test.ts
- src/App.tsx

### Change Log

- 2026-03-25: Story 3.1 implementiert — Track-Loading mit Pagination und Parallelität. `getPlaylistTracks()` in spotifyApi.ts, `runWithConcurrency()` in concurrency.ts, `buildTrackSet()` + `calculateDiff()`-Stub in diffEngine.ts, useEffect-Trigger in App.tsx. 18 neue Tests, 96 gesamt.
