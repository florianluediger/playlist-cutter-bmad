// Spotify Web API Client — einziger Kontaktpunkt zur Spotify Web API
// Token wird immer als Parameter übergeben, kein direkter localStorage-Zugriff

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
