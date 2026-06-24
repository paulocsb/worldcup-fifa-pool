import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { BottomNav } from './BottomNav'

export function ProtectedLayout() {
  const location = useLocation()
  const auth = useAuth()
  const profile = useProfile(auth.session?.user.id)

  if (auth.status === 'loading') {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Esperar profile carregar antes de redirecionar (evita flash p/ onboarding)
  if (profile.isLoading) {
    return (
      <main className="container flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  const needsOnboarding = !profile.data
  const isOnOnboarding = location.pathname === '/onboarding'

  if (needsOnboarding && !isOnOnboarding) {
    return <Navigate to="/onboarding" replace />
  }
  if (!needsOnboarding && isOnOnboarding) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-dvh flex-col">
      <main className="flex-1 overflow-y-auto overscroll-contain pt-safe-top">
        <Outlet />
      </main>
      {!isOnOnboarding && <BottomNav />}
    </div>
  )
}
