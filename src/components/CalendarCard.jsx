'use client'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function CalendarCard({ currentMonth, currentYear, currentDay, calendarDays }) {
  return (
    <div style={{ 
      ...glassStyle,
      gridColumn: 'span 6',
      gridRow: 'span 2',
      padding: '24px'
    }}>
      <h2 style={{ 
        color: 'white', 
        fontSize: '42px', 
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
        gap: '12px'
      }}>
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '16px',
            fontWeight: '700',
            padding: '8px',
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
              : 'none',
            overflow: 'hidden'
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
                  fontSize: '24px',
                  fontWeight: day === currentDay ? '800' : '600'
                }}>
                  {day}
                </span>
                
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
