import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AppState, AppAction } from '@/types'
import { appReducer, initialState } from '@/context/appReducer'
import { isTokenValid } from '@/lib/auth'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    let hasToken = false
    try {
      hasToken = isTokenValid()
    } catch {
      // localStorage nicht verfügbar (SSR, eingeschränkte Umgebung)
    }
    return { ...initialState, phase: hasToken ? 'loading' : 'login' }
  })
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext muss innerhalb von AppProvider verwendet werden')
  return context
}
