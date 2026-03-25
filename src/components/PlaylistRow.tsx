import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface PlaylistRowProps {
  name: string
  trackCount: number
  role: 'source' | 'exclude'
  selected: boolean
  onToggle: () => void
}

export function PlaylistRow({ name, trackCount, role, selected, onToggle }: PlaylistRowProps) {
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

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={name}
      className={`flex items-center gap-3 py-3 px-4 border-l-4 cursor-pointer transition-all duration-200 ${borderClass} ${!selected ? 'hover:bg-gray-50' : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle() } }}
      tabIndex={0}
    >
      <span aria-hidden="true" className={isAnimating ? 'checkbox-pop' : undefined}>
        <Checkbox checked={selected} tabIndex={-1} />
      </span>
      <span className="flex-1 text-sm font-medium text-gray-900 truncate">{name}</span>
      <span className="text-xs text-gray-400 shrink-0">{trackCount} Tracks</span>
    </div>
  )
}
