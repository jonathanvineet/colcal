'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Calendar from '../components/Calendar'
import YourTeamsCard from '../components/YourTeamsCard'
import CurrentDateCard from '../components/CurrentDateCard'
import CalendarCard from '../components/CalendarCard'
import TodaysWorkCard from '../components/TodaysWorkCard'
import SelfNotesCard from '../components/SelfNotesCard'
import DotGrid from '../components/background'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

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
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Inter', 'Montserrat', sans-serif"
    }}>
      {/* Animated Dot Grid Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)'
      }}>
        <DotGrid 
          dotSize={4}
          gap={24}
          baseColor="#1a1a1a"
          activeColor="#646cff"
          proximity={120}
          speedTrigger={80}
          shockRadius={200}
          shockStrength={6}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
        
        <UserButton 
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              avatarBox: "w-10 h-10"
            }
          }}
        />
      </div>

      {/* Main Content Container */}
      <div style={{
        marginTop: '100px',
        marginBottom: '40px',
        padding: '32px',
        maxWidth: '1400px',
        width: '100%',
        backgroundColor: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Main Content Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'minmax(400px, auto) minmax(400px, auto)',
          gap: '32px',
          width: '100%'
        }}>
          {/* Your Teams Card - Top Left */}
          <YourTeamsCard teams={teams} />

          {/* Current Date Card - Top Middle */}
          <CurrentDateCard currentDay={currentDay} currentMonth={currentMonth} />

          {/* Calendar Card - Extreme Right (spans both rows) */}
          <CalendarCard 
            currentMonth={currentMonth} 
            currentYear={currentYear}
            currentDay={currentDay}
            calendarDays={calendarDays}
          />

          {/* Today's Work Card - Bottom Left */}
          <TodaysWorkCard todaysWork={todaysWork} />

          {/* Self Notes Card - Bottom Middle */}
          <SelfNotesCard notes={notes} setNotes={setNotes} />
        </div>
      </div>
    </div>
  )
}
