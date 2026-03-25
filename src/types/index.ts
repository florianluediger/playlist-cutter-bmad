// Alle TypeScript-Typen des Projekts

export interface Playlist {
  id: string
  name: string
  trackCount: number
}

export interface Track {
  id: string
}

export type AppPhase = 'login' | 'loading' | 'selection' | 'creating' | 'success' | 'error' | 'session-expired'

export interface AppState {
  phase: AppPhase
  playlists: Playlist[]
  selectedSources: string[]    // Playlist-IDs
  selectedExcludes: string[]   // Playlist-IDs
  playlistName: string
  error: string | null
  progress: number             // 0–100
  userName: string | null
}

export type AppAction =
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'SET_USER'; payload: string | null }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_EXCLUDE'; payload: string }
  | { type: 'SET_PLAYLIST_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'RESET_SELECTION' }
