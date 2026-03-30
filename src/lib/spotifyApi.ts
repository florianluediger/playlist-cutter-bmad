// Spotify Web API Client — einziger Kontaktpunkt zur Spotify Web API
// Token wird immer als Parameter übergeben, kein direkter localStorage-Zugriff

import type { Playlist, Track } from '@/types'

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

async function spotifyFetch(
  token: string,
  path: string,
  options?: { method?: string; body?: string }
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body,
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Spotify API Fehler: ${response.status}`)
  return response
}

export async function getUserProfile(token: string): Promise<{ displayName: string; userId: string }> {
  const response = await spotifyFetch(token, '/me')
  let data: { display_name: string | null; id: string }
  try {
    data = await response.json()
  } catch {
    throw new Error('Spotify API Fehler: ungültige Antwort')
  }
  if (!data.id) throw new Error('Spotify API Fehler: ungültige Antwort')
  return { displayName: data.display_name ?? 'Nutzer', userId: data.id }
}

const MAX_PAGES = 200

interface PlaylistsPage {
  items: Array<{
    id: string
    name: string
    tracks: { total: number } | null
  }> | null
  next: string | null
}

export async function getPlaylists(token: string): Promise<Playlist[]> {
  const allPlaylists: Playlist[] = []
  let path: string | null = '/me/playlists?limit=50'
  let pageCount = 0

  while (path && pageCount < MAX_PAGES) {
    pageCount++
    const response = await spotifyFetch(token, path)
    let data: PlaylistsPage
    try {
      data = await response.json()
    } catch {
      throw new Error('Spotify API Fehler: ungültige Antwort')
    }

    for (const item of data.items ?? []) {
      allPlaylists.push({ id: item.id, name: item.name, trackCount: item.tracks?.total ?? 0 })
    }

    if (data.next) {
      try {
        const nextUrl = new URL(data.next)
        path = nextUrl.pathname.replace(/^\/v1/, '') + nextUrl.search
      } catch {
        throw new Error('Spotify API Fehler: ungültige Antwort')
      }
    } else {
      path = null
    }
  }

  return allPlaylists
}

interface TracksPage {
  items: Array<{
    track: { id: string | null } | null
  }> | null
  next: string | null
}

export async function getPlaylistTracks(token: string, playlistId: string): Promise<Track[]> {
  const allTracks: Track[] = []
  let path: string | null = `/playlists/${playlistId}/tracks?limit=100`
  let pageCount = 0

  while (path && pageCount < MAX_PAGES) {
    pageCount++
    const response = await spotifyFetch(token, path)
    let data: TracksPage
    try {
      data = await response.json()
    } catch {
      throw new Error('Spotify API Fehler: ungültige Antwort')
    }

    for (const item of data.items ?? []) {
      if (item.track?.id) {
        allTracks.push({ id: item.track.id })
      }
    }

    if (data.next) {
      try {
        const nextUrl = new URL(data.next)
        path = nextUrl.pathname.replace(/^\/v1/, '') + nextUrl.search
      } catch {
        throw new Error('Spotify API Fehler: ungültige Antwort')
      }
    } else {
      path = null
    }
  }

  return allTracks
}

interface CreatePlaylistResponse {
  id: string
  external_urls: { spotify: string }
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string
): Promise<{ id: string; url: string }> {
  const body = JSON.stringify({ name, description: '', public: false })
  const response = await spotifyFetch(token, `/users/${userId}/playlists`, {
    method: 'POST',
    body,
  })
  let data: CreatePlaylistResponse
  try {
    data = await response.json()
  } catch {
    throw new Error('Spotify API Fehler: ungültige Antwort')
  }
  if (!data.id || !data.external_urls?.spotify) throw new Error('Spotify API Fehler: ungültige Antwort')
  return { id: data.id, url: data.external_urls.spotify }
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackIds: string[]
): Promise<void> {
  const BATCH_SIZE = 100
  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE)
    const uris = batch.map((id) => `spotify:track:${id}`)
    await spotifyFetch(token, `/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris }),
    })
  }
}
