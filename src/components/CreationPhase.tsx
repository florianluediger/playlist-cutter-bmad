import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/context/AppContext'

type StepStatus = 'done' | 'active' | 'pending'

function getStepStatus(progress: number, doneAt: number, activeFrom: number): StepStatus {
  if (progress >= doneAt) return 'done'
  if (progress >= activeFrom) return 'active'
  return 'pending'
}

export function CreationPhase() {
  const { state, dispatch } = useAppContext()
  const { progress, playlistName } = state
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (progress === 100) return
    setTimedOut(false)
    const timer = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(timer)
  }, [progress])

  const steps = [
    { label: 'Tracks laden', status: getStepStatus(progress, 80, 0) },
    { label: 'Differenz berechnen', status: getStepStatus(progress, 85, 80) },
    { label: 'Playlist anlegen', status: getStepStatus(progress, 90, 85) },
    { label: 'Tracks hinzufügen', status: getStepStatus(progress, 100, 90) },
  ]

  return (
    <div
      aria-live="polite"
      className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-6"
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Playlist wird erstellt…</h2>
          <p className="text-sm text-gray-500 mt-1">{playlistName}</p>
        </div>

        <Progress value={progress} className="[&>*]:bg-sky-600" />

        {timedOut ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-500">
              Die Verbindung zu Spotify scheint unterbrochen. Was möchtest du tun?
            </p>
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => dispatch({ type: 'SET_PHASE', payload: 'selection' })}
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
        ) : (
          <ol aria-label="Erstellungsfortschritt" className="flex flex-col gap-3">
            {steps.map((step) => (
              <li
                key={step.label}
                aria-current={step.status === 'active' ? 'step' : undefined}
                className="flex items-center gap-3"
              >
                {step.status === 'done' && (
                  <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
                )}
                {step.status === 'active' && (
                  <span aria-hidden="true" className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-600" />
                  </span>
                )}
                {step.status === 'pending' && (
                  <span aria-hidden="true" className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                  </span>
                )}
                <span className="text-sm text-gray-700 font-medium">
                  {step.label}
                  {step.status === 'active' && (
                    <span className="sr-only"> (läuft gerade)</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
