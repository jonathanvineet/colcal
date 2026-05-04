'use client'

import { useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'

export default function TeamMembersCard({
  teams,
  activeTeam,
  membersByTeam,
  onAddMember,
  onRemoveMember,
  selectedAssignees,
  onToggleAssignee,
}) {
  const { organization, memberships, isLoaded } = useOrganization({
    memberships: {
      pageSize: 100,
    }
  })

  // Get display names from Clerk org
  const orgUsers = useMemo(() => {
    if (!memberships?.data) return []
    return memberships.data.map(m => {
      const u = m.publicUserData
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.identifier || 'Unknown'
      return { id: u.userId, name }
    })
  }, [memberships?.data])

  // Build a map: { "Rehaan Rafael": Set(["IT", "Research Paper"]) }
  const memberTeamMap = useMemo(() => {
    const map = {}
    Object.entries(membersByTeam).forEach(([teamName, members]) => {
      members.forEach(memberName => {
        if (!map[memberName]) map[memberName] = new Set()
        map[memberName].add(teamName)
      })
    })
    return map
  }, [membersByTeam])

  // Only show user-created teams
  const teamNames = teams.map(t => t.name)

  async function handleToggleTeam(memberName, teamName, currentlyAssigned) {
    if (currentlyAssigned) {
      await onRemoveMember(teamName, memberName)
    } else {
      await onAddMember(teamName, memberName)
    }
  }

  if (!isLoaded) {
    return <div className="card"><p className="muted">Loading organization members...</p></div>
  }

  if (!organization) {
    return (
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Members</h3>
        <p className="muted">Personal workspace: Create an organization to add members.</p>
      </div>
    )
  }

  const filteredUsers = orgUsers.filter(user => {
    if (!activeTeam) return true
    const assigned = memberTeamMap[user.name] || new Set()
    return assigned.has(activeTeam)
  })

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Team Members
        </h3>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          Click a name to select assignees. Click badges to manage teams.
        </p>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="muted" style={{ fontSize: 12 }}>
          {activeTeam ? `No members assigned to ${activeTeam}.` : 'No members found in this organization.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map(user => {
            const assignedTeams = memberTeamMap[user.name] || new Set()
            const isSelected = selectedAssignees.has(user.name)

            return (
              <div key={user.id} style={{
                border: isSelected
                  ? '1px solid #e2b340'
                  : '1px solid var(--line-600)',
                borderRadius: '10px',
                padding: '12px',
                background: isSelected
                  ? 'rgba(226, 179, 64, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 12px rgba(226, 179, 64, 0.15)' : 'none',
              }}>
                {/* Name row — clickable to toggle assignee selection */}
                <div
                  onClick={() => onToggleAssignee(user.name)}
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: teamNames.length > 0 ? '8px' : 0,
                    color: isSelected ? '#e2b340' : 'var(--fg-100)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    userSelect: 'none',
                  }}
                >
                  {/* Selection indicator */}
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isSelected ? '#e2b340' : 'var(--line-600)',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                    boxShadow: isSelected ? '0 0 6px #e2b340' : 'none',
                  }} />
                  {user.name}
                  {isSelected && (
                    <span style={{
                      fontSize: 10,
                      color: '#e2b340',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: 400,
                    }}>
                      Assigned
                    </span>
                  )}
                  {!isSelected && assignedTeams.size === 0 && (
                    <span style={{
                      fontSize: 11,
                      color: 'var(--fg-500)',
                      fontWeight: 400,
                    }}>
                      No teams
                    </span>
                  )}
                </div>
                {/* Team badges */}
                {teamNames.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {teamNames.map(teamName => {
                      const isAssigned = assignedTeams.has(teamName)
                      const teamColor = teams.find(t => t.name === teamName)?.color || '#646cff'
                      return (
                        <button
                          key={teamName}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleTeam(user.name, teamName, isAssigned)
                          }}
                          style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            borderRadius: '999px',
                            border: isAssigned
                              ? `1px solid ${teamColor}`
                              : '1px solid var(--line-600)',
                            background: isAssigned
                              ? `${teamColor}25`
                              : 'transparent',
                            color: isAssigned ? 'var(--fg-100)' : 'var(--fg-500)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {isAssigned ? '✓ ' : ''}{teamName}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
