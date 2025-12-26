import { useState } from 'react'
import { useAuth } from '../auth/context'
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import Calendar from '../components/Calendar'

export default function Home() {
  const { user, signOut } = useAuth()
  const [showAuthMenu, setShowAuthMenu] = useState(false)

  return (
    <div className="home">
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {user ? (
          <UserButton 
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10"
              }
            }}
          />
        ) : (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn"
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              style={{
                backgroundColor: '#646cff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Account
            </button>
            
            {showAuthMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '150px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 1001
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SignInButton mode="modal">
                    <button 
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button 
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#646cff',
                        border: 'none',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="card" style={{ marginTop: '80px' }}>
        <h1>Hello {user?.email || 'Guest'}</h1>
        <p className="muted">Your calendar is below. Drag, resize, and switch views.</p>
        {user && (
          <Calendar userId={user?.id} />
        )}
        {!user && (
          <p style={{ marginTop: '20px', color: '#888' }}>
            Please sign in to access your calendar.
          </p>
        )}
      </div>
    </div>
  )
}
