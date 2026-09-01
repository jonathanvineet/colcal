'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Users, Check } from 'lucide-react'

export default function TeamMembersCard({
  teams,
  activeTeam,
  membersByTeam,
  onAddMember,
  onRemoveMember,
  selectedAssignees,
  onToggleAssignee,
  isAdmin,
}) {
  const [openMenuUserId, setOpenMenuUserId] = useState(null)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuUserId(null)
      }
    }
    if (openMenuUserId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuUserId])

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
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Team Members
        </h3>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          Click a name to select assignees.{isAdmin && ' Click the icon to assign teams.'}
        </p>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="muted" style={{ fontSize: 12 }}>
          {activeTeam ? `No members assigned to ${activeTeam}.` : 'No members found in this organization.'}
        </p>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '380px',
          overflowY: 'auto',
          paddingRight: filteredUsers.length > 3 ? '4px' : '0'
        }}>
          {filteredUsers.map(user => {
            const assignedTeams = memberTeamMap[user.name] || new Set()
            const isSelected = selectedAssignees.has(user.name)
            const isMenuOpen = openMenuUserId === user.id
            const assignedCount = assignedTeams.size

            return (
              <div key={user.id} style={{
                position: 'relative',
                border: isSelected
                  ? '1px solid #e2b340'
                  : '1px solid var(--line-600)',
                borderRadius: '10px',
                padding: '12px',
                background: isSelected
                  ? 'rgba(226, 179, 64, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 12px rgba(226, 179, 64, 0.15)' : 'none',
              }}>
                {/* Main Member Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  {/* Left: Name and selection indicator */}
                  <div
                    onClick={() => isAdmin && onToggleAssignee(user.name)}
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: isSelected ? '#e2b340' : 'var(--fg-100)',
                      cursor: isAdmin ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      userSelect: 'none',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isSelected ? '#e2b340' : 'var(--line-600)',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                      boxShadow: isSelected ? '0 0 6px #e2b340' : 'none',
                    }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </span>
                    {isSelected && (
                      <span style={{
                        fontSize: 10,
                        color: '#e2b340',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        fontWeight: 400,
                        flexShrink: 0,
                      }}>
                        Assigned
                      </span>
                    )}
                  </div>

                  {/* Right: Icon-only Team Assignment Button */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuUserId(isMenuOpen ? null : user.id)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                        borderRadius: '8px',
                        border: isMenuOpen
                          ? '1px solid rgba(255, 255, 255, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        background: isMenuOpen
                          ? 'rgba(255, 255, 255, 0.22)'
                          : 'rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isMenuOpen) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMenuOpen) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                        }
                      }}
                      title="Assign teams"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: 'block', pointerEvents: 'none' }}
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </button>

                    {/* Side Popover with Scrollbar */}
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: 'calc(100% + 8px)',
                          width: '190px',
                          padding: '10px',
                          borderRadius: '10px',
                          background: '#161718',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          maxHeight: '170px',
                          overflowY: 'auto',
                          zIndex: 9999,
                        }}
                      >
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--fg-300)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 4px',
                          fontWeight: 600,
                        }}>
                          Assign Teams:
                        </div>

                        {teams.length === 0 ? (
                          <p className="muted" style={{ fontSize: '11px', margin: '4px', padding: '0 4px' }}>
                            No teams created yet.
                          </p>
                        ) : (
                          teams.map(team => {
                            const isAssigned = assignedTeams.has(team.name)
                            return (
                              <div
                                key={team.name}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleTeam(user.name, team.name, isAssigned)
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: isAssigned ? `${team.color}25` : 'rgba(255, 255, 255, 0.03)',
                                  border: isAssigned ? `1px solid ${team.color}70` : '1px solid rgba(255, 255, 255, 0.06)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  userSelect: 'none',
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  if (!isAssigned) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                                }}
                                onMouseLeave={(e) => {
                                  if (!isAssigned) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: team.color,
                                    boxShadow: `0 0 6px ${team.color}`,
                                    flexShrink: 0,
                                  }} />
                                  <span style={{
                                    fontSize: '11px',
                                    color: isAssigned ? '#fff' : 'var(--fg-300)',
                                    fontWeight: isAssigned ? 600 : 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {team.name}
                                  </span>
                                </div>

                                <div style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: isAssigned ? `1px solid ${team.color}` : '1px solid var(--line-600)',
                                  backgroundColor: isAssigned ? team.color : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {isAssigned && (
                                    <svg
                                      width="11"
                                      height="11"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#000000"
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned teams summary chips */}
                {assignedCount > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {Array.from(assignedTeams).map(teamName => {
                      const teamColor = teams.find(t => t.name === teamName)?.color || '#646cff'
                      return (
                        <span
                          key={teamName}
                          style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: `${teamColor}18`,
                            border: `1px solid ${teamColor}40`,
                            color: 'var(--fg-100)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: teamColor }} />
                          {teamName}
                        </span>
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
