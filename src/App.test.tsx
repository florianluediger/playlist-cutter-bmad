import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { HTMLProps, ReactNode } from 'react'
import type { AppState } from '@/types'

// Mock framer-motion — jsdom versteht keine echten DOM-Animationen
// P4: Framer-Motion-spezifische Props werden herausgefiltert, um React-DOM-Warnungen zu vermeiden
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: HTMLProps<HTMLDivElement> & {
      initial?: unknown
      animate?: unknown
      exit?: unknown
      transition?: unknown
    }) => <div data-testid="phase-wrapper" {...props}>{children}</div>,
  },
}))

// Vereinfachte Stubs für alle Phase-Komponenten
vi.mock('@/components/LoginScreen', () => ({
  LoginScreen: () => <div data-testid="login-screen">LoginScreen</div>,
}))
vi.mock('@/components/SessionExpiredScreen', () => ({
  SessionExpiredScreen: () => <div data-testid="session-expired-screen">SessionExpiredScreen</div>,
}))
vi.mock('@/components/PlaylistColumns', () => ({
  PlaylistColumns: () => <div data-testid="playlist-columns">PlaylistColumns</div>,
}))
vi.mock('@/components/CreationPhase', () => ({
  CreationPhase: () => <div data-testid="creation-phase">CreationPhase</div>,
}))
vi.mock('@/components/SuccessScreen', () => ({
  SuccessScreen: () => <div data-testid="success-screen">SuccessScreen</div>,
}))
vi.mock('@/components/ErrorState', () => ({
  ErrorState: () => <div data-testid="error-state">ErrorState</div>,
}))
vi.mock('@/components/AppHeader', () => ({
  AppHeader: () => <div data-testid="app-header">AppHeader</div>,
}))

// API- und Auth-Mocks — verhindern echte Netzwerk-Calls in useEffect
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ handleCallback: vi.fn(), handleAuthError: vi.fn() }),
}))
vi.mock('@/lib/auth', () => ({
  isTokenValid: vi.fn().mockReturnValue(false),
  loadToken: vi.fn().mockReturnValue(null),
}))

// Kontrollierbarer AppContext — state.phase wird von außen gesetzt
const mockDispatch = vi.fn()
let mockPhase: AppState['phase'] = 'login'

vi.mock('@/context/AppContext', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAppContext: () => ({
    state: {
      phase: mockPhase,
      playlists: [],
      selectedSources: [],
      selectedExcludes: [],
      playlistName: '',
      error: null,
      progress: 0,
      userName: null,
      userId: null,
      createdPlaylistUrl: null,
      createdTrackCount: 0,
    },
    dispatch: mockDispatch,
  }),
}))

// P2: Statischer Import — Vitest hoisted vi.mock()-Aufrufe vor alle Imports,
// daher sind die Mocks beim Laden von App.tsx bereits aktiv.
import App from '@/App'

describe('App — Phasen-Animationen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPhase = 'login' // P1: Zustand nach jedem Test zurücksetzen — verhindert Test-Reihenfolge-Abhängigkeit
  })

  it('rendert LoginScreen in der login-Phase', () => {
    mockPhase = 'login'
    render(<App />)
    expect(screen.getByTestId('login-screen')).toBeInTheDocument()
  })

  it('rendert SessionExpiredScreen in der session-expired-Phase', () => {
    mockPhase = 'session-expired'
    render(<App />)
    expect(screen.getByTestId('session-expired-screen')).toBeInTheDocument()
  })

  it('rendert PlaylistColumns und AppHeader in der loading-Phase', () => {
    mockPhase = 'loading'
    render(<App />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByTestId('playlist-columns')).toBeInTheDocument()
  })

  it('rendert PlaylistColumns und AppHeader in der selection-Phase', () => {
    mockPhase = 'selection'
    render(<App />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByTestId('playlist-columns')).toBeInTheDocument()
  })

  it('rendert CreationPhase und AppHeader in der creating-Phase', () => {
    mockPhase = 'creating'
    render(<App />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByTestId('creation-phase')).toBeInTheDocument()
  })

  it('rendert SuccessScreen und AppHeader in der success-Phase', () => {
    mockPhase = 'success'
    render(<App />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByTestId('success-screen')).toBeInTheDocument()
  })

  it('rendert ErrorState und AppHeader in der error-Phase', () => {
    mockPhase = 'error'
    render(<App />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
  })

  it('rendert keinen AppHeader in der login-Phase', () => {
    mockPhase = 'login'
    render(<App />)
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument()
  })

  it('rendert keinen AppHeader in der session-expired-Phase', () => {
    mockPhase = 'session-expired'
    render(<App />)
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument()
  })

  it('AnimatePresence umschließt den Phasen-Content — Phasenwechsel zeigt neuen Content', () => {
    // Erster Render: login
    mockPhase = 'login'
    const { rerender } = render(<App />)
    expect(screen.getByTestId('login-screen')).toBeInTheDocument()
    expect(screen.queryByTestId('playlist-columns')).not.toBeInTheDocument()

    // Phasenwechsel zu selection — AnimatePresence mit key={state.phase} muss neuen Content zeigen
    mockPhase = 'selection'
    rerender(<App />)
    expect(screen.getByTestId('playlist-columns')).toBeInTheDocument()
    expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument()
  })

  // P3: Verifiziert dass motion.div Wrapper vorhanden ist und den Phasen-Content einschließt
  it('motion.div Wrapper (AnimatePresence) umschließt den Phasen-Content', () => {
    mockPhase = 'selection'
    render(<App />)
    const wrapper = screen.getByTestId('phase-wrapper')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toContainElement(screen.getByTestId('playlist-columns'))
  })

  // P6: Fallback für unbekannte/neue Phasen
  it('rendert Fallback-Inhalt für unbekannte Phasen', () => {
    mockPhase = 'unknown' as AppState['phase']
    render(<App />)
    expect(screen.getByText('Playlisten werden geladen…')).toBeInTheDocument()
  })
})
