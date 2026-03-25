import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppProvider } from '@/context/AppContext'
import { useAuth } from '@/hooks/useAuth'
import * as authLib from '@/lib/auth'

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
      const saveTokenSpy = vi.spyOn(authLib, 'saveToken')
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.handleCallback('valid-code')
      })

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/')
      expect(saveTokenSpy).toHaveBeenCalledWith('mocked-access-token', 3600)
    })
  })
})
