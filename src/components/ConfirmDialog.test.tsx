import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach } from 'vitest'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useMediaQuery } from '@/hooks/useMediaQuery'

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn().mockReturnValue(true), // Desktop als Default
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useMediaQuery).mockReturnValue(true)
})

const defaultProps = {
  isOpen: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  playlistName: 'Meine Playlist',
  sourceCount: 3,
  excludeCount: 1,
}

test('Dialog zeigt Playlist-Namen', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText('Meine Playlist')).toBeInTheDocument()
})

test('Dialog zeigt Quellen-Anzahl', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText(/3 Playlisten/)).toBeInTheDocument()
})

test('Dialog zeigt Ausschlüsse-Anzahl', () => {
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText(/1 Playlist/)).toBeInTheDocument()
})


test('"Erstellen"-Button ruft onConfirm auf', async () => {
  const onConfirm = vi.fn()
  render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
  await userEvent.click(screen.getByRole('button', { name: /erstellen/i }))
  expect(onConfirm).toHaveBeenCalledOnce()
})

test('"Abbrechen"-Button ruft onCancel auf', async () => {
  const onCancel = vi.fn()
  render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
  await userEvent.click(screen.getByRole('button', { name: /abbrechen/i }))
  expect(onCancel).toHaveBeenCalledOnce()
})

test('Dialog nicht sichtbar wenn isOpen=false', () => {
  render(<ConfirmDialog {...defaultProps} isOpen={false} />)
  expect(screen.queryByText('Meine Playlist')).not.toBeInTheDocument()
})

test('Mobile: Drawer zeigt Zusammenfassung korrekt', () => {
  vi.mocked(useMediaQuery).mockReturnValue(false)
  render(<ConfirmDialog {...defaultProps} />)
  expect(screen.getByText('Meine Playlist')).toBeInTheDocument()
  expect(screen.getByText(/3 Playlisten/)).toBeInTheDocument()
})

