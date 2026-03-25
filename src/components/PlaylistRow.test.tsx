import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaylistRow } from '@/components/PlaylistRow'

describe('PlaylistRow', () => {
  it('rendert Name und Track-Anzahl korrekt', () => {
    render(
      <PlaylistRow
        name="Meine Playlist"
        trackCount={42}
        role="source"
        selected={false}
        onToggle={() => {}}
      />,
    )

    expect(screen.getByText('Meine Playlist')).toBeInTheDocument()
    expect(screen.getByText('42 Tracks')).toBeInTheDocument()
  })

  it('Checkbox hat aria-checked gesetzt (false)', () => {
    render(
      <PlaylistRow
        name="Test Playlist"
        trackCount={10}
        role="source"
        selected={false}
        onToggle={() => {}}
      />,
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })

  it('Checkbox hat aria-checked gesetzt (true)', () => {
    render(
      <PlaylistRow
        name="Test Playlist"
        trackCount={10}
        role="source"
        selected={true}
        onToggle={() => {}}
      />,
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  it('onToggle wird bei Klick auf die Row aufgerufen', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <PlaylistRow
        name="Klick Playlist"
        trackCount={5}
        role="exclude"
        selected={false}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByText('Klick Playlist'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('onToggle wird bei Space-Taste auf der Row aufgerufen', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <PlaylistRow
        name="Keyboard Playlist"
        trackCount={3}
        role="source"
        selected={false}
        onToggle={onToggle}
      />,
    )

    const row = screen.getByText('Keyboard Playlist').closest('div[tabindex="0"]')! as HTMLElement
    row.focus()
    await user.keyboard(' ')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
