import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/context/AppContext'
import { useAuth } from '@/hooks/useAuth'

export function AppHeader() {
  const { state, dispatch } = useAppContext()
  const { logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <button
          className="text-xl font-bold text-sky-600 cursor-pointer hover:text-sky-700 transition-colors"
          onClick={() => dispatch({ type: 'SET_PHASE', payload: 'selection' })}
        >
          Playlist Cutter
        </button>
        <div className="flex gap-3 items-center">
          {state.userName && (
            <>
              <span className="text-sm text-gray-500">{state.userName}</span>
              <span className="text-gray-300">|</span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Abmelden
          </Button>
        </div>
      </div>
    </header>
  )
}
