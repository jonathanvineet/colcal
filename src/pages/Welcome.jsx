import { useAuth } from '../auth/context'

export default function Welcome() {
  const { user } = useAuth()
  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Welcome{user?.email ? `, ${user.email}` : ''}!</h1>
        <p className="muted">Your email has been verified. You’re all set.</p>
      </div>
    </div>
  )
}
