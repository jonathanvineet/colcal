const fs = require('fs');
let code = fs.readFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/lib/db.js', 'utf8');

// Replace fetchMembers
code = code.replace(
  /export async function fetchMembers\(\) \{[\s\S]*?return membersByTeam\n\}/,
  `export async function fetchMembers() {
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
}`
);

// Replace saveMember
code = code.replace(
  /export async function saveMember\(teamName, memberName\) \{[\s\S]*?\}\)/,
  `export async function saveMember(teamName, memberId) {
  await apiFetch('/api/db/members', {
    method: 'POST',
    body: JSON.stringify({ teamName, memberId }),
  })`
);

// Replace deleteMember
code = code.replace(
  /export async function deleteMember\(teamName, memberName\) \{[\s\S]*?method: 'DELETE' \}\n  \)/,
  `export async function deleteMember(teamName, memberId) {
  await apiFetch(
    \`/api/db/members?teamName=\${encodeURIComponent(teamName)}&memberId=\${encodeURIComponent(memberId)}\`,
    { method: 'DELETE' }
  )`
);

// Add auth profile functions before fetchTasks
code = code.replace(
  /export async function fetchTasks\(\)/,
  `export async function fetchMyProfile() {
  try {
    const { data } = await apiFetch('/api/db/profile')
    return data
  } catch(e) {
    return null
  }
}

export async function fetchProfiles(ids) {
  if (!ids || ids.length === 0) return []
  try {
    const { data } = await apiFetch(\`/api/db/profile?ids=\${encodeURIComponent(ids.join(','))}\`)
    return data || []
  } catch(e) {
    return []
  }
}

export async function saveProfile(displayName) {
  await apiFetch('/api/db/profile', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
}

export async function fetchTasks()`
);

fs.writeFileSync('C:/Users/Gaming/Pictures/Coding_Projects/colcal/colcal/src/lib/db.js', code);
