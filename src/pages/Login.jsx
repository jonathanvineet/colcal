import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { SignIn } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Access Control</h1>
        <p className="muted">Authenticate to continue</p>
        <div style={{ marginTop: 12 }}>
          <SignIn routing="path" path="/login" appearance={{ baseTheme: dark }} />
        </div>
      </div>
    </div>
  )
}
