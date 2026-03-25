// Spotify Web API Client — einziger Kontaktpunkt zur Spotify Web API
// Token wird immer als Parameter übergeben, kein direkter localStorage-Zugriff

import type { Playlist } from '@/types'

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1'

async function spotifyFetch(token: string, path: string): Promise<Response> {
  const response = await fetch(`${SPOTIFY_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Spotify API Fehler: ${response.status}`)
  return response
}

export async function getUserProfile(token: string): Promise<{ displayName: string }> {
  const response = await spotifyFetch(token, '/me')
  let data: { display_name: string | null }
  try {
    data = await response.json()
  } catch {
    throw new Error('Spotify API Fehler: ungültige Antwort')
  }
  return { displayName: data.display_name ?? 'Nutzer' }
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
      const nextUrl = new URL(data.next)
      path = nextUrl.pathname + nextUrl.search
    } else {
      path = null
    }
  }

  return allPlaylists
}
