import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import supabase from '../lib/supabaseClient'
import { ensureProfile } from '../lib/profiles'

export default function AuthUser() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [msg, setMsg] = useState('Finalizing sign-in…')
  const [err, setErr] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const url = new URL(window.location.href)
      const next = url.searchParams.get('next') || '/'

      // Try to exchange code only when present
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
      const hasCode = !!(url.searchParams.get('code') || hashParams.get('code'))
      if (hasCode) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
        const benign = exchErr?.message?.includes('Authorization code or verifier not found') ||
          exchErr?.message?.includes('both auth code and code verifier should be non-empty')
        if (exchErr && !benign) {
          if (!mounted) return
          setErr(true)
          setMsg(exchErr.message)
          return
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        setErr(true)
        setMsg(error.message)
        return
      }
      const user = data.session?.user
      if (!user) {
        setErr(true)
        setMsg('No active session. Please try signing in again.')
        return
      }
      if (user.id !== id) {
        setErr(true)
        setMsg('The link is for a different account.')
        return
      }

      // Mark as magic-confirmed on first email verification and ensure profile
      if (user?.user_metadata?.magic_confirmed !== true) {
        await supabase.auth.updateUser({ data: { magic_confirmed: true } })
      }
      await ensureProfile(user)
      navigate(next, { replace: true })
    })()
    return () => { mounted = false }
  }, [navigate, id])

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>{err ? 'Sign-in issue' : 'Redirecting…'}</h1>
        <p className="muted">{msg}</p>
        {err && (
          <p style={{ marginTop: 12 }}>
            <a href="/login">Back to login</a>
          </p>
        )}
      </div>
    </div>
  )
}
