// PKCE OAuth-Helpers + localStorage-Boundary
// Einzige Datei im Projekt die auf localStorage zugreift

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SCOPES = 'playlist-read-private playlist-modify-public playlist-modify-private'
const PKCE_VERIFIER_KEY = 'pkce_code_verifier'
const TOKEN_KEY = 'playlist_cutter_access_token'
const TOKEN_EXPIRY_KEY = 'playlist_cutter_token_expiry'

const ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

export function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map(byte => ALLOWED_CHARS[byte % ALLOWED_CHARS.length])
    .join('')
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function buildAuthUrl(verifier: string): Promise<string> {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  const challenge = await generateCodeChallenge(verifier)
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)
  if (!verifier) throw new Error('Code verifier nicht gefunden')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) throw new Error('Token-Exchange fehlgeschlagen')

  sessionStorage.removeItem(PKCE_VERIFIER_KEY)

  const data = await response.json()
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

export function saveToken(accessToken: string, expiresIn: number): void {
  const expiryTime = Date.now() + expiresIn * 1000
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())
}

export function loadToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() > parseInt(expiry, 10)) {
    clearToken()
    return null
  }
  return token
}

export function isTokenValid(): boolean {
  return loadToken() !== null
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}
