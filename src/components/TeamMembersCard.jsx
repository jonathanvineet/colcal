
'use client'

import { useMemo, useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { fetchProfiles } from '../lib/db'

export default function TeamMembersCard({
  teams,
  activeTeam,
  membersByTeam,
  onAddMember,
  onRemoveMember,
}) {
  const { organization, memberships, isLoaded } = useOrganization({
    memberships: {
      pageSize: 100, // Fetch up to 100 members initially
    }
  })
  
  const [profiles, setProfiles] = useState({})
  const [showAllMembers, setShowAllMembers] = useState(false)

  const selectedGroup = activeTeam || 'General'
  const allTeams = ['General', ...teams.map(t => t.name)]

  // Extract all org user IDs
  const orgUsers = useMemo(() => {
    if (!memberships?.data) return []
    return memberships.data.map(m => m.publicUserData)
  }, [memberships?.data])

  // Fetch custom profiles for org users
  useEffect(() => {
    async function loadProfiles() {
      const ids = orgUsers.map(u => u.userId)
      if (ids.length === 0) return
      try {
        const fetched = await fetchProfiles(ids)
        const profileMap = {}
        fetched.forEach(p => {
          profileMap[p.user_id] = p.display_name
        })
        setProfiles(profileMap)
      } catch (error) {
        console.error('Error fetching profiles:', error)
      }
    }
    loadProfiles()
  }, [orgUsers])

  // Calculate memberships: { [userId]: Set([team1, team2]) }
  const userMemberships = useMemo(() => {
    const map = {}
    Object.entries(membersByTeam).forEach(([teamName, memberIds]) => {
      memberIds.forEach(id => {
        if (!map[id]) map[id] = new Set()
        map[id].add(teamName)
      })
    })
    return map
  }, [membersByTeam])

  async function handleToggleTeam(userId, teamName, isMember) {
    if (isMember) {
      await onRemoveMember(teamName, userId)
    } else {
      await onAddMember(teamName, userId)
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

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Team Members
        </h3>
        <p className="muted" style={{ margin: 0 }}>
          Manage your organization roster and team assignments.
        </p>
      </div>

      {orgUsers.length === 0 ? (
        <p className="muted">No members found in this organization.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orgUsers.map(user => {
            const displayName = profiles[user.userId] || user.firstName || user.identifier || 'Unknown'
            const userTeams = userMemberships[user.userId] || new Set()

            return (
              <div key={user.userId} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{displayName}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {allTeams.map(teamName => {
                    const isMember = userTeams.has(teamName)
                    return (
                      <button
                        key={teamName}
                        onClick={() => handleToggleTeam(user.userId, teamName, isMember)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          borderRadius: '4px',
                          border: isMember ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                          background: isMember ? 'var(--accent-color)' : 'transparent',
                          color: isMember ? '#fff' : 'inherit',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {teamName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

