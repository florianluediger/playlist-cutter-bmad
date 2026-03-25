import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ToolbarProps {
  value: string
  onChange: (name: string) => void
  summary: string
  onSubmit: () => void
  disabled: boolean
}

export function Toolbar({ value, onChange, summary, onSubmit, disabled }: ToolbarProps) {
  const [isRippling, setIsRippling] = useState(false)

  function handleSubmit() {
    if (disabled) return
    setIsRippling(true)
    onSubmit()
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4 px-4 bg-white border-t border-gray-100">
      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        <label htmlFor="playlist-name" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Playlist-Name
        </label>
        <Input
          id="playlist-name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Meine neue Playlist"
          maxLength={100}
          className="flex-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
        />
        <span className="text-sm text-gray-500 whitespace-nowrap">{summary}</span>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        onAnimationEnd={() => setIsRippling(false)}
        className={`bg-sky-600 hover:bg-sky-700 text-white hover:-translate-y-px hover:shadow-md transition-all duration-150 md:w-auto w-full disabled:cursor-not-allowed ${isRippling ? 'button-ripple' : ''}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Erstellen
      </Button>
    </div>
  )
}
