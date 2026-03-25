import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserProfile, getPlaylistTracks } from '@/lib/spotifyApi'

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

  describe('getPlaylistTracks()', () => {
    it('lädt alle Tracks mit Pagination', async () => {
      const page1 = {
        items: [
          { track: { id: 'track-1' } },
          { track: { id: 'track-2' } },
        ],
        next: 'https://api.spotify.com/v1/playlists/abc/tracks?limit=100&offset=100',
      }
      const page2 = {
        items: [
          { track: { id: 'track-3' } },
        ],
        next: null,
      }

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(JSON.stringify(page1), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(page2), { status: 200 }))

      const result = await getPlaylistTracks('token', 'abc')

      expect(result).toEqual([{ id: 'track-1' }, { id: 'track-2' }, { id: 'track-3' }])
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('filtert null-Tracks heraus', async () => {
      const page = {
        items: [
          { track: null },
          { track: { id: null } },
          { track: { id: 'valid-track' } },
        ],
        next: null,
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(page), { status: 200 })
      )

      const result = await getPlaylistTracks('token', 'playlist-id')

      expect(result).toEqual([{ id: 'valid-track' }])
    })

    it('wirft Error bei API-Fehler', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      )

      await expect(getPlaylistTracks('token', 'playlist-id')).rejects.toThrow(
        'Spotify API Fehler: 401'
      )
    })

    it('wirft Fehler bei ungültiger JSON-Antwort', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('kein json', { status: 200 })
      )

      await expect(getPlaylistTracks('token', 'playlist-id')).rejects.toThrow(
        'Spotify API Fehler: ungültige Antwort'
      )
    })

    it('gibt leeres Array zurück wenn items null ist', async () => {
      const page = { items: null, next: null }

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(page), { status: 200 })
      )

      const result = await getPlaylistTracks('token', 'playlist-id')
      expect(result).toEqual([])
    })
  })
})
