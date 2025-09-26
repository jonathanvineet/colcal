import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { ensureProfile, profileExists } from '../lib/profiles'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finalizing sign-in…')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const url = new URL(window.location.href)
      const next = url.searchParams.get('next') || '/'
      const errorParam = url.searchParams.get('error') || new URLSearchParams(url.hash.slice(1)).get('error')
      const errorDesc = url.searchParams.get('error_description') || new URLSearchParams(url.hash.slice(1)).get('error_description')
      if (errorParam || errorDesc) {
        setHasError(true)
        setMessage(decodeURIComponent(errorDesc || errorParam))
        return
      }
      // For PKCE/OAuth and magic links, Supabase parses the URL fragment automatically
      // But we can force a session check and then navigate
      // Attempt to exchange auth code only if present; Supabase can also auto-detect via detectSessionInUrl
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
      const hasCode = !!(url.searchParams.get('code') || hashParams.get('code'))
      if (hasCode) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
        const benign = exchErr?.message?.includes('Authorization code or verifier not found') ||
          exchErr?.message?.includes('both auth code and code verifier should be non-empty')
        if (exchErr && !benign) {
          setHasError(true)
          setMessage(exchErr.message)
          return
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        setHasError(true)
        setMessage(error.message)
      } else if (data?.session) {
        const session = data.session
        const user = session.user
        const providers = user?.identities?.map((i) => i.provider) || []
        const magicConfirmed = user?.user_metadata?.magic_confirmed === true

        // If the user signed in via magic link, mark them as confirmed and ensure a profile row
        if (providers.includes('email') && !magicConfirmed) {
          await supabase.auth.updateUser({ data: { magic_confirmed: true } })
          await ensureProfile(user)
          navigate(next, { replace: true })
          return
        }

        // If the user signed in via Google but hasn't confirmed via magic link before,
        // send a magic link and sign them out to enforce email verification sign-up.
        if (providers.includes('google') && !magicConfirmed) {
          // Decide based on real user existence, not heuristics
          const exists = await profileExists(user.id)
          if (!exists) {
            const email = user.email
            if (email) {
              const base = `${window.location.origin}/auth/${user.id}`
              const emailRedirectTo = next ? `${base}?next=${encodeURIComponent(next)}` : base
              await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo, shouldCreateUser: true },
              })
              await supabase.auth.signOut()
              setHasError(true)
              setMessage('We sent a magic link to your email to complete sign-up. Please check your inbox and click the link to verify, then sign in again.')
              return
            }
          }
        }

  // Otherwise, proceed into the app
        navigate(next, { replace: true })
      } else {
        // If the hash contains code, let supabase handle it
        const { error: e2 } = hasCode ? await supabase.auth.exchangeCodeForSession(window.location.href) : { error: null }
        if (e2 && !e2.message?.includes('Authorization code or verifier not found') && !e2.message?.includes('both auth code and code verifier should be non-empty')) {
          setHasError(true)
          setMessage(e2.message)
        }
        const url = new URL(window.location.href)
        const next = url.searchParams.get('next') || '/'
        navigate(next, { replace: true })
      }
    })()
    return () => {
      mounted = false
    }
  }, [navigate])

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>{hasError ? 'Sign-in issue' : 'Redirecting…'}</h1>
        <p className="muted">{message}</p>
        {hasError && (
          <p style={{ marginTop: 12 }}>
            <a href="/login">Back to login</a>
          </p>
        )}
      </div>
    </div>
  )
}
