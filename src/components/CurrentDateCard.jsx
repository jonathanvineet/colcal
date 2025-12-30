'use client'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function CurrentDateCard({ currentDay, currentMonth }) {
  return (
    <div style={{ 
      ...glassStyle,
      gridColumn: 'span 3',
      padding: '32px',
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
  )
}
