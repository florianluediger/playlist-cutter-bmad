import { useState, useEffect } from 'react'

interface ColumnHeaderProps {
  role: 'source' | 'exclude'
  selectedCount: number
}

export function ColumnHeader({ role, selectedCount }: ColumnHeaderProps) {
  const isSource = role === 'source'
  const [isBouncing, setIsBouncing] = useState(false)
  const [displayCount, setDisplayCount] = useState(selectedCount)

  useEffect(() => {
    if (selectedCount > 0) {
      setDisplayCount(selectedCount)
      setIsBouncing(true)
      const timer = setTimeout(() => setIsBouncing(false), 300)
      return () => clearTimeout(timer)
    }
  }, [selectedCount])

  return (
    <div className="flex items-center gap-2 mb-4">
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold ${
          isSource ? 'bg-sky-600' : 'bg-rose-500'
        }`}
      >
        {isSource ? '+' : '−'}
      </span>
      <h2 className="font-semibold text-gray-900">{isSource ? 'Quellen' : 'Ausschlüsse'}</h2>
      {(selectedCount > 0 || isBouncing) && (
        <span className={`ml-auto text-sm text-gray-500 ${isBouncing ? 'badge-bounce' : ''}`}>
          {displayCount} ausgewählt
        </span>
      )}
    </div>
  )
}
