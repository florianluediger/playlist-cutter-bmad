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
        className={`flex items-center justify-center w-6 h-6 rounded-full text-white ${
          isSource ? 'bg-sky-600' : 'bg-rose-500'
        }`}
      >
        {isSource ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
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
