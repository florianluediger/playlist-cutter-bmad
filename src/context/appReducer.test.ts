import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from '@/context/appReducer'
import type { AppState } from '@/types'

describe('appReducer', () => {
  describe('SET_PHASE', () => {
    it('wechselt die Phase zu loading', () => {
      const state = appReducer(initialState, { type: 'SET_PHASE', payload: 'loading' })
      expect(state.phase).toBe('loading')
    })

    it('wechselt die Phase zu selection', () => {
      const state = appReducer(initialState, { type: 'SET_PHASE', payload: 'selection' })
      expect(state.phase).toBe('selection')
    })

    it('verändert keinen anderen State', () => {
      const state = appReducer(initialState, { type: 'SET_PHASE', payload: 'loading' })
      expect(state.playlists).toEqual([])
      expect(state.selectedSources).toEqual([])
    })
  })

  describe('TOGGLE_SOURCE', () => {
    it('fügt eine Playlist-ID zu selectedSources hinzu', () => {
      const state = appReducer(initialState, { type: 'TOGGLE_SOURCE', payload: 'pl-1' })
      expect(state.selectedSources).toContain('pl-1')
    })

    it('entfernt eine bereits ausgewählte Playlist-ID', () => {
      const withSelected: AppState = { ...initialState, selectedSources: ['pl-1'] }
      const state = appReducer(withSelected, { type: 'TOGGLE_SOURCE', payload: 'pl-1' })
      expect(state.selectedSources).not.toContain('pl-1')
    })

    it('kann mehrere IDs halten', () => {
      let state = appReducer(initialState, { type: 'TOGGLE_SOURCE', payload: 'pl-1' })
      state = appReducer(state, { type: 'TOGGLE_SOURCE', payload: 'pl-2' })
      expect(state.selectedSources).toEqual(['pl-1', 'pl-2'])
    })
  })

  describe('TOGGLE_EXCLUDE', () => {
    it('fügt eine Playlist-ID zu selectedExcludes hinzu', () => {
      const state = appReducer(initialState, { type: 'TOGGLE_EXCLUDE', payload: 'pl-3' })
      expect(state.selectedExcludes).toContain('pl-3')
    })

    it('entfernt eine bereits ausgeschlossene Playlist-ID', () => {
      const withExcluded: AppState = { ...initialState, selectedExcludes: ['pl-3'] }
      const state = appReducer(withExcluded, { type: 'TOGGLE_EXCLUDE', payload: 'pl-3' })
      expect(state.selectedExcludes).not.toContain('pl-3')
    })
  })

  describe('RESET_SELECTION', () => {
    it('setzt selectedSources, selectedExcludes, playlistName, error und progress zurück', () => {
      const dirtyState: AppState = {
        ...initialState,
        phase: 'selection',
        selectedSources: ['pl-1'],
        selectedExcludes: ['pl-2'],
        playlistName: 'Meine Playlist',
        error: 'Irgendein Fehler',
        progress: 50,
      }
      const state = appReducer(dirtyState, { type: 'RESET_SELECTION' })
      expect(state.selectedSources).toEqual([])
      expect(state.selectedExcludes).toEqual([])
      expect(state.playlistName).toBe('')
      expect(state.error).toBeNull()
      expect(state.progress).toBe(0)
      // Phase bleibt erhalten
      expect(state.phase).toBe('selection')
    })
  })

  describe('SET_ERROR', () => {
    it('setzt eine Fehlermeldung', () => {
      const state = appReducer(initialState, { type: 'SET_ERROR', payload: 'Fehler aufgetreten' })
      expect(state.error).toBe('Fehler aufgetreten')
    })

    it('setzt error auf null zurück', () => {
      const withError: AppState = { ...initialState, error: 'Fehler' }
      const state = appReducer(withError, { type: 'SET_ERROR', payload: null })
      expect(state.error).toBeNull()
    })
  })
})
