import { useState } from 'react'
import { useAuth } from '../auth/context'
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react'
import Calendar from '../components/Calendar'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function Home() {
  const { user } = useAuth()
  const [showAuthMenu, setShowAuthMenu] = useState(false)
  const [notes, setNotes] = useState('')
  
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.toLocaleString('default', { month: 'long' })
  const currentYear = today.getFullYear()

  const teams = [
    { name: 'Design Squad', color: '#3b82f6' },
    { name: 'Dev Ops', color: '#a855f7' },
    { name: 'Marketing', color: '#22c55e' },
    { name: 'Sales Team', color: '#f97316' }
  ]

  const todaysWork = [
    { time: '09:00 AM', task: 'Strategy Meeting' },
    { time: '11:30 AM', task: 'UI Design Review' },
    { time: '02:00 PM', task: 'Client Sync' },
    { time: '04:30 PM', task: 'Code Review' }
  ]

  // Generate calendar days for current month
  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const calendarDays = getDaysInMonth(currentYear, today.getMonth())

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      fontFamily: "'Inter', 'Montserrat', sans-serif"
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '24px', 
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(90deg, #646cff, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Colcal
        </h1>
        
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
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              style={{
                background: 'linear-gradient(135deg, #646cff, #a855f7)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(100, 108, 255, 0.4)'
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
                ...glassStyle,
                padding: '12px',
                minWidth: '160px',
                zIndex: 1001
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SignInButton mode="modal">
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Sign In
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button style={{
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #646cff, #a855f7)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
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
      {user ? (
        <div style={{ 
          marginTop: '80px',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: '20px',
          maxWidth: '1600px',
          margin: '80px auto 0'
        }}>
          {/* Your Teams Card - Top Left */}
          <div style={{ 
            ...glassStyle,
            gridColumn: 'span 3',
            gridRow: '1',
            padding: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Your Teams
              </h2>
              <button style={{
                background: 'rgba(100, 108, 255, 0.2)',
                border: '1px solid #646cff',
                color: '#646cff',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 108, 255, 0.3)'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(100, 108, 255, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(100, 108, 255, 0.2)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                +
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {teams.map((team, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = team.color
                  e.currentTarget.style.boxShadow = `0 0 20px ${team.color}40`
                  e.currentTarget.style.transform = 'translateX(5px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: team.color,
                    boxShadow: `0 0 12px ${team.color}`,
                    flexShrink: 0
                  }} />
                  <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>
                    {team.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Date Card - Top Middle */}
          <div style={{ 
            ...glassStyle,
            gridColumn: 'span 4',
            gridRow: '1',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid rgba(100, 108, 255, 0.6)',
            boxShadow: '0 0 40px rgba(100, 108, 255, 0.4)',
            background: 'rgba(100, 108, 255, 0.05)'
          }}>
            <div style={{ 
              fontSize: '96px', 
              fontWeight: '800', 
              color: 'white',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(100, 108, 255, 0.6)'
            }}>
              {currentDay}
            </div>
            <div style={{ 
              fontSize: '28px', 
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '16px',
              fontWeight: '500',
              letterSpacing: '1px'
            }}>
              {currentMonth}
            </div>
          </div>

          {/* Calendar Card - Extreme Right (spans both rows) */}
          <div style={{ 
            ...glassStyle,
            gridColumn: 'span 5',
            gridRow: 'span 2',
            padding: '36px'
          }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '32px', 
              fontWeight: '700', 
              marginBottom: '32px',
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>
              {currentMonth} {currentYear}
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '14px'
            }}>
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ 
                  textAlign: 'center', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '10px',
                  letterSpacing: '1px'
                }}>
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, idx) => (
                <div key={idx} style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: day === currentDay 
                    ? 'rgba(100, 108, 255, 0.25)' 
                    : 'rgba(255, 255, 255, 0.04)',
                  border: day === currentDay 
                    ? '3px solid #646cff' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  cursor: day ? 'pointer' : 'default',
                  transition: 'all 0.3s',
                  position: 'relative',
                  boxShadow: day === currentDay 
                    ? '0 0 30px rgba(100, 108, 255, 0.5), inset 0 0 20px rgba(100, 108, 255, 0.2)' 
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (day) {
                    e.currentTarget.style.background = day === currentDay 
                      ? 'rgba(100, 108, 255, 0.3)' 
                      : 'rgba(100, 108, 255, 0.15)'
                    e.currentTarget.style.transform = 'scale(1.08)'
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(100, 108, 255, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (day) {
                    e.currentTarget.style.background = day === currentDay 
                      ? 'rgba(100, 108, 255, 0.25)' 
                      : 'rgba(255, 255, 255, 0.04)'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = day === currentDay 
                      ? '0 0 30px rgba(100, 108, 255, 0.5), inset 0 0 20px rgba(100, 108, 255, 0.2)' 
                      : 'none'
                  }
                }}
                >
                  {day && (
                    <>
                      <span style={{ 
                        color: 'white', 
                        fontSize: '18px',
                        fontWeight: day === currentDay ? '800' : '600'
                      }}>
                        {day}
                      </span>
                      {/* Colored dots for scheduled tasks */}
                      {day % 3 === 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '4px', 
                          marginTop: '6px',
                          position: 'absolute',
                          bottom: '10px'
                        }}>
                          <div style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: '#3b82f6',
                            boxShadow: '0 0 8px #3b82f6'
                          }} />
                          <div style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: '#22c55e',
                            boxShadow: '0 0 8px #22c55e'
                          }} />
                          {day % 2 === 0 && (
                            <div style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              backgroundColor: '#f97316',
                              boxShadow: '0 0 8px #f97316'
                            }} />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Work Card - Bottom Left */}
          <div style={{ 
            ...glassStyle,
            gridColumn: 'span 3',
            gridRow: '2',
            padding: '24px'
          }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '24px' 
            }}>
              Today's Work
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {todaysWork.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '16px 12px',
                  background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #646cff',
                  marginBottom: '8px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 108, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateX(5px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
                >
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '14px',
                    minWidth: '80px',
                    fontWeight: '600',
                    fontFamily: 'monospace'
                  }}>
                    {item.time}
                  </span>
                  <span style={{ 
                    color: 'white', 
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Self Notes Card - Bottom Middle */}
          <div style={{ 
            ...glassStyle,
            gridColumn: 'span 4',
            gridRow: '2',
            padding: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Self Notes
              </h2>
              <span style={{ 
                fontSize: '24px', 
                cursor: 'pointer',
                filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2) rotate(20deg)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
              >
                📌
              </span>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your notes here..."
              style={{
                width: '100%',
                height: 'calc(100% - 80px)',
                minHeight: '200px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '18px',
                color: 'white',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.8',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(100, 108, 255, 0.4)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(100, 108, 255, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ 
          marginTop: '80px',
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <div style={{ 
            ...glassStyle,
            padding: '60px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '28px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Welcome to Colcal
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '16px',
              marginBottom: '24px'
            }}>
              Please sign in to access your collaborative calendar and manage your teams.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
