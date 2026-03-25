import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppContext } from '@/context/AppContext'
import { PlaylistColumns } from '@/components/PlaylistColumns'
import type { AppState } from '@/types/index'

const basePlaylists = [
  { id: 'p1', name: 'Playlist Alpha', trackCount: 10 },
  { id: 'p2', name: 'Playlist Beta', trackCount: 20 },
  { id: 'p3', name: 'Playlist Gamma', trackCount: 5 },
]

const baseState: AppState = {
  phase: 'selection',
  playlists: basePlaylists,
  selectedSources: [],
  selectedExcludes: [],
  playlistName: '',
  error: null,
  progress: 0,
  userName: null,
}

function renderWithState(stateOverrides: Partial<AppState>) {
  const state: AppState = { ...baseState, ...stateOverrides }
  return render(
    <AppContext.Provider value={{ state, dispatch: vi.fn() }}>
      <PlaylistColumns />
    </AppContext.Provider>,
  )
}

describe('PlaylistColumns — Duplikat-Warnung', () => {
  it('zeigt keine Warnung wenn kein Duplikat', () => {
    renderWithState({
      selectedSources: ['p1'],
      selectedExcludes: ['p2'],
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('zeigt Warnung wenn eine Playlist sowohl Quelle als auch Ausschluss ist (Einzahl)', () => {
    renderWithState({
      selectedSources: ['p1'],
      selectedExcludes: ['p1'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).toContain('Diese Playlist ist sowohl als Quelle als auch als Ausschluss gewählt')
  })

  it('zeigt Warnung mit Anzahl wenn mehrere Playlisten dupliziert sind (Mehrzahl)', () => {
    renderWithState({
      selectedSources: ['p1', 'p2'],
      selectedExcludes: ['p1', 'p2'],
    })

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).toContain('2 Playlisten')
    expect(alert.textContent).toContain('sowohl als Quelle als auch als Ausschluss gewählt')
  })

  it('versteckt Warnung wenn Duplizierung aufgehoben wird', () => {
    const { rerender } = render(
      <AppContext.Provider
        value={{
          state: { ...baseState, selectedSources: ['p1'], selectedExcludes: ['p1'] },
          dispatch: vi.fn(),
        }}
      >
        <PlaylistColumns />
      </AppContext.Provider>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(
      <AppContext.Provider
        value={{
          state: { ...baseState, selectedSources: ['p1'], selectedExcludes: [] },
          dispatch: vi.fn(),
        }}
      >
        <PlaylistColumns />
      </AppContext.Provider>,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('zeigt keine Warnung wenn selectedIds nicht in playlists vorhanden sind', () => {
    renderWithState({
      playlists: [],
      selectedSources: ['x'],
      selectedExcludes: ['x'],
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
