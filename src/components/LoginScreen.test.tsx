import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginScreen } from '@/components/LoginScreen'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}))

describe('LoginScreen', () => {
  it('rendert den App-Titel', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Playlist Cutter')).toBeInTheDocument()
  })

  it('zeigt den Titel und Login-Button', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Playlist Cutter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mit spotify anmelden/i })).toBeInTheDocument()
  })
})
