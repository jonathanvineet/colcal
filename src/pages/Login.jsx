import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'

export default function Login() {
  const navigate = useNavigate()
  const { user, signInWithMagicLink, signInWithProvider } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleMagic = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    const url = new URL(window.location.href)
    const nextPath = url.searchParams.get('next') || '/welcome'
    const { error } = await signInWithMagicLink(email, nextPath)
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('sent')
      setMessage('Check your email for a magic link to sign in.')
    }
  }

  const handleGoogle = async () => {
    setStatus('loading')
    setMessage('')
    const { error } = await signInWithProvider('google')
    if (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Welcome</h1>
        <p className="muted">Sign in to continue</p>

        <div className="oauth-grid">
          <button
            type="button"
            className="btn oauth-btn"
            onClick={handleGoogle}
            disabled={status === 'loading'}
          >
            Continue with Google
          </button>
        </div>

        <div className="divider"><span>or</span></div>

        <form onSubmit={handleMagic} className="magic-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Send magic link'}
          </button>
          {message && (
            <p className={`hint ${status === 'error' ? 'error' : ''}`}>{message}</p>
          )}
        </form>

        <p className="muted small">
          If you sign up with Google and haven’t verified via magic link before, we’ll send you a magic link to complete verification.
        </p>
      </div>
    </div>
  )
}
