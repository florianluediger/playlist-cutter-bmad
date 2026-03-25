import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  saveToken,
  loadToken,
  clearToken,
  isTokenValid,
} from '@/lib/auth'

describe('generateCodeVerifier', () => {
  it('erzeugt einen String mit genau 64 Zeichen', () => {
    const verifier = generateCodeVerifier()
    expect(verifier).toHaveLength(64)
  })

  it('verwendet nur erlaubte URL-safe Zeichen', () => {
    const verifier = generateCodeVerifier()
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/)
  })

  it('erzeugt bei jedem Aufruf unterschiedliche Werte', () => {
    const v1 = generateCodeVerifier()
    const v2 = generateCodeVerifier()
    expect(v1).not.toBe(v2)
  })
})

describe('generateCodeChallenge', () => {
  it('erzeugt einen deterministischen Challenge für einen bekannten Verifier', async () => {
    // Bekannter Wert aus RFC 7636 Beispiel
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
    const challenge1 = await generateCodeChallenge(verifier)
    const challenge2 = await generateCodeChallenge(verifier)
    expect(challenge1).toBe(challenge2)
  })

  it('gibt einen base64url-kodierten String ohne Padding zurück', async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge).not.toMatch(/[+/=]/)
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
  })
})

describe('saveToken / loadToken / clearToken / isTokenValid', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('saveToken speichert Token in localStorage', () => {
    saveToken('test-token', 3600)
    expect(localStorage.getItem('playlist_cutter_access_token')).toBe('test-token')
  })

  it('loadToken gibt gespeicherten Token zurück wenn gültig', () => {
    saveToken('test-token', 3600)
    expect(loadToken()).toBe('test-token')
  })

  it('loadToken gibt null zurück wenn kein Token vorhanden', () => {
    expect(loadToken()).toBeNull()
  })

  it('loadToken gibt null zurück wenn Token abgelaufen', () => {
    // Ablaufzeit in der Vergangenheit setzen
    localStorage.setItem('playlist_cutter_access_token', 'expired-token')
    localStorage.setItem('playlist_cutter_token_expiry', (Date.now() - 1000).toString())
    expect(loadToken()).toBeNull()
  })

  it('loadToken löscht abgelaufenen Token aus localStorage', () => {
    localStorage.setItem('playlist_cutter_access_token', 'expired-token')
    localStorage.setItem('playlist_cutter_token_expiry', (Date.now() - 1000).toString())
    loadToken()
    expect(localStorage.getItem('playlist_cutter_access_token')).toBeNull()
  })

  it('clearToken entfernt Token und Ablaufzeit aus localStorage', () => {
    saveToken('test-token', 3600)
    clearToken()
    expect(localStorage.getItem('playlist_cutter_access_token')).toBeNull()
    expect(localStorage.getItem('playlist_cutter_token_expiry')).toBeNull()
  })

  it('isTokenValid gibt true zurück bei gültigem Token', () => {
    saveToken('test-token', 3600)
    expect(isTokenValid()).toBe(true)
  })

  it('isTokenValid gibt false zurück ohne Token', () => {
    expect(isTokenValid()).toBe(false)
  })

  it('isTokenValid gibt false zurück bei abgelaufenem Token', () => {
    localStorage.setItem('playlist_cutter_access_token', 'expired-token')
    localStorage.setItem('playlist_cutter_token_expiry', (Date.now() - 1000).toString())
    expect(isTokenValid()).toBe(false)
  })
})
