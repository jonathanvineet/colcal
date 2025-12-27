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
  )
}
