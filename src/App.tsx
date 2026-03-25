import { useEffect, useRef } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LoginScreen } from '@/components/LoginScreen'
import { SessionExpiredScreen } from '@/components/SessionExpiredScreen'
import { AppHeader } from '@/components/AppHeader'
import { useAuth } from '@/hooks/useAuth'
import { isTokenValid, loadToken } from '@/lib/auth'
import { getUserProfile } from '@/lib/spotifyApi'

function AppContent() {
  const { state, dispatch } = useAppContext()
  const { handleCallback, handleAuthError } = useAuth()
  const callbackHandled = useRef(false)

  useEffect(() => {
    if (callbackHandled.current) return

    // 1. Session-Persistenz: gültiger Token → direkt zu loading
    const token = loadToken()
    if (token && isTokenValid()) {
      callbackHandled.current = true
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

  switch (state.phase) {
    case 'login':
      return <LoginScreen />
    case 'session-expired':
      return <SessionExpiredScreen />
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
