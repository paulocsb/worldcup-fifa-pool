import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
      setState({
        status: data.session ? 'authenticated' : 'unauthenticated',
        session: data.session,
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
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
