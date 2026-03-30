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

  it('hat border-l-sky-600 Klasse wenn selected=true und role=source', () => {
    render(
      <PlaylistRow
        name="Source Playlist"
        trackCount={5}
        role="source"
        selected={true}
        onToggle={() => {}}
      />,
    )

    const row = screen.getByText('Source Playlist').closest('div[tabindex="0"]')! as HTMLElement
    expect(row.className).toContain('border-l-sky-600')
  })

  it('hat border-l-rose-500 Klasse wenn selected=true und role=exclude', () => {
    render(
      <PlaylistRow
        name="Exclude Playlist"
        trackCount={5}
        role="exclude"
        selected={true}
        onToggle={() => {}}
      />,
    )

    const row = screen.getByText('Exclude Playlist').closest('div[tabindex="0"]')! as HTMLElement
    expect(row.className).toContain('border-l-rose-500')
  })

  it('hat focus-visible:ring-* Klassen für sichtbaren Fokus-Ring (WCAG AC1)', () => {
    render(
      <PlaylistRow
        name="Focus Playlist"
        trackCount={3}
        role="source"
        selected={false}
        onToggle={() => {}}
      />,
    )

    const row = screen.getByRole('checkbox')
    expect(row.className).toContain('focus-visible:ring-2')
    expect(row.className).toContain('focus-visible:ring-sky-500')
    expect(row.className).toContain('focus-visible:outline-none')
    expect(row.className).toContain('rounded-lg')
  })

  it('disabled=true: aria-disabled="true" ist gesetzt', () => {
    render(
      <PlaylistRow
        name="Disabled Playlist"
        trackCount={5}
        role="source"
        selected={false}
        onToggle={() => {}}
        disabled={true}
      />,
    )

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true')
  })

  it('disabled=true: onToggle wird bei Klick NICHT aufgerufen', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <PlaylistRow
        name="Disabled Klick"
        trackCount={5}
        role="source"
        selected={false}
        onToggle={onToggle}
        disabled={true}
      />,
    )

    await user.click(screen.getByText('Disabled Klick'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('disabled=true: onToggle wird bei Space-Taste NICHT aufgerufen', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <PlaylistRow
        name="Disabled Space"
        trackCount={5}
        role="source"
        selected={false}
        onToggle={onToggle}
        disabled={true}
      />,
    )

    const row = screen.getByRole('checkbox')
    row.focus()
    expect(document.activeElement).toBe(row)
    await user.keyboard(' ')
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('disabled=true: tabIndex ist -1', () => {
    render(
      <PlaylistRow
        name="Disabled TabIndex"
        trackCount={5}
        role="source"
        selected={false}
        onToggle={() => {}}
        disabled={true}
      />,
    )

    expect(screen.getByRole('checkbox')).toHaveAttribute('tabindex', '-1')
  })

  it('disabled=true: Container hat opacity-50 und cursor-not-allowed Klassen', () => {
    render(
      <PlaylistRow
        name="Disabled Style"
        trackCount={5}
        role="source"
        selected={false}
        onToggle={() => {}}
        disabled={true}
      />,
    )

    const row = screen.getByRole('checkbox')
    expect(row.className).toContain('opacity-50')
    expect(row.className).toContain('cursor-not-allowed')
  })
})
