import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface PlaylistRowProps {
  name: string
  trackCount: number
  role: 'source' | 'exclude'
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

export function PlaylistRow({ name, trackCount, role, selected, onToggle, disabled = false }: PlaylistRowProps) {
  const isSource = role === 'source'
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (selected) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 200)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [selected])

  const borderClass = selected
    ? isSource
      ? 'border-l-sky-600 bg-sky-50'
      : 'border-l-rose-500 bg-rose-50'
    : 'border-l-transparent'

  const containerClass = disabled
    ? 'opacity-50 cursor-not-allowed border-l-transparent'
    : `${borderClass} ${!selected ? 'hover:bg-gray-50' : ''} cursor-pointer`

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={name}
      className={`flex items-center gap-3 py-3 px-4 border-l-4 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-lg ${containerClass}`}
      onClick={() => { if (!disabled) onToggle() }}
      onKeyDown={(e) => { if (disabled) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle() } }}
      tabIndex={disabled ? -1 : 0}
    >
      <span aria-hidden="true" className={`pointer-events-none${isAnimating ? ' checkbox-pop' : ''}`}>
        <Checkbox checked={selected} tabIndex={-1} />
      </span>
      <span className="flex-1 text-sm font-medium text-gray-900 truncate">{name}</span>
      <span className="text-xs text-gray-400 shrink-0">{trackCount} Tracks</span>
    </div>
  )
}
