/**
 * Client-side data access layer.
 * All functions call Next.js API routes which use the Clerk session for auth
 * and the Supabase service-role key server-side.
 *
 * Data transformation:
 *   teams    → [{ name, color }]
 *   members  → { General: [...], TeamName: [...] }
 *   tasks    → { [dateKey]: [{ id, time, task, team }] }
 *   notes    → { [dateKey]: [{ id, text, savedAt, authorName, team }] }
 *   events   → [{ id, title, start, end, allDay }]  (FullCalendar format)
 */

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  
  // Try to explicitly get the Clerk session token.
  // This bypasses issues where browsers block third-party cookies on Vercel.
  if (typeof window !== 'undefined' && window.Clerk && window.Clerk.session) {
    try {
      const token = await window.Clerk.session.getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    } catch (e) {
      console.warn('Failed to get Clerk token:', e)
    }
  }

  const res = await fetch(path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || `API error ${res.status}`)
  }
  return json
}

// ─── Teams ────────────────────────────────────────────────────────────────

/**
 * Returns [{ name, color }] ordered by position.
 */
export async function fetchTeams() {
  const { data } = await apiFetch('/api/db/teams')
  return (data || []).map((row) => ({ name: row.name, color: row.color }))
}

export async function saveTeam(team, position = 0) {
  await apiFetch('/api/db/teams', {
    method: 'POST',
    body: JSON.stringify({ name: team.name, color: team.color, position }),
  })
}

export async function deleteTeam(teamName) {
  await apiFetch(`/api/db/teams?name=${encodeURIComponent(teamName)}`, {
    method: 'DELETE',
  })
}

// ─── Team Members ─────────────────────────────────────────────────────────

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
    `/api/db/members?teamName=${encodeURIComponent(teamName)}&memberId=${encodeURIComponent(memberId)}`,
    { method: 'DELETE' }
  )
}

// ─── Tasks ────────────────────────────────────────────────────────────────

/**
 * Returns { [dateKey]: [{ id, time, task, team }] }.
 */
export async function fetchMyProfile() {
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
    const { data } = await apiFetch(`/api/db/profile?ids=${encodeURIComponent(ids.join(','))}`)
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

export async function fetchTasks() {
  const { data } = await apiFetch('/api/db/tasks')
  const tasksByDate = {}
  for (const row of data || []) {
    if (!tasksByDate[row.date_key]) {
      tasksByDate[row.date_key] = []
    }
    tasksByDate[row.date_key].push({
      id: row.id,
      time: row.time,
      task: row.task,
      team: row.team,
      completed: row.completed || false,
      assignee: row.assignee || null,
    })
  }
  return tasksByDate
}

/**
 * Saves a task to the DB and returns the saved task (with DB-generated id).
 */
export async function saveTask(dateKey, task) {
  const { data } = await apiFetch('/api/db/tasks', {
    method: 'POST',
    body: JSON.stringify({
      dateKey,
      time: task.time,
      task: task.task,
      team: task.team,
      completed: task.completed || false,
      assignee: task.assignee || null,
    }),
  })
  return { id: data.id, time: data.time, task: data.task, team: data.team, completed: data.completed, assignee: data.assignee }
}

export async function updateTask(taskId, updates) {
  const { data } = await apiFetch('/api/db/tasks', {
    method: 'PUT',
    body: JSON.stringify({
      id: taskId,
      ...updates,
    }),
  })
  return data
}

export async function deleteTask(taskId) {
  await apiFetch(`/api/db/tasks?id=${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  })
}

// ─── Notes ────────────────────────────────────────────────────────────────

/**
 * Returns { [dateKey]: [{ id, text, savedAt, authorName, team }] }.
 */
export async function fetchNotes() {
  const { data } = await apiFetch('/api/db/notes')
  const notesByDate = {}
  for (const row of data || []) {
    if (!notesByDate[row.date_key]) {
      notesByDate[row.date_key] = []
    }
    notesByDate[row.date_key].push({
      id: row.id,
      text: row.text,
      savedAt: row.saved_at,
      authorName: row.author_name,
      team: row.team,
    })
  }
  return notesByDate
}

export async function saveNote(dateKey, note) {
  await apiFetch('/api/db/notes', {
    method: 'POST',
    body: JSON.stringify({
      id: note.id,
      dateKey,
      text: note.text,
      authorName: note.authorName,
      team: note.team,
      savedAt: note.savedAt,
    }),
  })
}

export async function deleteNote(noteId) {
  await apiFetch(`/api/db/notes?id=${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
  })
}

// ─── Calendar Events ──────────────────────────────────────────────────────

/**
 * Returns [{ id, title, start, end, allDay }] — FullCalendar format.
 */
export async function fetchCalendarEvents() {
  const { data } = await apiFetch('/api/db/events')
  return data || []
}

export async function saveCalendarEvent(event) {
  await apiFetch('/api/db/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export async function updateCalendarEvent(event) {
  await apiFetch('/api/db/events', {
    method: 'PUT',
    body: JSON.stringify(event),
  })
}

export async function deleteCalendarEvent(eventId) {
  await apiFetch(`/api/db/events?id=${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  })
}
