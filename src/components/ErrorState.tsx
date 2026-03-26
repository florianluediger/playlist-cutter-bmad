import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/context/AppContext'

export function ErrorState() {
  const { state, dispatch } = useAppContext()

  return (
    <main
      role="alert"
      className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-6"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* Warn-Icon */}
        <AlertTriangle className="h-12 w-12 text-amber-500" />

        {/* Fehlertext */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fehler beim Erstellen</h2>
          <p className="text-sm text-gray-500 mt-2">
            {state.error || 'Ein unbekannter Fehler ist aufgetreten.'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={() => dispatch({ type: 'SET_PHASE', payload: 'creating' })}
          >
            Nochmal versuchen
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: 'RESET_SELECTION' })
              dispatch({ type: 'SET_PHASE', payload: 'selection' })
            }}
          >
            Zurück zur Auswahl
          </Button>
        </div>
      </div>
    </main>
  )
}
