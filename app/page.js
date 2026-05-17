'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useUser, UserButton, OrganizationSwitcher, useOrganization } from '@clerk/nextjs'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import YourTeamsCard from '@/components/YourTeamsCard'
import TeamMembersCard from '@/components/TeamMembersCard'
import * as db from '@/lib/db'
import { UploadButton } from '@/utils/uploadthing'
import imageCompression from 'browser-image-compression'

const Calendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => (
    <div className="calendar-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
      Loading calendar…
    </div>
  )
})

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
  const { memberships, membership } = useOrganization({
    memberships: {
      keepPreviousData: true,
    },
  })

  const isSuperuser = user?.publicMetadata?.isSuperuser === true
  const isAdmin = isSuperuser || membership?.role === 'org:admin'
  const userDisplayName = user?.fullName || user?.firstName || user?.username || 'Unknown User'
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  const [notes, setNotes] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [notesByDate, setNotesByDate] = useState({})
  const [noteSaveMessage, setNoteSaveMessage] = useState('')
  const [teams, setTeams] = useState([])
  const [activeTeam, setActiveTeam] = useState(null)
  const [workByDate, setWorkByDate] = useState({})
  const [newTaskText, setNewTaskText] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState(new Set())
  const [membersByTeam, setMembersByTeam] = useState({})

  const [activeTaskForDetails, setActiveTaskForDetails] = useState(null)
  const [detailsDraft, setDetailsDraft] = useState('')

  const handleOpenDetails = useCallback((task) => {
    setActiveTaskForDetails(task)
    setDetailsDraft(task.details || '')
  }, [])

  const handleCloseDetails = useCallback(() => {
    setActiveTaskForDetails(null)
    setDetailsDraft('')
  }, [])

  const handleSaveDetails = useCallback(async () => {
    if (!activeTaskForDetails) return
    const task = activeTaskForDetails
    const newDetails = detailsDraft
    const targetDateKey = task.dateKey || getDateKey(selectedDate)

    setWorkByDate((prev) => {
      const copy = { ...prev }
      if (copy[targetDateKey]) {
        copy[targetDateKey] = copy[targetDateKey].map((t) =>
          t.id === task.id ? { ...t, details: newDetails } : t
        )
      }
      return copy
    })
    
    handleCloseDetails()

    try {
      await db.updateTask(task.id, { details: newDetails })
    } catch (err) {
      console.error('Failed to update task details:', err)
    }
  }, [activeTaskForDetails, detailsDraft, selectedDate, handleCloseDetails])

  // ── Derived values ────────────────────────────────────────────────────
  const currentDay = selectedDate.getDate()
  const currentMonth = selectedDate.toLocaleString('default', { month: 'long' })
  const currentYear = selectedDate.getFullYear()

  const orgMemberNames = useMemo(() => {
    if (!memberships?.data) return []
    return memberships.data.map((m) => {
      const u = m.publicUserData
      return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.identifier
    }).filter(Boolean)
  }, [memberships?.data])



  const selectedDateKey = useMemo(() => getDateKey(selectedDate), [selectedDate])
  const selectedDateWork = workByDate[selectedDateKey] || []
  const selectedDateNotes = notesByDate[selectedDateKey] || []
  const selectedDateLatestNote = selectedDateNotes[selectedDateNotes.length - 1]?.text || ''
  const visibleDateWork = activeTeam
    ? selectedDateWork.filter((task) => task.team === activeTeam)
    : selectedDateWork
  const selectedDateSortedNotes = useMemo(() => (
    selectedDateNotes
      .slice()
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  ), [selectedDateNotes])

  const myAssignedTasks = useMemo(() => {
    const tasks = []
    Object.entries(workByDate).forEach(([dateKey, dailyTasks]) => {
      dailyTasks.forEach(task => {
        if (!task.completed && task.assignee === userDisplayName) {
          tasks.push({ ...task, dateKey })
        }
      })
    })
    return tasks.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime())
  }, [workByDate, userDisplayName])

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
        setMembersByTeam(fetchedMembers)

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

  // ── Sync notes textarea when selected date changes ────────────────────
  useEffect(() => {
    setNotes(selectedDateLatestNote)
    setNoteSaveMessage('')
  }, [selectedDateKey, selectedDateLatestNote])

  // ── Toggle assignee selection ─────────────────────────────────────────
  const handleToggleAssignee = useCallback((name) => {
    setSelectedAssignees(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

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

    const assigneeList = [...selectedAssignees]
    const taskPayload = {
      time: 'Anytime',
      task: trimmedTask,
      team: activeTeam || 'Unassigned',
      assignee: assigneeList.length > 0 ? assigneeList.join(', ') : null,
    }

    setNewTaskText('')
    setSelectedAssignees(new Set())

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
    const targetDateKey = task.dateKey || selectedDateKey

    setWorkByDate((prev) => {
      const copy = { ...prev }
      if (copy[targetDateKey]) {
        copy[targetDateKey] = copy[targetDateKey].map((t) =>
          t.id === task.id ? { ...t, completed: newCompleted } : t
        )
      }
      return copy
    })

    try {
      await db.updateTask(task.id, { completed: newCompleted })
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }, [selectedDateKey])

  const handleDeleteTask = useCallback(async (task) => {
    const targetDateKey = task.dateKey || selectedDateKey
    setWorkByDate((prev) => {
      const copy = { ...prev }
      if (copy[targetDateKey]) {
        copy[targetDateKey] = copy[targetDateKey].filter((t) => t.id !== task.id)
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
            <OrganizationSwitcher
              hidePersonal={false}
              hideSlug={true}
              {...(!isSuperuser && {
                hideCreateOrganization: true,
              })}
            />
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
              isAdmin={isAdmin}
            />
            <TeamMembersCard
              teams={teams}
              activeTeam={activeTeam}
              membersByTeam={membersByTeam}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              selectedAssignees={selectedAssignees}
              onToggleAssignee={handleToggleAssignee}
              isAdmin={isAdmin}
            />

            <div className="card">
              <div className="calendar-feature-head">
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  My Assigned Tasks
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {myAssignedTasks.length > 0 ? (
                  myAssignedTasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ marginTop: '2px' }}>
                        <input
                          type="checkbox"
                          checked={task.completed || false}
                          onChange={() => handleToggleTask(task)}
                          style={{ cursor: 'pointer', accentColor: '#e2b340' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: 'var(--fg-500)', marginBottom: '4px' }}>
                          {formatTimestamp(task.dateKey, task.time)}
                          {task.team && ` • ${task.team}`}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--fg-100)' }}>
                          {task.task}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenDetails(task)}
                        title="Proof & Details"
                        style={{
                          alignSelf: 'center', marginLeft: 'auto', flexShrink: 0,
                          background: 'transparent', border: '1px solid var(--line-600)',
                          color: 'var(--fg-300)', padding: '2px 6px', borderRadius: '4px',
                          fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Details
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ fontSize: '12px', margin: 0 }}>No pending tasks assigned to you.</p>
                )}
              </div>
            </div>
          </aside>

          <section className="center-calendar-zone">
            <div className="card calendar-feature-card">
              <div className="calendar-feature-head">
                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Team Calendar
                </h3>
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
              {isAdmin && (
                <form onSubmit={handleAddTask} className="task-add-form" style={{ marginBottom: 16 }}>
                  {(activeTeam || selectedAssignees.size > 0) && (
                    <div style={{
                      gridArea: 'info',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      alignItems: 'center',
                      fontSize: 12,
                    }}>
                      {activeTeam && (() => {
                        const teamColor = teams.find(t => t.name === activeTeam)?.color || '#646cff'
                        return (
                          <>
                            <span style={{ color: 'var(--fg-500)', marginRight: 2 }}>Team:</span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              border: `1px solid ${teamColor}60`,
                              background: `${teamColor}18`,
                              color: teamColor,
                              fontSize: 11,
                            }}>
                              {activeTeam}
                            </span>
                          </>
                        )
                      })()}
                      {activeTeam && selectedAssignees.size > 0 && (
                        <span style={{ color: 'var(--line-600)', margin: '0 2px' }}>·</span>
                      )}
                      {selectedAssignees.size > 0 && (
                        <>
                          <span style={{ color: 'var(--fg-500)', marginRight: 2 }}>Assigning to:</span>
                          {[...selectedAssignees].map(name => (
                            <span key={name} style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              border: '1px solid rgba(226, 179, 64, 0.3)',
                              background: 'rgba(226, 179, 64, 0.08)',
                              color: '#e2b340',
                              fontSize: 11,
                            }}>
                              {name}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  <textarea
                    value={newTaskText}
                    onChange={(event) => setNewTaskText(event.target.value)}
                    placeholder={`Add task for this date${activeTeam ? ` → ${activeTeam}` : ''}`}
                    aria-label="Task description"
                    className="task-add-control task-add-input"
                  />
                  <button type="submit" className="task-add-submit">Add Task</button>
                </form>
              )}
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
                          <span>{item.team || 'Unassigned'}</span>
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
                      <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                        <button
                          onClick={() => handleOpenDetails(item)}
                          title="Proof & Details"
                          style={{
                            background: 'transparent', border: '1px solid var(--line-600)',
                            color: 'var(--fg-300)', padding: '2px 6px', borderRadius: '4px',
                            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteTask(item)}
                          className="member-remove-btn"
                          title="Delete Task"
                          style={{ padding: '2px 6px' }}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No tasks yet for {currentMonth} {toOrdinal(currentDay)}{activeTeam ? ` in ${activeTeam}` : ''}.
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

      {/* Document Editor Modal */}
      {activeTaskForDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '40vw', minWidth: '500px', height: '80vh',
            backgroundColor: 'var(--bg-800)',
            borderRadius: '12px',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05), 0 30px 80px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--line-600)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--bg-900)'
            }}>
              <div style={{ flex: 1, marginRight: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--fg-100)', fontSize: '16px', fontWeight: 600 }}>Task Proof & Details</h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--fg-500)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeTaskForDetails.task}
                </p>
              </div>
              <button onClick={handleCloseDetails} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--fg-500)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--fg-100)'} onMouseOut={(e) => e.target.style.color = 'var(--fg-500)'}>&times;</button>
            </div>
            
            {/* Editor Area */}
            <textarea
              value={detailsDraft}
              onChange={(e) => setDetailsDraft(e.target.value)}
              placeholder="Type your notes, attach proof links, or add extra instructions here..."
              style={{
                flex: 1, width: '100%', padding: '32px 48px',
                border: 'none', outline: 'none',
                resize: 'none',
                fontSize: '15px', lineHeight: '1.8',
                color: 'var(--fg-100)', backgroundColor: 'var(--bg-800)',
                fontFamily: 'var(--font-sans), system-ui, sans-serif'
              }}
            />

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--line-600)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: 'var(--bg-900)'
            }}>
              <div>
                <UploadButton
                  endpoint="taskAttachment"
                  onBeforeUploadBegin={async (files) => {
                    const compressedFiles = await Promise.all(
                      files.map(async (file) => {
                        if (!file.type.startsWith('image/')) return file;
                        try {
                          const options = {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                          };
                          const compressedBlob = await imageCompression(file, options);
                          return new File([compressedBlob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                          });
                        } catch (error) {
                          console.error("Compression error:", error);
                          return file;
                        }
                      })
                    );
                    return compressedFiles;
                  }}
                  onClientUploadComplete={(res) => {
                    if (res && res.length > 0) {
                      const fileUrl = res[0].url;
                      const fileName = res[0].name;
                      setDetailsDraft(prev => prev + `\n\n[Attachment: ${fileName}](${fileUrl})`);
                    }
                  }}
                  onUploadError={(error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                  appearance={{
                    button: {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--line-600)',
                      color: 'var(--fg-300)',
                      padding: '4px 12px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      height: 'auto',
                      minHeight: 'auto',
                      fontWeight: 500,
                      cursor: 'pointer'
                    },
                    allowedContent: { display: 'none' }
                  }}
                  content={{
                    button({ ready, isUploading }) {
                      if (isUploading) return "Uploading...";
                      if (ready) return "Attach File";
                      return "Getting ready...";
                    },
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCloseDetails} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--line-600)', backgroundColor: 'var(--bg-800)', color: 'var(--fg-300)', cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button onClick={handleSaveDetails} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(100, 108, 255, 0.4)', backgroundColor: 'rgba(100, 108, 255, 0.1)', color: '#646cff', cursor: 'pointer', fontWeight: 600 }}>
                  Save Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
