import { useAppContext } from '@/context/AppContext'
import { ColumnHeader } from '@/components/ColumnHeader'
import { PlaylistRow } from '@/components/PlaylistRow'
import { EmptyState } from '@/components/EmptyState'

const SKELETON_COUNT = 6

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 animate-pulse">
      <div className="h-4 w-4 bg-gray-200 rounded" />
      <div className="h-4 flex-1 bg-gray-200 rounded" />
      <div className="h-4 w-12 bg-gray-200 rounded" />
    </div>
  )
}

function SkeletonColumn() {
  return (
    <div>
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}

export function PlaylistColumns() {
  const { state, dispatch } = useAppContext()
  const { phase, playlists, selectedSources, selectedExcludes } = state

  if (phase === 'loading') {
    return (
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      </main>
    )
  }

  if (playlists.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <EmptyState />
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ColumnHeader role="source" selectedCount={selectedSources.length} />
          <div className="flex flex-col gap-1">
            {playlists.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                name={playlist.name}
                trackCount={playlist.trackCount}
                role="source"
                selected={selectedSources.includes(playlist.id)}
                onToggle={() => dispatch({ type: 'TOGGLE_SOURCE', payload: playlist.id })}
              />
            ))}
          </div>
        </div>
        <div>
          <ColumnHeader role="exclude" selectedCount={selectedExcludes.length} />
          <div className="flex flex-col gap-1">
            {playlists.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                name={playlist.name}
                trackCount={playlist.trackCount}
                role="exclude"
                selected={selectedExcludes.includes(playlist.id)}
                onToggle={() => dispatch({ type: 'TOGGLE_EXCLUDE', payload: playlist.id })}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
