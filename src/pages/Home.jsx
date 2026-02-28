'use client'

import { useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'

export default function Home() {
  const { user } = useUser()
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

  return (
    <div className="home-page">
      {/* Header */}
      <div className="header-bar">
        <h1>Colcal</h1>
        {user && <UserButton afterSignOutUrl="/login" />}
      </div>

      {/* Main Container */}
      <div className="home-container">
        {/* Welcome Section */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Welcome, {user?.firstName || 'User'}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Today is {currentMonth} {currentDay}, {currentYear}
          </p>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Teams Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Teams
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teams.map((team, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: team.color,
                    }}
                  />
                  <span>{team.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Work Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Work
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todaysWork.map((item, idx) => (
                <div key={idx} style={{ borderLeft: '2px solid var(--line-600)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-500)' }}>{item.time}</div>
                  <div style={{ marginTop: 4 }}>{item.task}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              style={{
                width: '100%',
                minHeight: 150,
                padding: 12,
                border: '1px solid var(--line-600)',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--fg-100)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
