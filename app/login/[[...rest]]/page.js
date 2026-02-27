'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function LoginPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/')
    }
  }, [isSignedIn, isLoaded, router])

  if (!isLoaded) {
    return null // or loading spinner
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>Access Control</h1>
        <p className="muted">Authenticate to continue</p>
        <div style={{ marginTop: 12 }}>
          <SignIn appearance={{ baseTheme: dark }} />
        </div>
      </div>
    </div>
  )
}
