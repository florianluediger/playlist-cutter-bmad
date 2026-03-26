import { vi, describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SuccessScreen } from './SuccessScreen'
import { useAppContext } from '@/context/AppContext'
import { initialState } from '@/context/appReducer'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

const mockDispatch = vi.fn()

beforeEach(() => {
  mockDispatch.mockClear()
  vi.mocked(useAppContext).mockReturnValue({
    state: {
      ...initialState,
      phase: 'success',
      playlistName: 'Meine Diff-Playlist',
      createdPlaylistUrl: 'https://open.spotify.com/playlist/abc123',
      createdTrackCount: 42,
    },
    dispatch: mockDispatch,
  })
})

describe('SuccessScreen', () => {
  test('zeigt Playlist-Namen an', () => {
    render(<SuccessScreen />)
    expect(screen.getByText('Meine Diff-Playlist')).toBeInTheDocument()
  })

  test('zeigt Track-Anzahl an', () => {
    render(<SuccessScreen />)
    expect(screen.getByText(/42 Tracks/)).toBeInTheDocument()
  })

  test('"In Spotify öffnen" hat korrekte href und target=_blank', () => {
    render(<SuccessScreen />)
    const link = screen.getByRole('link', { name: /Spotify öffnen/i })
    expect(link).toHaveAttribute('href', 'https://open.spotify.com/playlist/abc123')
    expect(link).toHaveAttribute('target', '_blank')
  })

  test('"Neue Playlist erstellen" dispatcht RESET_SELECTION + SET_PHASE: selection', () => {
    render(<SuccessScreen />)
    fireEvent.click(screen.getByRole('button', { name: /Neue Playlist erstellen/i }))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })
  })
})
