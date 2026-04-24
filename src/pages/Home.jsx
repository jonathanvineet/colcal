'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import YourTeamsCard from '../components/YourTeamsCard'
import Calendar from '../components/Calendar'
import TeamMembersCard from '../components/TeamMembersCard'

const DEFAULT_TEAMS = [
  { name: 'Design Squad', color: '#3b82f6' },
  { name: 'Dev Ops', color: '#a855f7' },
  { name: 'Marketing', color: '#22c55e' },
  { name: 'Sales Team', color: '#f97316' }
]

const TEAMS_STORAGE_KEY = 'colcal-teams'
const WORK_STORAGE_KEY = 'colcal-work-by-date'
const NOTES_STORAGE_KEY = 'colcal-notes-by-date'
const MEMBERS_STORAGE_KEY = 'colcal-members-by-team'

const DEFAULT_MEMBERS_BY_TEAM = {
  General: ['Alex Morgan', 'Sam Lee', 'Jordan Kim'],
  'Design Squad': ['Mia Patel', 'Leo Wang'],
  'Dev Ops': ['Noah Brown', 'Priya Singh'],
  Marketing: ['Olivia Davis', 'Ethan Reed'],
  'Sales Team': ['Ava Wilson', 'Daniel Cruz']
}

function normalizeMemberName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function sanitizeMemberList(list) {
  if (!Array.isArray(list)) {
    return []
  }

  const seen = new Set()
  const next = []

  list.forEach((item) => {
    if (typeof item !== 'string') {
      return
    }

    const cleaned = normalizeMemberName(item)
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

function normalizeMembersByTeam(source, teams) {
  const normalizedSource = (source && typeof source === 'object') ? source : {}
  const next = {
    General: sanitizeMemberList(normalizedSource.General || DEFAULT_MEMBERS_BY_TEAM.General)
  }

  teams.forEach((team) => {
    next[team.name] = sanitizeMemberList(normalizedSource[team.name] || DEFAULT_MEMBERS_BY_TEAM[team.name] || [])
  })

  return next
}

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

function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`)
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

function normalizeNotesByDate(source) {
  if (!source || typeof source !== 'object') {
    return {}
  }

  const next = {}

  Object.entries(source).forEach(([dateKey, value]) => {
    if (Array.isArray(value)) {
      const normalizedEntries = value
        .filter((entry) => entry && typeof entry === 'object' && typeof entry.text === 'string')
        .map((entry, index) => {
          const trimmedText = entry.text.trim()
          if (!trimmedText) {
            return null
          }

          return {
            id: typeof entry.id === 'string' ? entry.id : `${dateKey}-${index}-${Date.now()}`,
            text: trimmedText,
            savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : new Date().toISOString(),
            authorName: typeof entry.authorName === 'string' && entry.authorName.trim()
              ? entry.authorName.trim()
              : 'Unknown User',
            team: typeof entry.team === 'string' && entry.team.trim()
              ? entry.team.trim()
              : 'General'
          }
        })
        .filter(Boolean)

      if (normalizedEntries.length > 0) {
        next[dateKey] = normalizedEntries
      }
      return
    }

    // Backward compatibility: old format was one object { text, savedAt }
    if (value && typeof value === 'object' && typeof value.text === 'string' && value.text.trim()) {
      next[dateKey] = [{
        id: `${dateKey}-legacy`,
        text: value.text.trim(),
        savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString(),
        authorName: 'Unknown User',
        team: 'General'
      }]
    }
  })

  return next
}

export default function Home() {
  const { user } = useUser()
  const [notes, setNotes] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [notesByDate, setNotesByDate] = useState({})
  const [noteSaveMessage, setNoteSaveMessage] = useState('')
  const [teams, setTeams] = useState(DEFAULT_TEAMS)
  const [activeTeam, setActiveTeam] = useState(DEFAULT_TEAMS[0]?.name || null)
  const [workByDate, setWorkByDate] = useState({})
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskTeam, setNewTaskTeam] = useState('General')
  const [membersByTeam, setMembersByTeam] = useState(() => normalizeMembersByTeam(DEFAULT_MEMBERS_BY_TEAM, DEFAULT_TEAMS))

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


  useEffect(() => {
    const savedTeams = window.localStorage.getItem(TEAMS_STORAGE_KEY)
    if (!savedTeams) {
      return
    }

    try {
      const parsedTeams = JSON.parse(savedTeams)
      if (Array.isArray(parsedTeams)) {
        const normalizedTeams = parsedTeams.filter((team) => (
          team &&
          typeof team.name === 'string' &&
          typeof team.color === 'string'
        ))
        if (normalizedTeams.length > 0) {
          setTeams(normalizedTeams)
          setActiveTeam((currentActiveTeam) => (
            normalizedTeams.some((team) => team.name === currentActiveTeam)
              ? currentActiveTeam
              : normalizedTeams[0].name
          ))
        }
      }
    } catch {
      window.localStorage.removeItem(TEAMS_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
    if (teams.length === 0) {
      setActiveTeam(null)
      return
    }
    if (!teams.some((team) => team.name === activeTeam)) {
      setActiveTeam(teams[0].name)
    }

    setMembersByTeam((currentMembersByTeam) => {
      const normalized = normalizeMembersByTeam(currentMembersByTeam, teams)
      return JSON.stringify(currentMembersByTeam) === JSON.stringify(normalized)
        ? currentMembersByTeam
        : normalized
    })
  }, [teams, activeTeam])

  useEffect(() => {
    const savedWork = window.localStorage.getItem(WORK_STORAGE_KEY)
    if (!savedWork) {
      return
    }

    try {
      const parsed = JSON.parse(savedWork)
      if (parsed && typeof parsed === 'object') {
        setWorkByDate(parsed)
      }
    } catch {
      window.localStorage.removeItem(WORK_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify(workByDate))
  }, [workByDate])

  useEffect(() => {
    const savedNotes = window.localStorage.getItem(NOTES_STORAGE_KEY)
    if (!savedNotes) {
      return
    }

    try {
      const parsed = JSON.parse(savedNotes)
      if (parsed && typeof parsed === 'object') {
        setNotesByDate(normalizeNotesByDate(parsed))
      }
    } catch {
      window.localStorage.removeItem(NOTES_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const savedMembers = window.localStorage.getItem(MEMBERS_STORAGE_KEY)
    if (!savedMembers) {
      return
    }

    try {
      const parsed = JSON.parse(savedMembers)
      if (parsed && typeof parsed === 'object') {
        setMembersByTeam((currentMembersByTeam) => normalizeMembersByTeam({
          ...currentMembersByTeam,
          ...parsed
        }, teams))
      }
    } catch {
      window.localStorage.removeItem(MEMBERS_STORAGE_KEY)
    }
  }, [teams])

  useEffect(() => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesByDate))
  }, [notesByDate])

  useEffect(() => {
    window.localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(membersByTeam))
  }, [membersByTeam])

  useEffect(() => {
    setNotes(selectedDateLatestNote)
    setNoteSaveMessage('')
  }, [selectedDateKey, selectedDateLatestNote])

  useEffect(() => {
    if (activeTeam) {
      setNewTaskTeam(activeTeam)
    } else {
      setNewTaskTeam('General')
    }
  }, [activeTeam])


  function handleAddTask(event) {
    event.preventDefault()
    const trimmedTask = newTaskText.trim()
    if (!trimmedTask) {
      return
    }

    setWorkByDate((currentWorkByDate) => {
      const tasksForSelectedDate = currentWorkByDate[selectedDateKey] || []
      return {
        ...currentWorkByDate,
        [selectedDateKey]: [
          ...tasksForSelectedDate,
          {
            time: newTaskTime || 'Anytime',
            task: trimmedTask,
            team: newTaskTeam
          }
        ]
      }
    })

    setNewTaskText('')
    setNewTaskTime('')
    setNewTaskTeam(activeTeam || 'General')
  }

  function handleSaveNote() {
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

    setNotesByDate((currentNotesByDate) => {
      const existingForDate = Array.isArray(currentNotesByDate[selectedDateKey])
        ? currentNotesByDate[selectedDateKey]
        : []

      return {
        ...currentNotesByDate,
        [selectedDateKey]: [...existingForDate, noteEntry]
      }
    })

    setNoteSaveMessage(`Saved by ${authorName} at ${formatTimestamp(savedAt)}.`)
  }

  return (
    <div className="home-page">
      <div className="header-bar">
        <h1>Colcal</h1>
        {user && <UserButton afterSignOutUrl="/login" />}
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
              setTeams={setTeams}
              activeTeam={activeTeam}
              setActiveTeam={setActiveTeam}
            />
            <TeamMembersCard
              teams={teams}
              activeTeam={activeTeam}
              membersByTeam={membersByTeam}
              setMembersByTeam={setMembersByTeam}
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
              <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentMonth} {toOrdinal(currentDay)}'s Work
              </h3>
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
                  visibleDateWork.map((item, idx) => (
                    <div key={idx} style={{ borderLeft: '2px solid var(--line-600)', paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--fg-500)', display: 'flex', gap: 8 }}>
                        <span>{item.time}</span>
                        <span>•</span>
                        <span>{item.team || 'General'}</span>
                      </div>
                      <div style={{ marginTop: 4 }}>{item.task}</div>
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
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes here..."
                style={{
                  width: '100%',
                  minHeight: 150,
                  padding: 12,
                  border: '1px solid var(--line-600)',
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--fg-100)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10 }}>
                <button type="button" onClick={handleSaveNote} style={{ minWidth: 120 }}>
                  Save Note
                </button>
                <span className="muted" style={{ fontSize: 12 }}>
                  {noteSaveMessage}
                </span>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-300)' }}>
                  Saved Notes For This Date
                </h4>
                {selectedDateSortedNotes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedDateSortedNotes.map((entry) => (
                      <div key={entry.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        border: '1px solid var(--line-600)',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--fg-300)' }}>
                            {entry.authorName} • {entry.team} • {formatTimestamp(entry.savedAt)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--fg-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                            {entry.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    No saved notes for this date yet.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
