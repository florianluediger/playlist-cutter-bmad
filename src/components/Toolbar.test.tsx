import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '@/components/Toolbar'

beforeEach(() => {
  vi.clearAllMocks()
})

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  summary: '0 Quellen · 0 Ausschlüsse',
  onSubmit: vi.fn(),
  disabled: true,
}

test('Input ist sichtbar und zeigt den übergebenen Wert', () => {
  render(<Toolbar {...defaultProps} value="Meine Playlist" />)
  expect(screen.getByRole('textbox')).toHaveValue('Meine Playlist')
})

test('Button ist disabled wenn disabled=true', () => {
  render(<Toolbar {...defaultProps} disabled={true} />)
  expect(screen.getByRole('button', { name: /erstellen/i })).toBeDisabled()
})

test('Button ist aktiv wenn disabled=false', () => {
  render(<Toolbar {...defaultProps} disabled={false} />)
  expect(screen.getByRole('button', { name: /erstellen/i })).not.toBeDisabled()
})

test('onChange wird aufgerufen wenn Input geändert wird', async () => {
  const onChange = vi.fn()
  render(<Toolbar {...defaultProps} onChange={onChange} />)
  await userEvent.type(screen.getByRole('textbox'), 'Test')
  expect(onChange).toHaveBeenCalled()
})

test('Summary-Text wird angezeigt', () => {
  render(<Toolbar {...defaultProps} summary="2 Quellen · 0 Ausschlüsse" />)
  expect(screen.getByText('2 Quellen · 0 Ausschlüsse')).toBeInTheDocument()
})

test('onSubmit wird aufgerufen wenn Button geklickt und nicht disabled', async () => {
  const onSubmit = vi.fn()
  render(<Toolbar {...defaultProps} disabled={false} onSubmit={onSubmit} />)
  await userEvent.click(screen.getByRole('button', { name: /erstellen/i }))
  expect(onSubmit).toHaveBeenCalled()
})

test('onSubmit wird NICHT aufgerufen wenn Button disabled', async () => {
  const onSubmit = vi.fn()
  render(<Toolbar {...defaultProps} disabled={true} onSubmit={onSubmit} />)
  await userEvent.click(screen.getByRole('button', { name: /erstellen/i }))
  expect(onSubmit).not.toHaveBeenCalled()
})

test('button-ripple Klasse wird nach Klick gesetzt', async () => {
  render(<Toolbar {...defaultProps} disabled={false} />)
  const button = screen.getByRole('button', { name: /erstellen/i })
  await userEvent.click(button)
  expect(button).toHaveClass('button-ripple')
})
