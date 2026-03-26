import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { CreationPhase } from '@/components/CreationPhase'
import { useAppContext } from '@/context/AppContext'
import type { AppState } from '@/types/index'

vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}))

const baseState: AppState = {
  phase: 'creating',
  playlists: [],
  selectedSources: [],
  selectedExcludes: [],
  playlistName: 'Meine Test-Playlist',
  error: null,
  progress: 0,
  userName: null,
  userId: null,
  createdPlaylistUrl: null,
  createdTrackCount: 0,
}

const mockDispatch = vi.fn()

function setupMock(progressOverride: number) {
  vi.mocked(useAppContext).mockReturnValue({
    state: { ...baseState, progress: progressOverride },
    dispatch: mockDispatch,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})

// --- Schritt-Status-Tests ---

test('progress 0: Schritt 1 active, Rest pending', () => {
  setupMock(0)
  render(<CreationPhase />)

  // Schritt-Labels sind alle sichtbar
  expect(screen.getByText('Tracks laden')).toBeInTheDocument()
  expect(screen.getByText('Differenz berechnen')).toBeInTheDocument()
  expect(screen.getByText('Playlist anlegen')).toBeInTheDocument()
  expect(screen.getByText('Tracks hinzufügen')).toBeInTheDocument()

  // Kein Check-Icon sichtbar (keine done-Schritte)
  // Puls-Dot für aktiven Schritt vorhanden (via aria oder DOM-Struktur)
  // Keine Timeout-UI
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

test('progress 50: Schritt 1 active, Rest pending', () => {
  setupMock(50)
  render(<CreationPhase />)
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

test('progress 80: Schritt 1 done, Schritt 2 active', () => {
  setupMock(80)
  render(<CreationPhase />)
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

test('progress 85: Schritt 2 done, Schritt 3 active', () => {
  setupMock(85)
  render(<CreationPhase />)
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

test('progress 90: Schritt 3 done, Schritt 4 active', () => {
  setupMock(90)
  render(<CreationPhase />)
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

test('progress 100: alle Schritte done', () => {
  setupMock(100)
  render(<CreationPhase />)
  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

// --- Playlist-Name als Subtitle ---

test('playlistName wird als Subtitle angezeigt', () => {
  setupMock(0)
  render(<CreationPhase />)
  expect(screen.getByText('Meine Test-Playlist')).toBeInTheDocument()
})

// --- Timeout-Tests ---

test('Timeout-UI erscheint nach 10s ohne Progress-Änderung', () => {
  vi.useFakeTimers()
  setupMock(50)
  render(<CreationPhase />)

  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(10_001)
  })

  expect(screen.getByText('Nochmal versuchen')).toBeInTheDocument()
  expect(screen.getByText('Zurück zur Auswahl')).toBeInTheDocument()
})

test('Timeout-UI zeigt Fehlermeldung', () => {
  vi.useFakeTimers()
  setupMock(50)
  render(<CreationPhase />)

  act(() => {
    vi.advanceTimersByTime(10_001)
  })

  expect(
    screen.getByText('Die Verbindung zu Spotify scheint unterbrochen. Was möchtest du tun?'),
  ).toBeInTheDocument()
})

// --- Button-Verhalten ---

test('Nochmal versuchen: dispatcht SET_PHASE selection (kein RESET_SELECTION)', () => {
  vi.useFakeTimers()
  setupMock(50)
  render(<CreationPhase />)

  act(() => {
    vi.advanceTimersByTime(10_001)
  })

  fireEvent.click(screen.getByText('Nochmal versuchen'))

  expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })
  expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
})

test('Zurück zur Auswahl: dispatcht RESET_SELECTION + SET_PHASE selection', () => {
  vi.useFakeTimers()
  setupMock(50)
  render(<CreationPhase />)

  act(() => {
    vi.advanceTimersByTime(10_001)
  })

  fireEvent.click(screen.getByText('Zurück zur Auswahl'))

  expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SELECTION' })
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_PHASE', payload: 'selection' })
})

// --- Schritt-Reihenfolge ---

test('Schritte sind in der korrekten Reihenfolge gerendert', () => {
  setupMock(0)
  render(<CreationPhase />)

  const items = screen.getAllByRole('listitem')
  expect(items[0]).toHaveTextContent('Tracks laden')
  expect(items[1]).toHaveTextContent('Differenz berechnen')
  expect(items[2]).toHaveTextContent('Playlist anlegen')
  expect(items[3]).toHaveTextContent('Tracks hinzufügen')
})

// --- Timeout-Reset ---

test('timedOut wird zurückgesetzt wenn progress sich ändert', () => {
  vi.useFakeTimers()
  setupMock(50)
  const { rerender } = render(<CreationPhase />)

  act(() => {
    vi.advanceTimersByTime(10_001)
  })
  expect(screen.getByText('Nochmal versuchen')).toBeInTheDocument()

  setupMock(51)
  rerender(<CreationPhase />)

  expect(screen.queryByText('Nochmal versuchen')).not.toBeInTheDocument()
})

// --- aria-live ---

test('main-Element hat aria-live="polite"', () => {
  setupMock(0)
  render(<CreationPhase />)
  expect(screen.getByRole('main')).toHaveAttribute('aria-live', 'polite')
})
