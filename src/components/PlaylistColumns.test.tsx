import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppContext } from '@/context/AppContext'
import { PlaylistColumns } from '@/components/PlaylistColumns'
import type { AppState } from '@/types/index'

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn().mockReturnValue(true),
}))

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
  userId: null,
  createdPlaylistUrl: null,
  createdTrackCount: 0,
}

function renderWithState(stateOverrides: Partial<AppState>) {
  const state: AppState = { ...baseState, ...stateOverrides }
  return render(
    <AppContext.Provider value={{ state, dispatch: vi.fn() }}>
      <PlaylistColumns />
    </AppContext.Provider>,
  )
}

describe('PlaylistColumns — gegenseitige Deaktivierung', () => {
  it('Playlist in Exclude-Spalte ist aria-disabled wenn sie als Source gewählt ist', () => {
    renderWithState({
      selectedSources: ['p1'],
      selectedExcludes: [],
    })

    // Alle Checkboxen mit Namen "Playlist Alpha" holen (eine je Spalte)
    const rows = screen.getAllByRole('checkbox', { name: 'Playlist Alpha' })
    // Source-Spalte: nicht disabled; Exclude-Spalte: disabled
    const excludeRow = rows[1]
    expect(excludeRow).toHaveAttribute('aria-disabled', 'true')
  })

  it('Playlist in Source-Spalte ist aria-disabled wenn sie als Exclude gewählt ist', () => {
    renderWithState({
      selectedSources: [],
      selectedExcludes: ['p2'],
    })

    const rows = screen.getAllByRole('checkbox', { name: 'Playlist Beta' })
    // Source-Spalte: disabled; Exclude-Spalte: nicht disabled
    const sourceRow = rows[0]
    expect(sourceRow).toHaveAttribute('aria-disabled', 'true')
  })

  it('alle Rows sind nicht disabled wenn keine Selektion vorhanden ist', () => {
    renderWithState({
      selectedSources: [],
      selectedExcludes: [],
    })

    const rows = screen.getAllByRole('checkbox')
    rows.forEach((row) => {
      expect(row).toHaveAttribute('aria-disabled', 'false')
    })
  })

})
