'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignIn } from '@clerk/nextjs'
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
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h1>Access Control</h1>
        <p className="muted">Authenticate to continue</p>
        <div style={{ marginTop: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <SignIn
            appearance={{
              baseTheme: dark,
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'bg-transparent shadow-none border-0 w-full max-w-sm',
                headerTitle: 'text-2xl font-bold text-white text-center',
                headerSubtitle: 'text-sm text-gray-400 text-center',
                socialButtonsBlockButton: 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 w-full',
                formButtonPrimary: 'bg-neutral-700 border border-neutral-600 hover:bg-neutral-600 w-full',
                formFieldInput: 'bg-neutral-900 border border-neutral-700 text-white w-full',
                formFieldLabel: 'text-neutral-300',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
              },
            }}
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  )
}
