import { AlertCircle, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function SessionExpiredScreen() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full mx-auto px-6 py-10 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
        <AlertCircle className="mx-auto mb-4 text-amber-400" size={32} />
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Sitzung abgelaufen</h1>
        <p className="text-sm text-gray-500 mb-6">
          Deine Sitzung ist abgelaufen — bitte melde dich erneut an.
        </p>
        <Button
          className="w-full bg-sky-600 text-white hover:bg-sky-700"
          onClick={login}
        >
          <LogIn />
          Erneut anmelden
        </Button>
      </div>
    </div>
  )
}
