import { useEffect, useRef } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LoginScreen } from '@/components/LoginScreen'
import { useAuth } from '@/hooks/useAuth'

function AppContent() {
  const { state } = useAppContext()
  const { handleCallback } = useAuth()
  const callbackHandled = useRef(false)

  useEffect(() => {
    if (callbackHandled.current) return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error || !code) {
      window.history.replaceState({}, '', '/')
      return
    }

    callbackHandled.current = true
    handleCallback(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  switch (state.phase) {
    case 'login':
      return <LoginScreen />
    default:
      return <div>Playlisten werden geladen…</div>
  }
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
