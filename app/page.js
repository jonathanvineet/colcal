'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useUser, UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import Link from 'next/link'
import YourTeamsCard from '@/components/YourTeamsCard'
import Calendar from '@/components/Calendar'
import TeamMembersCard from '@/components/TeamMembersCard'
import * as db from '@/lib/db'

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function toOrdinal(day) {
  const mod10 = day % 10
  const mod100 = day % 100
  if (mod10 === 1 && mod100 !== 11) return `${day}st`
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`
  return `${day}th`
}

function formatTimestamp(isoString) {
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time'
  }

  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function Home() {
  const { user, isLoaded } = useUser()

  // ── Data state ────────────────────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  const [notes, setNotes] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [notesByDate, setNotesByDate] = useState({})
  const [noteSaveMessage, setNoteSaveMessage] = useState('')
  const [teams, setTeams] = useState([])
  const [activeTeam, setActiveTeam] = useState(null)
  const [workByDate, setWorkByDate] = useState({})
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskTeam, setNewTaskTeam] = useState('General')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [membersByTeam, setMembersByTeam] = useState({ General: [] })

  // ── Derived values ────────────────────────────────────────────────────
  const currentDay = selectedDate.getDate()
  const currentMonth = selectedDate.toLocaleString('default', { month: 'long' })
  const currentYear = selectedDate.getFullYear()

  const selectedDateKey = useMemo(() => getDateKey(selectedDate), [selectedDate])
  const selectedDateWork = workByDate[selectedDateKey] || []
  const selectedDateNotes = notesByDate[selectedDateKey] || []
  const selectedDateLatestNote = selectedDateNotes[selectedDateNotes.length - 1]?.text || ''
  const visibleDateWork = selectedDateWork.filter((task) => (
    task.team === 'General' || (activeTeam && task.team === activeTeam)
  ))
  const selectedDateSortedNotes = useMemo(() => (
    selectedDateNotes
      .slice()
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  ), [selectedDateNotes])

  // ── Load all data on mount (once user is available) ───────────────────
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function loadAll() {
      setDataLoading(true)
      setDataError(null)

      try {
        const [fetchedTeams, fetchedMembers, fetchedTasks, fetchedNotes] = await Promise.all([
          db.fetchTeams(),
          db.fetchMembers(),
          db.fetchTasks(),
          db.fetchNotes(),
        ])

        if (cancelled) return

        setTeams(fetchedTeams)
        setActiveTeam(fetchedTeams[0]?.name || null)
        setMembersByTeam({ General: [], ...fetchedMembers })

        setWorkByDate(fetchedTasks)
        setNotesByDate(fetchedNotes)
      } catch (err) {
        if (!cancelled) {
          setDataError('Failed to load your data. Please refresh the page.')
          console.error('DB load error:', err)
        }
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    loadAll()
    return () => { cancelled = true }
  }, [user?.id])

  // ── Sync active team & task team input ────────────────────────────────
  useEffect(() => {
    if (activeTeam) {
      setNewTaskTeam(activeTeam)
    } else {
      setNewTaskTeam('General')
    }
    setNewTaskAssignee('') // reset assignee when switching active team
  }, [activeTeam])

  // ── Sync notes textarea when selected date changes ────────────────────
  useEffect(() => {
    setNotes(selectedDateLatestNote)
    setNoteSaveMessage('')
  }, [selectedDateKey, selectedDateLatestNote])

  // ── Team handlers ─────────────────────────────────────────────────────
  const handleAddTeam = useCallback(async (teamName, teamColor) => {
    const newTeam = { name: teamName, color: teamColor }
    setTeams((prev) => {
      const next = [...prev, newTeam]
      // Persist with position = index
      db.saveTeam(newTeam, next.length - 1).catch(console.error)
      return next
    })
    setActiveTeam((current) => current || teamName)
  }, [])

  const handleRemoveTeam = useCallback(async (teamName) => {
    setTeams((prev) => {
      const next = prev.filter((t) => t.name !== teamName)
      setActiveTeam((current) =>
        current === teamName ? (next[0]?.name || null) : current
      )
      // Remove members for this team from local state
      setMembersByTeam((m) => {
        const copy = { ...m }
        delete copy[teamName]
        return copy
      })
      db.deleteTeam(teamName).catch(console.error)
      return next
    })
  }, [])

  // ── Member handlers ───────────────────────────────────────────────────
  const handleAddMember = useCallback(async (teamName, memberName) => {
    setMembersByTeam((prev) => {
      const existing = prev[teamName] || []
      if (existing.some((n) => n.toLowerCase() === memberName.toLowerCase())) {
        return prev
      }
      db.saveMember(teamName, memberName).catch(console.error)
      return { ...prev, [teamName]: [...existing, memberName] }
    })
  }, [])

  const handleRemoveMember = useCallback(async (teamName, memberName) => {
    setMembersByTeam((prev) => {
      const existing = prev[teamName] || []
      db.deleteMember(teamName, memberName).catch(console.error)
      return {
        ...prev,
        [teamName]: existing.filter((n) => n.toLowerCase() !== memberName.toLowerCase())
      }
    })
  }, [])

  // ── Task handlers ─────────────────────────────────────────────────────
  async function handleAddTask(event) {
    event.preventDefault()
    const trimmedTask = newTaskText.trim()
    if (!trimmedTask) return

    const taskPayload = {
      time: newTaskTime || 'Anytime',
      task: trimmedTask,
      team: newTaskTeam,
      assignee: newTaskAssignee || null,
    }

    setNewTaskText('')
    setNewTaskTime('')
    setNewTaskTeam(activeTeam || 'General')
    setNewTaskAssignee('')

    try {
      // Save to DB first so we get the server-generated id
      const saved = await db.saveTask(selectedDateKey, taskPayload)
      setWorkByDate((prev) => ({
        ...prev,
        [selectedDateKey]: [...(prev[selectedDateKey] || []), saved]
      }))
    } catch (err) {
      console.error('Failed to save task:', err)
    }
  }

  const handleToggleTask = useCallback(async (task) => {
    const newCompleted = !task.completed
    
    setWorkByDate((prev) => {
      const copy = { ...prev }
      if (copy[selectedDateKey]) {
        copy[selectedDateKey] = copy[selectedDateKey].map((t) => 
          t.id === task.id ? { ...t, completed: newCompleted } : t
        )
      }
      return copy
    })
    
    try {
      await db.updateTask(task.id, newCompleted)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }, [selectedDateKey])

  const handleDeleteTask = useCallback(async (task) => {
    setWorkByDate((prev) => {
      const copy = { ...prev }
      if (copy[selectedDateKey]) {
        copy[selectedDateKey] = copy[selectedDateKey].filter((t) => t.id !== task.id)
      }
      return copy
    })
    
    try {
      await db.deleteTask(task.id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }, [selectedDateKey])

  // ── Note handlers ─────────────────────────────────────────────────────
  async function handleSaveNote() {
    const trimmedNote = notes.trim()
    if (!trimmedNote) {
      setNoteSaveMessage('Type a note before saving.')
      return
    }

    const authorName = user?.fullName || user?.firstName || user?.username || 'Unknown User'
    const savedAt = new Date().toISOString()
    const noteEntry = {
      id: `${selectedDateKey}-${Date.now()}`,
      text: trimmedNote,
      savedAt,
      authorName,
      team: activeTeam || 'General'
    }

    // Optimistically update UI
    setNotesByDate((prev) => {
      const existing = Array.isArray(prev[selectedDateKey]) ? prev[selectedDateKey] : []
      return { ...prev, [selectedDateKey]: [...existing, noteEntry] }
    })
    setNoteSaveMessage(`Saved by ${authorName} at ${formatTimestamp(savedAt)}.`)

    try {
      await db.saveNote(selectedDateKey, noteEntry)
    } catch (err) {
      console.error('Failed to save note:', err)
      setNoteSaveMessage('Error saving note. Please try again.')
    }
  }

  // ── Loading / error states ────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading...</div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading your workspace…</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Fetching data from the database</div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: 'white',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#f97316' }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{dataError}</div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="header-bar">
        <h1>Colcal</h1>
        {user && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <OrganizationSwitcher hidePersonal={false} />
            <UserButton afterSignOutUrl="/login" />
          </div>
        )}
      </div>

      <div className="home-container">
        <div className="card home-intro-card">
          <div className="home-intro-content">
            <h2 style={{ margin: '0 0 12px 0' }}>Welcome, {user?.firstName || 'User'}</h2>
            <p className="muted" style={{ margin: 0 }}>
              Calendar focus for {currentMonth} {toOrdinal(currentDay)}, {currentYear}
            </p>
          </div>
        </div>

        <div className="calendar-first-grid">
          <aside className="left-rail">
            <YourTeamsCard
              teams={teams}
              activeTeam={activeTeam}
              setActiveTeam={setActiveTeam}
              onAddTeam={handleAddTeam}
              onRemoveTeam={handleRemoveTeam}
            />
            <TeamMembersCard
              teams={teams}
              activeTeam={activeTeam}
              membersByTeam={membersByTeam}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
          </aside>

          <section className="center-calendar-zone">
            <div className="card calendar-feature-card">
              <div className="calendar-feature-head">
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Team Calendar
                </h3>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                  Selected date: {currentMonth} {toOrdinal(currentDay)}, {currentYear}
                </p>
              </div>
              <Calendar
                userId={user?.id}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </section>

          <aside className="right-rail">
            <div className="card">
              <div className="notes-card-head" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {currentMonth} {toOrdinal(currentDay)}'s Work
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/tasks" className="notes-explorer-link">Tasks</Link>
                  <Link href="/reports/member" className="notes-explorer-link" style={{ background: 'var(--brand)' }}>Reports</Link>
                </div>
              </div>
              <p className="muted" style={{ margin: '0 0 16px 0' }}>
                Active team: {activeTeam || 'None'} (General tasks are always shown)
              </p>
              <form onSubmit={handleAddTask} className="task-add-form" style={{ marginBottom: 16 }}>
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(event) => setNewTaskTime(event.target.value)}
                  aria-label="Task time"
                  className="task-add-control task-add-time"
                />
                <select
                  value={newTaskTeam}
                  onChange={(event) => setNewTaskTeam(event.target.value)}
                  aria-label="Task team"
                  className="task-add-control task-add-team"
                >
                  <option value="General">General (all teams)</option>
                  {teams.map((team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
                </select>
                <select
                  value={newTaskAssignee}
                  onChange={(event) => setNewTaskAssignee(event.target.value)}
                  aria-label="Task assignee"
                  className="task-add-control task-add-assignee"
                >
                  <option value="">Unassigned</option>
                  {(membersByTeam[newTaskTeam] || []).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(event) => setNewTaskText(event.target.value)}
                  placeholder="Add task for this date"
                  aria-label="Task description"
                  className="task-add-control task-add-input"
                />
                <button type="submit" className="task-add-submit">Add Task</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {visibleDateWork.length > 0 ? (
                  visibleDateWork.map((item) => (
                    <div key={item.id || item.task} style={{ 
                        borderLeft: '2px solid var(--line-600)', 
                        paddingLeft: 12,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        opacity: item.completed ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}>
                      <div style={{ marginTop: 2 }}>
                        <input
                          type="checkbox"
                          checked={item.completed || false}
                          onChange={() => handleToggleTask(item)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--fg-500)', display: 'flex', gap: 8 }}>
                          <span>{item.time}</span>
                          <span>•</span>
                          <span>{item.team || 'General'}</span>
                          {item.assignee && (
                            <>
                              <span>•</span>
                              <span>{item.assignee}</span>
                            </>
                          )}
                        </div>
                        <div style={{ 
                          marginTop: 4, 
                          textDecoration: item.completed ? 'line-through' : 'none' 
                        }}>
                          {item.task}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(item)} 
                        className="member-remove-btn" 
                        title="Delete Task" 
                        style={{ alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }}
                      >
                        &times;
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No tasks yet for {currentMonth} {toOrdinal(currentDay)} in {activeTeam || 'this team'}.
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="notes-card-head">
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes
                </h3>
                <Link href="/notes" className="notes-explorer-link">Open Explorer</Link>
              </div>
              <p className="muted" style={{ margin: '0 0 12px 0' }}>
                Notes for {currentMonth} {toOrdinal(currentDay)}
              </p>
              
              <div className="notes-text-area-wrapper" style={{ marginTop: 12 }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type notes here... they are saved directly to this date."
                  className="notes-text-area"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '12px' }}>
                <div style={{ flex: 1, minHeight: '1.5em', fontSize: '13px', color: 'var(--fg-500)', fontFamily: 'var(--font-mono)' }}>
                  {noteSaveMessage}
                </div>
                <button onClick={handleSaveNote} className="task-add-submit" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
                  Save Note
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
