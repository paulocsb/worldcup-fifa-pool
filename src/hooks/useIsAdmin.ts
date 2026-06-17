import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'

/**
 * Retorna true se o usuário logado é admin (profiles.is_admin = true).
 * Loading state: retorna undefined enquanto carrega.
 */
export function useIsAdmin(): boolean | undefined {
  const auth = useAuth()
  const profile = useProfile(auth.session?.user.id)
  if (profile.isPending) return undefined
  return profile.data?.is_admin === true
}
