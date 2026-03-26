import { useEffect, useRef } from 'react'
import { AppProvider, useAppContext } from '@/context/AppContext'
import { LoginScreen } from '@/components/LoginScreen'
import { SessionExpiredScreen } from '@/components/SessionExpiredScreen'
import { AppHeader } from '@/components/AppHeader'
import { PlaylistColumns } from '@/components/PlaylistColumns'
import { useAuth } from '@/hooks/useAuth'
import { isTokenValid, loadToken } from '@/lib/auth'
import { getUserProfile, getPlaylists, getPlaylistTracks, createPlaylist, addTracksToPlaylist } from '@/lib/spotifyApi'
import { runWithConcurrency } from '@/lib/concurrency'
import { buildTrackSet, calculateDiff } from '@/lib/diffEngine'

function AppContent() {
  const { state, dispatch } = useAppContext()
  const { handleCallback, handleAuthError } = useAuth()
  const callbackHandled = useRef(false)
  const playlistsLoaded = useRef(false)
  const trackDataRef = useRef<{ source: Set<string>; exclude: Set<string> } | null>(null)

  useEffect(() => {
    if (callbackHandled.current) return

    // 1. Session-Persistenz: gültiger Token → direkt zu loading
    const token = loadToken()
    if (token && isTokenValid()) {
      let cancelled = false
      getUserProfile(token)
        .then(({ displayName, userId }) => {
          if (cancelled) return
          dispatch({ type: 'SET_USER', payload: { displayName, userId } })
          dispatch({ type: 'SET_PHASE', payload: 'loading' })
        })
        .catch((error: unknown) => {
          if (cancelled) return
          if (
            error instanceof Error &&
            (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403')
          ) {
            handleAuthError()
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'Verbindungsproblem — bitte Seite neu laden.' })
          }
        })
      return () => {
        cancelled = true
      }
    }

    // 2. OAuth-Callback verarbeiten
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

  useEffect(() => {
    if (state.phase !== 'loading') return
    if (playlistsLoaded.current) return

    const token = loadToken()
    if (!token) return

    playlistsLoaded.current = true
    let cancelled = false

    getPlaylists(token)
      .then((playlists) => {
        if (cancelled) return
        dispatch({ type: 'SET_PLAYLISTS', payload: playlists })
        dispatch({ type: 'SET_PHASE', payload: 'selection' })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        playlistsLoaded.current = false
        if (
          error instanceof Error &&
          (error.message === 'Spotify API Fehler: 401' || error.message === 'Spotify API Fehler: 403')
        ) {
          handleAuthError()
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Playlisten konnten nicht geladen werden — bitte Seite neu laden.' })
          dispatch({ type: 'SET_PHASE', payload: 'error' })
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'creating') return

    let cancelled = false

    async function loadTracks() {
      const token = loadToken()
      if (!token) {
        dispatch({ type: 'SET_PHASE', payload: 'session-expired' })
        return
      }

      dispatch({ type: 'SET_PROGRESS', payload: 0 }) // P4: initialer 0%-Dispatch

      let playlistUrl: string | undefined

      try {
        const allIds = [...state.selectedSources, ...state.selectedExcludes]
        if (allIds.length === 0) return // P3: Guard gegen Division durch Null

        const tasks = allIds.map((playlistId) => () => getPlaylistTracks(token, playlistId))

        let completed = 0
        const wrappedTasks = tasks.map((task) => async () => {
          const result = await task()
          if (!cancelled) {
            completed++
            dispatch({ type: 'SET_PROGRESS', payload: Math.round((completed / tasks.length) * 80) })
          }
          return result
        })

        const results = await runWithConcurrency(wrappedTasks, 5)
        if (cancelled) return

        const sourceResults = results.slice(0, state.selectedSources.length)
        const excludeResults = results.slice(state.selectedSources.length)

        trackDataRef.current = {
          source: buildTrackSet(sourceResults),
          exclude: buildTrackSet(excludeResults),
        }

        const { source, exclude } = trackDataRef.current

        // Schritt: Diff berechnen
        const diff = calculateDiff(source, exclude)
        if (!cancelled) dispatch({ type: 'SET_PROGRESS', payload: 85 })

        // Guard: leere Differenz
        if (diff.length === 0) {
          if (!cancelled) {
            dispatch({ type: 'SET_ERROR', payload: 'Die Differenzmenge ist leer — alle Tracks sind in den Ausschluss-Playlisten enthalten.' })
            dispatch({ type: 'SET_PHASE', payload: 'error' })
          }
          return
        }

        // Schritt: Playlist erstellen
        if (!state.userId) throw new Error('Keine Nutzer-ID verfügbar')
        const { id: playlistId, url } = await createPlaylist(
          token,
          state.userId,
          state.playlistName
        )
        playlistUrl = url
        if (cancelled) return
        dispatch({ type: 'SET_PROGRESS', payload: 90 })

        // Schritt: Tracks hinzufügen
        await addTracksToPlaylist(token, playlistId, diff)
        if (cancelled) return

        // Erfolg
        dispatch({ type: 'SET_CREATED_PLAYLIST', payload: { url: playlistUrl, trackCount: diff.length } })
        dispatch({ type: 'SET_PROGRESS', payload: 100 })
        dispatch({ type: 'SET_PHASE', payload: 'success' })
      } catch (err) {
        if (!cancelled) {
          // P1: Auth-Fehler → Session-Expired-Flow, nicht generischer Error-Screen
          if (
            err instanceof Error &&
            (err.message === 'Spotify API Fehler: 401' || err.message === 'Spotify API Fehler: 403')
          ) {
            handleAuthError()
          } else if (playlistUrl) {
            // Playlist wurde erstellt, aber Track-Hinzufügen schlug fehl
            dispatch({ type: 'SET_ERROR', payload: `Tracks konnten nicht zur Playlist hinzugefügt werden. Die erstellte (leere) Playlist ist hier verfügbar: ${playlistUrl}` })
            dispatch({ type: 'SET_PHASE', payload: 'error' })
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'Fehler beim Erstellen der Playlist. Bitte versuche es erneut.' })
            dispatch({ type: 'SET_PHASE', payload: 'error' })
          }
        }
      }
    }

    loadTracks()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  switch (state.phase) {
    case 'login':
      return <LoginScreen />
    case 'session-expired':
      return <SessionExpiredScreen />
    case 'loading':
      return (
        <>
          <AppHeader />
          <PlaylistColumns />
        </>
      )
    case 'selection':
      return (
        <>
          <AppHeader />
          <PlaylistColumns />
        </>
      )
    case 'creating':
      return (
        <>
          <AppHeader />
          <main
            aria-live="polite"
            className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" aria-hidden="true" />
            <p className="text-lg font-semibold text-gray-900">{state.playlistName}</p>
            <p className="text-sm text-gray-500">Erstelle Playlist…</p>
          </main>
        </>
      )
    case 'error':
      return (
        <>
          <AppHeader />
          <main className="max-w-6xl mx-auto p-6 md:p-8">
            <p className="text-red-600">{state.error ?? 'Ein Fehler ist aufgetreten.'}</p>
          </main>
        </>
      )
    default:
      return (
        <>
          <AppHeader />
          <div>Playlisten werden geladen…</div>
        </>
      )
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
