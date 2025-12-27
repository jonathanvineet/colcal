const glassStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
}

export default function SelfNotesCard({ notes, setNotes }) {
  return (
    <div style={{ 
      ...glassStyle,
      gridColumn: 'span 4',
      gridRow: '2',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column'
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
          flex: 1,
          width: '100%',
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
          transition: 'all 0.3s',
          boxSizing: 'border-box'
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
  )
}
