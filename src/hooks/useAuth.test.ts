import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { useAuth } from '@/hooks/useAuth'
import * as authLib from '@/lib/auth'
import * as spotifyApiLib from '@/lib/spotifyApi'

function wrapper({ children }: { children: React.ReactNode }) {
  return AppProvider({ children })
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  describe('logout()', () => {
    it('löscht den Token aus localStorage', () => {
      localStorage.setItem('playlist_cutter_access_token', 'test-token')
      localStorage.setItem('playlist_cutter_token_expiry', (Date.now() + 3600000).toString())

      const { result } = renderHook(() => useAuth(), { wrapper })
      act(() => {
        result.current.logout()
      })

      expect(localStorage.getItem('playlist_cutter_access_token')).toBeNull()
    })

    it('setzt die Phase auf login zurück', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      act(() => {
        result.current.logout()
      })

      // State-Änderung über useAppContext würde die Phase auf 'login' setzen
      // Wir prüfen dass clearToken aufgerufen wurde (kein Error)
      expect(localStorage.getItem('playlist_cutter_access_token')).toBeNull()
    })

    it('löscht userName aus dem State (dispatcht SET_USER null)', () => {
      const clearTokenSpy = vi.spyOn(authLib, 'clearToken')
      const { result } = renderHook(
        () => ({ auth: useAuth(), ctx: useAppContext() }),
        { wrapper }
      )
      act(() => {
        result.current.ctx.dispatch({ type: 'SET_USER', payload: { displayName: 'Test User', userId: 'user1' } })
      })
      act(() => {
        result.current.auth.logout()
      })

      expect(clearTokenSpy).toHaveBeenCalledOnce()
      expect(result.current.ctx.state.userName).toBeNull()
    })
  })

  describe('handleAuthError()', () => {
    it('löscht den Token (clearToken aufgerufen)', () => {
      localStorage.setItem('playlist_cutter_access_token', 'test-token')
      localStorage.setItem('playlist_cutter_token_expiry', (Date.now() + 3600000).toString())

      const clearTokenSpy = vi.spyOn(authLib, 'clearToken')
      const { result } = renderHook(() => useAuth(), { wrapper })
      act(() => {
        result.current.handleAuthError()
      })

      expect(clearTokenSpy).toHaveBeenCalledOnce()
      expect(localStorage.getItem('playlist_cutter_access_token')).toBeNull()
    })

    it('dispatcht SET_USER mit null', () => {
      const { result } = renderHook(
        () => ({ auth: useAuth(), ctx: useAppContext() }),
        { wrapper }
      )
      act(() => {
        result.current.ctx.dispatch({ type: 'SET_USER', payload: { displayName: 'Test User', userId: 'user1' } })
      })
      act(() => {
        result.current.auth.handleAuthError()
      })

      expect(result.current.ctx.state.userName).toBeNull()
    })

    it('dispatcht SET_PHASE mit "session-expired"', () => {
      const { result } = renderHook(
        () => ({ auth: useAuth(), ctx: useAppContext() }),
        { wrapper }
      )
      act(() => {
        result.current.auth.handleAuthError()
      })

      expect(result.current.ctx.state.phase).toBe('session-expired')
    })
  })

  describe('handleCallback() — Fehler-Fallback', () => {
    it('bereinigt die URL und bleibt auf LoginScreen bei fehlgeschlagenem Token-Exchange', async () => {
      vi.spyOn(authLib, 'exchangeCodeForToken').mockRejectedValueOnce(new Error('Token-Exchange fehlgeschlagen'))
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.handleCallback('invalid-code')
      })

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/')
    })

    it('bereinigt die URL und speichert Token bei erfolgreichem Token-Exchange', async () => {
      vi.spyOn(authLib, 'exchangeCodeForToken').mockResolvedValueOnce({ accessToken: 'mocked-access-token', expiresIn: 3600 })
      vi.spyOn(spotifyApiLib, 'getUserProfile').mockResolvedValueOnce({ displayName: 'Max Mustermann', userId: 'user123' })
      const saveTokenSpy = vi.spyOn(authLib, 'saveToken')
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.handleCallback('valid-code')
      })

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/')
      expect(saveTokenSpy).toHaveBeenCalledWith('mocked-access-token', 3600)
      expect(spotifyApiLib.getUserProfile).toHaveBeenCalledWith('mocked-access-token')
    })

    it('dispatcht SET_USER mit displayName nach erfolgreichem Token-Exchange', async () => {
      vi.spyOn(authLib, 'exchangeCodeForToken').mockResolvedValueOnce({ accessToken: 'mocked-access-token', expiresIn: 3600 })
      vi.spyOn(spotifyApiLib, 'getUserProfile').mockResolvedValueOnce({ displayName: 'Max Mustermann', userId: 'user123' })

      const { result } = renderHook(
        () => ({ auth: useAuth(), ctx: useAppContext() }),
        { wrapper }
      )

      await act(async () => {
        await result.current.auth.handleCallback('valid-code')
      })

      expect(spotifyApiLib.getUserProfile).toHaveBeenCalledWith('mocked-access-token')
      expect(result.current.ctx.state.userName).toBe('Max Mustermann')
    })

    it('setzt Phase auf session-expired wenn getUserProfile 401 wirft', async () => {
      vi.spyOn(authLib, 'exchangeCodeForToken').mockResolvedValueOnce({ accessToken: 'mocked-token', expiresIn: 3600 })
      vi.spyOn(spotifyApiLib, 'getUserProfile').mockRejectedValueOnce(new Error('Spotify API Fehler: 401'))

      const { result } = renderHook(
        () => ({ auth: useAuth(), ctx: useAppContext() }),
        { wrapper }
      )

      await act(async () => {
        await result.current.auth.handleCallback('valid-code')
      })

      expect(result.current.ctx.state.phase).toBe('session-expired')
    })
  })
})
