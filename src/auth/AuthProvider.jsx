import { useEffect, useMemo, useState } from 'react'
import { ClerkProvider, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { AuthContext } from './context'
import { ensureProfile } from '../lib/profiles'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function InnerAuthProvider({ children }) {
  const clerkAuth = useClerkAuth()
  const { isLoaded } = clerkAuth
  const { user: clerkUser, isSignedIn } = useUser()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(!isLoaded)
  }, [isLoaded])

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      const mapped = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
      }
      setUser(mapped)
      ensureProfile(mapped).catch(() => {})
    } else {
      setUser(null)
    }
  }, [isSignedIn, clerkUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      signOut: () => clerkAuth.signOut(),
    }),
    [user, loading, clerkAuth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }) {
  if (!publishableKey) {
    console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY')
  }
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={{ baseTheme: dark }}>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </ClerkProvider>
  )
}
