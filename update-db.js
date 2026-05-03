const fs = require('fs');
let code = fs.readFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/lib/db.js', 'utf8');

code = code.replace(
\// --- Team Members ------------------------------------------------------------

/**
 * Returns { [teamName]: [memberName, ...] } keyed by team name.
 */
export async function fetchMembers() {
  const { data } = await apiFetch('/api/db/members')
  const membersByTeam = {}
  for (const row of data || []) {
    if (!membersByTeam[row.team_name]) {
      membersByTeam[row.team_name] = []
    }
    membersByTeam[row.team_name].push(row.member_name)
  }
  return membersByTeam
}

export async function saveMember(teamName, memberName) {
  await apiFetch('/api/db/members', {
    method: 'POST',
    body: JSON.stringify({ teamName, memberName }),
  })
}

export async function deleteMember(teamName, memberName) {
  await apiFetch(
    \/api/db/members?teamName=\&memberName=\\,
    { method: 'DELETE' }
  )
}\,
\// --- Team Members ------------------------------------------------------------

/**
 * Returns { [teamName]: [memberId, ...] } keyed by team name.
 */
export async function fetchMembers() {
  const { data } = await apiFetch('/api/db/members')
  const membersByTeam = {}
  for (const row of data || []) {
    if (!membersByTeam[row.team_name]) {
      membersByTeam[row.team_name] = []
    }
    if (row.member_id) {
      membersByTeam[row.team_name].push(row.member_id)
    } else if (row.member_name) {
      membersByTeam[row.team_name].push(row.member_name)
    }
  }
  return membersByTeam
}

export async function saveMember(teamName, memberId) {
  await apiFetch('/api/db/members', {
    method: 'POST',
    body: JSON.stringify({ teamName, memberId }),
  })
}

export async function deleteMember(teamName, memberId) {
  await apiFetch(
    \/api/db/members?teamName=\&memberId=\\,
    { method: 'DELETE' }
  )
}

// --- User Profiles ---------------------------------------------------------

export async function fetchMyProfile() {
  const { data } = await apiFetch('/api/db/profile')
  return data
}

export async function fetchProfiles(ids) {
  if (!ids || ids.length === 0) return []
  const { data } = await apiFetch(\/api/db/profile?ids=\\)
  return data || []
}

export async function saveProfile(displayName) {
  await apiFetch('/api/db/profile', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
}\
);

fs.writeFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/lib/db.js', code);
