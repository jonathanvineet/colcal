'use client'

import { useState } from 'react'

export default function YourTeamsCard({
  teams,
  activeTeam,
  setActiveTeam,
  onAddTeam,
  onRemoveTeam,
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {teams.map((team, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            border: activeTeam === team.name
              ? `1px solid ${team.color}`
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: activeTeam === team.name ? `0 0 0 1px ${team.color}40` : 'none'
          }}
          onClick={() => setActiveTeam(activeTeam === team.name ? null : team.name)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: team.color,
                boxShadow: `0 0 12px ${team.color}`,
                flexShrink: 0
              }} />
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
                {team.name}
              </span>
              {activeTeam === team.name && (
                <span style={{ fontSize: 11, color: 'var(--fg-500)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Active
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleRemoveTeam(team.name)
              }}
              aria-label={`Remove ${team.name}`}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--fg-100)',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                fontSize: 16
              }}
              title="Remove team"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
