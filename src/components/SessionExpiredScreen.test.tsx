import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionExpiredScreen } from '@/components/SessionExpiredScreen'

const mockLogin = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

describe('SessionExpiredScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rendert die Überschrift "Sitzung abgelaufen"', () => {
    render(<SessionExpiredScreen />)
    expect(screen.getByRole('heading', { name: 'Sitzung abgelaufen' })).toBeTruthy()
  })

  it('rendert die Beschreibung "Deine Sitzung ist abgelaufen"', () => {
    render(<SessionExpiredScreen />)
    expect(screen.getByText(/Deine Sitzung ist abgelaufen/)).toBeTruthy()
  })

  it('rendert den "Erneut anmelden"-Button', () => {
    render(<SessionExpiredScreen />)
    expect(screen.getByRole('button', { name: /Erneut anmelden/ })).toBeTruthy()
  })

  it('ruft login() auf wenn der Button geklickt wird', async () => {
    const user = userEvent.setup()
    render(<SessionExpiredScreen />)

    await user.click(screen.getByRole('button', { name: /Erneut anmelden/ }))

    expect(mockLogin).toHaveBeenCalledOnce()
  })

  it('zeigt keinen technischen Fehlercode im Text', () => {
    render(<SessionExpiredScreen />)
    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/401/)
    expect(bodyText).not.toMatch(/403/)
    expect(bodyText).not.toMatch(/Unauthorized/)
  })

  it('rendert keinen AppHeader', () => {
    render(<SessionExpiredScreen />)
    expect(screen.queryByRole('banner')).toBeNull()
  })
})
