'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import NotesExplorerPage from '../../src/pages/NotesExplorerPage'

export default function NotesPage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
          color: 'white'
        }}
      >
        Loading...
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return <NotesExplorerPage />
}
