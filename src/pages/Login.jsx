'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function Login() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) router.replace('/')
  }, [user, isLoaded, router])

  if (!isLoaded) return <div>Loading...</div>

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
