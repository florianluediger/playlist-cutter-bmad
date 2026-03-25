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
  const selectedClass = selected
    ? isSource
      ? 'bg-sky-50 border-sky-300'
      : 'bg-rose-50 border-rose-300'
    : 'border-transparent'

  return (
    <div
      className={`flex items-center gap-3 py-3 px-4 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${selectedClass}`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle() } }}
      tabIndex={0}
    >
      <Checkbox
        checked={selected}
        aria-checked={selected}
        aria-label={name}
        tabIndex={-1}
      />
      <span className="flex-1 text-sm font-medium text-gray-900 truncate">{name}</span>
      <span className="text-xs text-gray-400 shrink-0">{trackCount} Tracks</span>
    </div>
  )
}
