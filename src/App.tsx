import { useEffect, useRef } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LoginScreen } from '@/components/LoginScreen'
import { SessionExpiredScreen } from '@/components/SessionExpiredScreen'
import { AppHeader } from '@/components/AppHeader'
import { PlaylistColumns } from '@/components/PlaylistColumns'
import { useAuth } from '@/hooks/useAuth'
import { isTokenValid, loadToken } from '@/lib/auth'
import { getUserProfile, getPlaylists } from '@/lib/spotifyApi'

function AppContent() {
  const { state, dispatch } = useAppContext()
  const { handleCallback, handleAuthError } = useAuth()
  const callbackHandled = useRef(false)
  const playlistsLoaded = useRef(false)

  useEffect(() => {
    if (callbackHandled.current) return

    // 1. Session-Persistenz: gültiger Token → direkt zu loading
    const token = loadToken()
    if (token && isTokenValid()) {
      let cancelled = false
      getUserProfile(token)
        .then(({ displayName }) => {
          if (cancelled) return
          dispatch({ type: 'SET_USER', payload: displayName })
          dispatch({ type: 'SET_PHASE', payload: 'loading' })
        })
        .catch((error: unknown) => {
          if (cancelled) return
          if (
            error instanceof Error &&
            (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403')
          ) {
            handleAuthError()
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'Verbindungsproblem — bitte Seite neu laden.' })
          }
        })
      return () => {
        cancelled = true
      }
    }

    // 2. OAuth-Callback verarbeiten
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      window.history.replaceState({}, '', '/')
      return
    }

    callbackHandled.current = true
    handleCallback(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.phase !== 'loading') return
    if (playlistsLoaded.current) return

    const token = loadToken()
    if (!token) return

    playlistsLoaded.current = true
    let cancelled = false

    getPlaylists(token)
      .then((playlists) => {
        if (cancelled) return
        dispatch({ type: 'SET_PLAYLISTS', payload: playlists })
        dispatch({ type: 'SET_PHASE', payload: 'selection' })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        playlistsLoaded.current = false
        if (
          error instanceof Error &&
          (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403')
        ) {
          handleAuthError()
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Playlisten konnten nicht geladen werden — bitte Seite neu laden.' })
          dispatch({ type: 'SET_PHASE', payload: 'error' })
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  switch (state.phase) {
    case 'login':
      return <LoginScreen />
    case 'session-expired':
      return <SessionExpiredScreen />
    case 'loading':
      return (
        <>
          <AppHeader />
          <PlaylistColumns />
        </>
      )
    case 'selection':
      return (
        <>
          <AppHeader />
          <PlaylistColumns />
        </>
      )
    case 'error':
      return (
        <>
          <AppHeader />
          <main className="max-w-6xl mx-auto p-6 md:p-8">
            <p className="text-red-600">{state.error ?? 'Ein Fehler ist aufgetreten.'}</p>
          </main>
        </>
      )
    default:
      return (
        <>
          <AppHeader />
          <div>Playlisten werden geladen…</div>
        </>
      )
  }
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
