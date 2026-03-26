import { vi, describe, test, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorState } from './ErrorState'
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
      phase: 'error',
      error: 'Fehler beim Erstellen der Playlist. Bitte versuche es erneut.',
    },
    dispatch: mockDispatch,
  })
})

describe('ErrorState', () => {
  test('zeigt Fehlertext aus state.error an', () => {
    render(<ErrorState />)
    expect(screen.getByText(/Fehler beim Erstellen der Playlist/)).toBeInTheDocument()
  })

  test('"Nochmal versuchen" dispatcht SET_PHASE: creating — KEIN RESET_SELECTION', () => {
    render(<ErrorState />)
    fireEvent.click(screen.getByRole('button', { name: /Nochmal versuchen/i }))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'creating' })
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
  })

  test('"Zurück zur Auswahl" dispatcht RESET_SELECTION + SET_PHASE: selection', () => {
    render(<ErrorState />)
    fireEvent.click(screen.getByRole('button', { name: /Zurück zur Auswahl/i }))
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })
  })

  test('zeigt Fallback-Text wenn state.error null ist', () => {
    vi.mocked(useAppContext).mockReturnValue({
      state: { ...initialState, phase: 'error', error: null },
      dispatch: mockDispatch,
    })
    render(<ErrorState />)
    expect(screen.getByText(/unbekannter Fehler/i)).toBeInTheDocument()
  })
})
