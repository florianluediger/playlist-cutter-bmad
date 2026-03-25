import { useAppContext } from '@/context/AppContext'
import { buildAuthUrl, clearToken, exchangeCodeForToken, generateCodeVerifier, saveToken } from '@/lib/auth'

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
  }

  async function handleCallback(code: string): Promise<void> {
    try {
      const { accessToken, expiresIn } = await exchangeCodeForToken(code)
      saveToken(accessToken, expiresIn)
      window.history.replaceState({}, '', '/')
      dispatch({ type: 'SET_PHASE', payload: 'loading' })
    } catch {
      window.history.replaceState({}, '', '/')
      // Nutzer bleibt auf LoginScreen ohne Fehlerzustand (AC 4)
    }
  }

  return { login, logout, handleCallback }
}
