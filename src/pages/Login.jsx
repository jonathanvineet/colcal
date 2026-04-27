import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auth/context'
import { SignIn } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

export default function Login() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

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
