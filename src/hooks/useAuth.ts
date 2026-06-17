import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { markAsReturningUser } from '@/lib/inviteStorage'

type AuthState = {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  session: Session | null
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
  })

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) markAsReturningUser()
      setState({
        status: data.session ? 'authenticated' : 'unauthenticated',
        session: data.session,
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) markAsReturningUser()
      setState({
        status: session ? 'authenticated' : 'unauthenticated',
        session,
      })
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}

export async function signOut() {
  await supabase.auth.signOut()
}
