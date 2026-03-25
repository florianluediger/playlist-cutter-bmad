import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserProfile } from '@/lib/spotifyApi'

describe('spotifyApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserProfile()', () => {
    it('sendet Authorization-Header und gibt displayName zurück', async () => {
      const mockToken = 'test-access-token'
      const mockResponse = {
        display_name: 'Max Mustermann',
        id: 'maxmustermann',
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      )

      const result = await getUserProfile(mockToken)

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        })
      )
      expect(result).toEqual({ displayName: 'Max Mustermann' })
    })

    it('wirft Fehler bei 401-Response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      )

      await expect(getUserProfile('abgelaufener-token')).rejects.toThrow(
        'Spotify API Fehler: 401'
      )
    })

    it('wirft Fehler bei 500-Response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 })
      )

      await expect(getUserProfile('token')).rejects.toThrow(
        'Spotify API Fehler: 500'
      )
    })

    it('gibt Fallback-String zurück wenn display_name null ist', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ display_name: null, id: 'user123' }), { status: 200 })
      )

      const result = await getUserProfile('token')
      expect(result).toEqual({ displayName: 'Nutzer' })
    })

    it('wirft Fehler bei ungültiger JSON-Antwort', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('kein json', { status: 200 })
      )

      await expect(getUserProfile('token')).rejects.toThrow(
        'Spotify API Fehler: ungültige Antwort'
      )
    })
  })
})
