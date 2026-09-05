'use client'

import { useState } from 'react'

export default function YourTeamsCard({
  teams,
  activeTeam,
  setActiveTeam,
  onAddTeam,
  onRemoveTeam,
  isAdmin,
}) {
  const [teamName, setTeamName] = useState('')
  const [teamColor, setTeamColor] = useState('#3b82f6')

  async function handleAddTeam(event) {
    event.preventDefault()
    const trimmedName = teamName.trim()
    if (!trimmedName) return

    const alreadyExists = teams.some(
      (team) => team.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (alreadyExists) return

    setTeamName('')
    await onAddTeam(trimmedName, teamColor)
  }

  async function handleRemoveTeam(teamName) {
    await onRemoveTeam(teamName)
  }

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Teams
      </h3>
      {isAdmin && (
        <form onSubmit={handleAddTeam} className="inline-add-form" style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Add a team"
            className="inline-add-input"
          />
          <input
            type="color"
            value={teamColor}
            onChange={(e) => setTeamColor(e.target.value)}
            title="Select team color"
            style={{
              width: 42,
              height: 40,
              border: '1px solid var(--line-600)',
              borderRadius: 8,
              padding: 2,
              background: 'transparent',
              cursor: 'pointer'
            }}
          />
          <button
            type="submit"
            className="inline-add-button"
          >
            Add
          </button>
        </form>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: '215px',
        overflowY: 'auto',
        paddingRight: teams.length > 3 ? '6px' : '0',
      }}>
        {teams.length === 0 ? (
          <p className="muted" style={{ fontSize: 13, margin: '8px 0' }}>
            No teams created yet.
          </p>
        ) : (
          teams.map((team, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              border: activeTeam === team.name
                ? `1px solid ${team.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: activeTeam === team.name ? `0 0 12px ${team.color}35` : 'none'
            }}
            onClick={() => setActiveTeam(activeTeam === team.name ? null : team.name)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = team.color
              e.currentTarget.style.boxShadow = `0 0 16px ${team.color}30`
              e.currentTarget.style.transform = 'translateX(3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = activeTeam === team.name ? team.color : 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = activeTeam === team.name ? `0 0 12px ${team.color}35` : 'none'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: team.color,
                  boxShadow: `0 0 10px ${team.color}`,
                  flexShrink: 0
                }} />
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team.name}
                </span>
                {activeTeam === team.name && (
                  <span style={{ fontSize: 10, color: 'var(--fg-500)', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>
                    Active
                  </span>
                )}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRemoveTeam(team.name)
                  }}
                  aria-label={`Remove ${team.name}`}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--fg-300)',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    fontSize: 14,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                    e.currentTarget.style.color = 'var(--fg-300)'
                  }}
                  title="Remove team"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
