import { useEffect, useMemo, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription?.unsubscribe?.()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signOut: () => supabase.auth.signOut(),
      signInWithProvider: (provider) =>
        supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
      signInWithMagicLink: async (email, nextPath) => {
        const origin = window.location.origin
        const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
        // Try to find an existing user id via RPC (requires SQL in README)
        let id
        try {
          const { data: rpcData } = await supabase.rpc('get_user_id_by_email', { p_email: email })
          if (rpcData) id = rpcData
        } catch {
          // ignore RPC errors; not critical for flow
        }

        if (id) {
          // Existing user: send magic link to /auth/:id
          return supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${origin}/auth/${id}${next}` },
          })
        }

        // New user: sign up to get a UUID, then send a magic link to /auth/:id
        const signup = await supabase.auth.signUp({ email })
        const newId = signup.data?.user?.id
        if (!newId) return { error: signup.error || new Error('Unable to create user') }
        // Supabase already sent the confirmation email on signUp using its template.
        // To control redirect, we send an additional magic link that lands at /auth/:id
        return supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${origin}/auth/${newId}${next}` },
        })
      },
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
