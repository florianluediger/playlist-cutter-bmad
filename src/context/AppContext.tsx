import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AppState, AppAction } from '@/types'
import { appReducer, initialState } from '@/context/appReducer'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext muss innerhalb von AppProvider verwendet werden')
  return context
}
