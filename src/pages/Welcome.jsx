'use client'

import { useUser } from '@clerk/nextjs'

export default function Welcome() {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <div>Loading...</div>
  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Welcome{user?.primaryEmailAddress?.emailAddress ? `, ${user.primaryEmailAddress.emailAddress}` : ''}!</h1>
        <p className="muted">Your email has been verified. You’re all set.</p>
      </div>
    </div>
  )
}
