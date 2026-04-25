'use client'

import { useMemo, useState } from 'react'

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function sanitizeMembers(list) {
  if (!Array.isArray(list)) {
    return []
  }

  const seen = new Set()
  const next = []

  list.forEach((item) => {
    if (typeof item !== 'string') {
      return
    }

    const cleaned = normalizeName(item)
    if (!cleaned) {
      return
    }

    const dedupeKey = cleaned.toLowerCase()
    if (seen.has(dedupeKey)) {
      return
    }

    seen.add(dedupeKey)
    next.push(cleaned)
  })

  return next
}

export default function TeamMembersCard({
  teams,
  activeTeam,
  membersByTeam,
  onAddMember,
  onRemoveMember,
}) {
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [memberName, setMemberName] = useState('')

  const selectedGroup = activeTeam || 'General'

  const allMembers = useMemo(() => {
    const output = []

    sanitizeMembers(membersByTeam.General).forEach((name) => {
      output.push({ name, team: 'General' })
    })

    teams.forEach((team) => {
      sanitizeMembers(membersByTeam[team.name]).forEach((name) => {
        output.push({ name, team: team.name })
      })
    })

    return output
  }, [membersByTeam, teams])

  const membersForSelectedGroup = useMemo(() => {
    return sanitizeMembers(membersByTeam[selectedGroup])
  }, [membersByTeam, selectedGroup])

  async function handleAddMember(event) {
    event.preventDefault()

    const cleaned = normalizeName(memberName)
    const targetGroup = selectedGroup

    if (!cleaned) return

    setMemberName('')
    await onAddMember(targetGroup, cleaned)
  }

  async function handleRemoveMember(teamName, memberNameToRemove) {
    await onRemoveMember(teamName, memberNameToRemove)
  }

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Team Members
      </h3>
      <p className="muted" style={{ margin: '0 0 16px 0' }}>
        {showAllMembers
          ? 'Showing all members. Toggle to return to your active team.'
          : `Synced with ${selectedGroup}. Select another team above to switch.`}
      </p>

      <form onSubmit={handleAddMember} className="member-add-form">
        <input
          type="text"
          value={memberName}
          onChange={(event) => setMemberName(event.target.value)}
          placeholder="Add member name"
          aria-label="Member name"
          className="member-add-input"
        />
        <button
          type="button"
          className={`member-view-toggle-btn ${showAllMembers ? 'is-all' : 'is-active'}`}
          onClick={() => setShowAllMembers((current) => !current)}
          aria-label={showAllMembers ? 'Show active team members' : 'Show all members'}
          title={showAllMembers ? 'Show active team members' : 'Show all members'}
        >
          <span className="member-view-toggle-icon" aria-hidden="true" />
        </button>
        <button type="submit" className="member-add-submit">Add</button>
      </form>

      {(showAllMembers ? allMembers.length > 0 : membersForSelectedGroup.length > 0) ? (
        <div className="members-list">
          {showAllMembers
            ? allMembers.map((entry, index) => (
              <div key={`${entry.team}-${entry.name}-${index}`} className="member-item-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{entry.name}</div>
                  <div className="muted small">{entry.team}</div>
                </div>
                <button
                  type="button"
                  className="member-remove-btn"
                  onClick={() => handleRemoveMember(entry.team, entry.name)}
                  aria-label={`Remove ${entry.name} from ${entry.team}`}
                >
                  x
                </button>
              </div>
            ))
            : membersForSelectedGroup.map((name) => (
              <div key={`${selectedGroup}-${name}`} className="member-item-row">
                <span style={{ fontWeight: 600 }}>{name}</span>
                <button
                  type="button"
                  className="member-remove-btn"
                  onClick={() => handleRemoveMember(selectedGroup, name)}
                  aria-label={`Remove ${name}`}
                >
                  x
                </button>
              </div>
            ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          {showAllMembers ? 'No members yet.' : `No members set for ${selectedGroup}.`}
        </p>
      )}
    </div>
  )
}
