import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/context/AppContext'

export function SuccessScreen() {
  const { state, dispatch } = useAppContext()
  const { playlistName, createdPlaylistUrl, createdTrackCount } = state

  return (
    <div
      role="alert"
      className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-6"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* Check-Icon in Sky-Kreis */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <CheckCircle2 className="h-8 w-8 text-sky-600" />
        </div>

        {/* Titel + Subtitle */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Playlist erstellt!</h2>
          <p className="text-sm text-gray-500 mt-1">{playlistName}</p>
          <p className="text-sm text-gray-500 mt-1">{createdTrackCount} Tracks hinzugefügt</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Button asChild className="bg-[#1DB954] hover:bg-[#1ed760] text-white w-full">
            <a href={createdPlaylistUrl ?? '#'} target="_blank" rel="noopener noreferrer">
              In Spotify öffnen
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              dispatch({ type: 'RESET_SELECTION' })
              dispatch({ type: 'SET_PHASE', payload: 'selection' })
            }}
          >
            Neue Playlist erstellen
          </Button>
        </div>
      </div>
    </div>
  )
}
