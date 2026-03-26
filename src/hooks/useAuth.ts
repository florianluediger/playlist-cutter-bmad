import { useAppContext } from '@/context/AppContext'
import { buildAuthUrl, clearToken, exchangeCodeForToken, generateCodeVerifier, saveToken } from '@/lib/auth'
import { getUserProfile } from '@/lib/spotifyApi'

export function useAuth() {
  const { dispatch } = useAppContext()

  async function login(): Promise<void> {
    const verifier = generateCodeVerifier()
    const url = await buildAuthUrl(verifier)
    window.location.href = url
  }

  function logout(): void {
    clearToken()
    dispatch({ type: 'SET_PHASE', payload: 'login' })
    dispatch({ type: 'SET_USER', payload: { displayName: null, userId: null } })
  }

  function handleAuthError(): void {
    clearToken()
    dispatch({ type: 'SET_USER', payload: { displayName: null, userId: null } })
    dispatch({ type: 'SET_PHASE', payload: 'session-expired' })
  }

  async function handleCallback(code: string): Promise<void> {
    try {
      const { accessToken, expiresIn } = await exchangeCodeForToken(code)
      saveToken(accessToken, expiresIn)
      window.history.replaceState({}, '', '/')
      try {
        const { displayName, userId } = await getUserProfile(accessToken)
        dispatch({ type: 'SET_USER', payload: { displayName, userId } })
        dispatch({ type: 'SET_PHASE', payload: 'loading' })
      } catch (profileError: unknown) {
        if (
          profileError instanceof Error &&
          (profileError.message === 'Spotify API Fehler: 401' || profileError.message === 'Spotify API Fehler: 403')
        ) {
          handleAuthError()
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Verbindungsproblem — bitte Seite neu laden.' })
        }
      }
    } catch {
      window.history.replaceState({}, '', '/')
      // Nutzer bleibt auf LoginScreen ohne Fehlerzustand (AC 4)
    }
  }

  return { login, logout, handleCallback, handleAuthError }
}
