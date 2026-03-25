import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA]">
      <h1 className="text-4xl font-bold text-sky-600">Playlist Cutter</h1>
      <p className="mt-2 text-sm text-gray-500">
        Kombiniere deine Playlisten intelligent
      </p>
      <div className="mt-8">
        <Button
          className="bg-sky-600 text-white hover:bg-sky-700"
          onClick={login}
        >
          <LogIn />
          Mit Spotify anmelden
        </Button>
      </div>
    </div>
  )
}
