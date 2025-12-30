'use client'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function TodaysWorkCard({ todaysWork }) {
  return (
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
  )
}
