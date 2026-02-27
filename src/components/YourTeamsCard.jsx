'use client'

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function YourTeamsCard({ teams }) {
  return (
    <div style={{ 
      ...glassStyle,
      gridColumn: 'span 3',
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
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
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
  )
}
