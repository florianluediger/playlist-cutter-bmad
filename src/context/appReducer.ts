import type { AppState, AppAction } from '@/types'

export const initialState: AppState = {
  phase: 'login',
  playlists: [],
  selectedSources: [],
  selectedExcludes: [],
  playlistName: '',
  error: null,
  progress: 0,
  userName: null,
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload }

    case 'SET_USER':
      return { ...state, userName: action.payload }

    case 'SET_PLAYLISTS':
      return { ...state, playlists: action.payload }

    case 'TOGGLE_SOURCE': {
      const id = action.payload
      const selected = state.selectedSources.includes(id)
        ? state.selectedSources.filter(s => s !== id)
        : [...state.selectedSources, id]
      return { ...state, selectedSources: selected }
    }

    case 'TOGGLE_EXCLUDE': {
      const id = action.payload
      const selected = state.selectedExcludes.includes(id)
        ? state.selectedExcludes.filter(s => s !== id)
        : [...state.selectedExcludes, id]
      return { ...state, selectedExcludes: selected }
    }

    case 'SET_PLAYLIST_NAME':
      return { ...state, playlistName: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }

    case 'RESET_SELECTION':
      return {
        ...state,
        selectedSources: [],
        selectedExcludes: [],
        playlistName: '',
        error: null,
        progress: 0,
      }

    default:
      return state
  }
}
