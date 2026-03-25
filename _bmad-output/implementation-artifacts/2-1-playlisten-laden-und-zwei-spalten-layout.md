# Story 2.1: Playlisten laden und Zwei-Spalten-Layout

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Als angemeldeter Nutzer
möchte ich meine Spotify-Playlisten im Zwei-Spalten-Layout sehen,
damit ich sofort verstehe, welche ich als Quellen und welche als Ausschlüsse wählen kann.

## Acceptance Criteria

1. **Skeleton-Rows während Laden:** Wenn die App die Playlisten-Ansicht lädt (Phase `loading`), werden in beiden Spalten Skeleton-Rows mit Shimmer-Animation als Lade-Platzhalter angezeigt.

2. **Playlisten-Anzeige:** Wenn Playlisten-Daten von `getPlaylists()` geladen wurden (Phase `selection`), erscheinen alle Playlisten in beiden Spalten als `PlaylistRow`-Einträge (Name + Track-Anzahl). Die linke Spalte trägt den Header "Quellen" mit `+`-Icon-Pill in Sky. Die rechte Spalte trägt den Header "Ausschlüsse" mit `−`-Icon-Pill in Rose.

3. **Responsive Layout:** Das Layout ist zweispaltig auf ≥768px (`md:grid-cols-2`) und einspaltig auf <768px.

4. **EmptyState:** Wenn keine Playlisten vorhanden sind, wird die `EmptyState`-Komponente mit erklärendem Text und Link zu Spotify angezeigt. Kein leeres Zwei-Spalten-Layout.

5. **Performance:** Die Ladezeit ist unter 3 Sekunden nach erfolgtem Login.

## Tasks / Subtasks

- [x] `getPlaylists()` in `spotifyApi.ts` implementieren (AC: #1, #2, #5)
  - [x] Spotify-Endpunkt `/me/playlists?limit=50` abfragen und Pagination bis `next === null` durchlaufen
  - [x] Resultat als `Playlist[]` zurückgeben (`{ id, name, trackCount }`)
  - [x] 401/403 Fehler als `Error('Spotify API Fehler: 401')` weiterwerfen (bestehende Konvention)

- [x] Playlist-Loading-Logik in `App.tsx` einbauen (AC: #1, #2, #4)
  - [x] In `AppContent`: wenn Phase `loading` → `getPlaylists(token)` aufrufen
  - [x] Bei Erfolg: `dispatch({ type: 'SET_PLAYLISTS', payload })` dann `dispatch({ type: 'SET_PHASE', payload: 'selection' })`
  - [x] Bei 401/403: `handleAuthError()` aufrufen
  - [x] Bei anderen Fehlern: `dispatch({ type: 'SET_ERROR', payload: 'Playlisten konnten nicht geladen werden — bitte Seite neu laden.' })`

- [x] `ColumnHeader.tsx` erstellen (AC: #2)
  - [x] Props: `role: 'source' | 'exclude'`, `selectedCount: number`
  - [x] Anatomie: `[Icon-Pill (+/−)] [Titel] [Badge: "N ausgewählt"]` — Badge wird nur angezeigt wenn `selectedCount > 0`
  - [x] Sky-Hintergrund für `source`, Rose-Hintergrund für `exclude`

- [x] `PlaylistRow.tsx` erstellen (AC: #2)
  - [x] Props: `name: string`, `trackCount: number`, `role: 'source' | 'exclude'`, `selected: boolean`, `onToggle: () => void`
  - [x] Anatomie: `[Checkbox] [Playlist-Name] [Track-Anzahl]`
  - [x] shadcn/ui `Checkbox` als Basis verwenden — keine eigene Checkbox-Logik
  - [x] `role="checkbox"`, `aria-checked`, Space = toggle (Accessibility)
  - [x] CSS-Klassen für selected-States vorbereiten (Sky/Rose-Tint + Border) — Interaktion folgt in Story 2.2

- [x] `EmptyState.tsx` erstellen (AC: #4)
  - [x] Erklärender Text: z.B. "Keine Playlisten gefunden"
  - [x] Link zu `https://open.spotify.com` zum Erstellen von Playlisten

- [x] `PlaylistColumns.tsx` erstellen (AC: #1, #2, #3)
  - [x] Skeleton-Rendering während Phase `loading`: beide Spalten mit 5–8 Skeleton-Rows (Shimmer-Animation)
  - [x] Playlisten-Rendering während Phase `selection`: beide Spalten mit allen Playlisten
  - [x] Responsive: `grid grid-cols-1 md:grid-cols-2 gap-6`
  - [x] EmptyState wenn `playlists.length === 0`

- [x] `App.tsx` um Selection/Loading-Phase erweitern (AC: #1, #2, #3)
  - [x] Phase `loading`: `<AppHeader /> <PlaylistColumns />` rendern (Columns zeigen Skeleton)
  - [x] Phase `selection`: `<AppHeader /> <PlaylistColumns />` rendern (Columns zeigen Daten)
  - [x] Bisheriger Fallback-Text `"Playlisten werden geladen…"` ersetzen

- [x] `PlaylistRow.test.tsx` schreiben (co-located)
  - [x] Rendert Name und Track-Anzahl korrekt
  - [x] Checkbox hat `aria-checked` gesetzt
  - [x] `onToggle` wird bei Klick aufgerufen

## Dev Notes

### Was diese Story implementiert vs. was folgt

**Story 2.1 (diese Story):**
- Playlisten laden und anzeigen
- Skeleton-Loading-UI
- EmptyState
- PlaylistRow-Komponente mit vollständigem Props-Interface (aber ohne Auswahl-Wiring)

**Story 2.2 (NICHT jetzt):**
- Auswahl-Toggle-Logik (selectedSources / selectedExcludes aus Context)
- Checkbox-Pop-Animation (scale 0.82 → 1.12 → 1.0)
- Row-Highlight (Sky/Rose-Tint + Border bei Auswahl)
- Badge-Bounce-Animation im ColumnHeader
- Duplikat-Warnung

→ `PlaylistRow.tsx` die Props `selected` und `onToggle` bereits definieren, aber die Selektion in Story 2.2 verdrahten. In dieser Story können beide Spalten `selected={false}` und `onToggle={() => {}}` als Platzhalter bekommen, ODER direkt aus dem Context lesen und dispatchen — der Architect empfiehlt die direkte Context-Verdrahtung bereits hier, da die Actions `TOGGLE_SOURCE`/`TOGGLE_EXCLUDE` bereits im Reducer existieren.

### Bestehende Implementierung (NICHT neu erstellen)

- **`src/types/index.ts`:** `Playlist`, `Track`, `AppPhase`, `AppState`, `AppAction` — **vollständig definiert, nicht ändern**
- **`src/context/appReducer.ts`:** `SET_PLAYLISTS`, `TOGGLE_SOURCE`, `TOGGLE_EXCLUDE`, `RESET_SELECTION` — **bereits implementiert**
- **`src/context/AppContext.tsx`:** Provider + `useAppContext()` — **fertig**
- **`src/lib/auth.ts`:** `loadToken()`, `isTokenValid()`, `clearToken()` — **fertig**
- **`src/hooks/useAuth.ts`:** `handleAuthError()`, `login()`, `logout()` — **fertig**
- **`src/components/AppHeader.tsx`:** Header mit User-Info + Logout — **fertig**
- **`src/lib/spotifyApi.ts`:** Hat bereits `getUserProfile()` und `spotifyFetch()` — `getPlaylists()` **ergänzen**, nicht neu schreiben

### API-Implementierung: `getPlaylists()`

Spotify-Endpunkt: `GET /v1/me/playlists?limit=50`

Response-Shape (relevant):
```typescript
{
  items: Array<{
    id: string
    name: string
    tracks: { total: number }
  }>
  next: string | null  // vollständige URL oder null am Ende
}
```

Pagination-Strategie: `next`-URL iterieren bis `null`. Da `spotifyFetch()` `${SPOTIFY_BASE_URL}${path}` zusammensetzt, muss der Base-URL-Teil aus `next` entfernt werden:
```typescript
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'  // bereits definiert
// next URL Format: 'https://api.spotify.com/v1/me/playlists?offset=50&limit=50'
path = data.next.slice(SPOTIFY_BASE_URL.length)  // → '/me/playlists?offset=50&limit=50'
```

### Skeleton-Animation

Tailwind CSS `animate-pulse` (built-in) für Shimmer-Effekt verwenden. Kein zusätzliches Package nötig. Beispiel-Markup für eine Skeleton-Row:
```tsx
<div className="flex items-center gap-3 py-3 px-4 animate-pulse">
  <div className="h-4 w-4 bg-gray-200 rounded" />
  <div className="h-4 flex-1 bg-gray-200 rounded" />
  <div className="h-4 w-12 bg-gray-200 rounded" />
</div>
```

### Farb-System (aus UX-Spec)

- **Sky (Quellen):** `#0284C7` → Tailwind: `sky-600`
- **Rose (Ausschlüsse):** `#C9445A` → keine direkte Tailwind-Klasse, `bg-rose-500` oder inline hex für den Icon-Pill
- **Zeilenhöhe:** ~46px → `py-3 px-4`
- **Layout-Spacing:** `gap-6`, Container `max-w-6xl`, `p-6` bis `p-8`

**Icon-Pills in ColumnHeader:**
- Quellen: `+`-Zeichen auf Sky-Hintergrund (kleines abgerundetes Badge)
- Ausschlüsse: `−`-Zeichen auf Rose-Hintergrund

### Layout-Struktur (App.tsx)

Der bestehende Switch in `App.tsx` (Zeile 60-72) muss um `loading` und `selection` erweitert werden:

```tsx
case 'loading':
  return (
    <>
      <AppHeader />
      <PlaylistColumns />  {/* zeigt Skeleton */}
    </>
  )
case 'selection':
  return (
    <>
      <AppHeader />
      <PlaylistColumns />  {/* zeigt Playlisten */}
    </>
  )
```

`PlaylistColumns` erkennt den Phase-Zustand selbst über `useAppContext()`.

### Token-Zugriff für Playlist-Loading

In `App.tsx` wird `loadToken()` aus `@/lib/auth` importiert (bereits importiert). Das gleiche Muster wie beim `getUserProfile()`-Aufruf (Zeile 22) verwenden:
```typescript
const token = loadToken()
if (!token) return  // Sicherheitsnetz — sollte nicht vorkommen in 'loading' Phase
```

### Fehler-Handling-Konvention

Bestehende Konvention aus `App.tsx` (Zeile 33-38) und `useAuth.ts` (Zeile 35-44):
```typescript
if (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403') {
  handleAuthError()
} else {
  dispatch({ type: 'SET_ERROR', payload: 'Fehlermeldung auf Deutsch' })
}
```

### Testing-Konvention

- **Framework:** Vitest + @testing-library/react (jsdom)
- **Co-located:** `PlaylistRow.test.tsx` neben `PlaylistRow.tsx`
- **Setup:** `src/test/setup.ts` importiert `@testing-library/jest-dom`
- **Import-Alias:** `@/components/...` funktioniert in Tests (via vitest.config.ts)
- Kein `any` in Tests, keine Mocks der gesamten Context (direkter render mit Provider wrappen wenn nötig)

### Project Structure Notes

Neue Dateien dieser Story:
```
src/
  components/
    PlaylistRow.tsx           ← NEU
    PlaylistRow.test.tsx      ← NEU (co-located)
    ColumnHeader.tsx          ← NEU
    PlaylistColumns.tsx       ← NEU
    EmptyState.tsx            ← NEU
  lib/
    spotifyApi.ts             ← ERWEITERN (getPlaylists hinzufügen)
  App.tsx                     ← ÄNDERN (loading + selection Phase)
```

Bestehende Dateien die NICHT geändert werden:
- `src/types/index.ts`
- `src/context/appReducer.ts`
- `src/context/AppContext.tsx`
- `src/lib/auth.ts`
- `src/hooks/useAuth.ts`
- `src/components/AppHeader.tsx`
- `src/components/LoginScreen.tsx`
- `src/components/SessionExpiredScreen.tsx`

### Anti-Pattern-Vermeidung

- **KEIN** `any` als TypeScript-Typ — explizite Response-Interface definieren in `spotifyApi.ts`
- **KEINE** Inline-Styles — nur Tailwind-Klassen
- **KEIN** `localStorage`-Zugriff außerhalb von `auth.ts` — Token via `loadToken()` in `App.tsx`
- **KEIN** direkter Spotify API-Call außerhalb von `spotifyApi.ts`
- **KEINE** eigene Checkbox-Logik — shadcn/ui `Checkbox` aus `@/components/ui/checkbox` verwenden
- **KEINE** `alert()` oder `window.confirm()` — Fehler via `SET_ERROR` + `ErrorState`-Phase

### References

- Epic 2, Story 2.1 Acceptance Criteria: `_bmad-output/planning-artifacts/epics.md` (Zeile 235-262)
- Architektur — Datenmodell `Playlist`: `_bmad-output/planning-artifacts/architecture.md#Data-Architecture`
- Architektur — File-Structure: `_bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure`
- Architektur — Naming-Conventions: `_bmad-output/planning-artifacts/architecture.md#Naming-Patterns`
- Architektur — State-Management-Pattern: `_bmad-output/planning-artifacts/architecture.md#State-Management-Patterns`
- Architektur — Error-Handling: `_bmad-output/planning-artifacts/architecture.md#Error-Handling-Patterns`
- Architektur — Loading-State-Pattern: `_bmad-output/planning-artifacts/architecture.md#Loading-State-Patterns`
- Architektur — Anti-Patterns: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines`
- UX — PlaylistRow-Props + Anatomie: `_bmad-output/planning-artifacts/ux-design-specification.md#PlaylistRow`
- UX — ColumnHeader-Props + Anatomie: `_bmad-output/planning-artifacts/ux-design-specification.md#ColumnHeader`
- UX — Skeleton-Rows: `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback-Patterns`
- UX — Farbsystem + Gewählte Richtung: `_bmad-output/planning-artifacts/ux-design-specification.md#Gewählte-Richtung`
- UX — Spacing + Layout: `_bmad-output/planning-artifacts/ux-design-specification.md#Spacing-Layout-Foundation`
- bestehende `spotifyApi.ts`: `src/lib/spotifyApi.ts`
- bestehende `App.tsx`: `src/App.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `getPlaylists()` in `spotifyApi.ts` ergänzt mit Pagination-Loop und explizitem `PlaylistsPage`-Interface (kein `any`)
- Playlist-Loading via zweitem `useEffect` in `App.tsx` (reagiert auf `state.phase === 'loading'`), mit `playlistsLoaded` ref gegen Doppelaufruf
- `ColumnHeader.tsx`: Icon-Pill (+/−) in Sky-600 / Rose-500, Badge "N ausgewählt" ab selectedCount > 0
- `PlaylistRow.tsx`: shadcn/ui `Checkbox`, aria-checked, Sky/Rose-Tint + Border für selected-States, vollständiges Props-Interface für Story 2.2
- `EmptyState.tsx`: Text + Link zu open.spotify.com
- `PlaylistColumns.tsx`: Skeleton (animate-pulse, 6 Rows), EmptyState, responsive grid — liest Phase direkt via `useAppContext()`
- `App.tsx`: cases `loading` und `selection` im switch ergänzt, beide rendern `<AppHeader /> <PlaylistColumns />`
- `PlaylistRow.test.tsx`: 4 Tests — render, aria-checked false/true, onToggle bei Klick
- Alle 54 Tests bestehen, `tsc --noEmit` fehlerfrei

### File List

- src/lib/spotifyApi.ts
- src/components/ColumnHeader.tsx
- src/components/PlaylistRow.tsx
- src/components/PlaylistRow.test.tsx
- src/components/EmptyState.tsx
- src/components/PlaylistColumns.tsx
- src/App.tsx

## Change Log

- 2026-03-25: Story implementiert — getPlaylists() mit Pagination, 5 neue Komponenten (ColumnHeader, PlaylistRow, EmptyState, PlaylistColumns), App.tsx um loading/selection-Phase erweitert, 4 neue Tests, alle 54 Tests grün, kein TypeScript-Fehler
