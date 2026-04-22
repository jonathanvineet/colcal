'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import YourTeamsCard from '../components/YourTeamsCard'
import ExpandableDatePicker from '../components/ExpandableDatePicker'

const DEFAULT_TEAMS = [
  { name: 'Design Squad', color: '#3b82f6' },
  { name: 'Dev Ops', color: '#a855f7' },
  { name: 'Marketing', color: '#22c55e' },
  { name: 'Sales Team', color: '#f97316' }
]

const TEAMS_STORAGE_KEY = 'colcal-teams'
const WORK_STORAGE_KEY = 'colcal-work-by-date'
const NOTES_STORAGE_KEY = 'colcal-notes-by-date'

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

function formatDateKey(dateKey) {
  const date = fromDateKey(dateKey)
  const month = date.toLocaleString('default', { month: 'long' })
  return `${month} ${toOrdinal(date.getDate())}, ${date.getFullYear()}`
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

  const currentDay = selectedDate.getDate()
  const currentMonth = selectedDate.toLocaleString('default', { month: 'long' })
  const currentYear = selectedDate.getFullYear()

  const selectedDateKey = useMemo(() => getDateKey(selectedDate), [selectedDate])
  const selectedDateWork = workByDate[selectedDateKey] || []
  const selectedDateNote = notesByDate[selectedDateKey]?.text || ''
  const visibleDateWork = selectedDateWork.filter((task) => (
    task.team === 'General' || (activeTeam && task.team === activeTeam)
  ))
  const earlierNotes = useMemo(() => (
    Object.entries(notesByDate)
      .filter(([dateKey, entry]) => dateKey !== selectedDateKey && entry?.text)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
  ), [notesByDate, selectedDateKey])

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
        setNotesByDate(parsed)
      }
    } catch {
      window.localStorage.removeItem(NOTES_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesByDate))
  }, [notesByDate])

  useEffect(() => {
    setNotes(selectedDateNote)
    setNoteSaveMessage('')
  }, [selectedDateKey, selectedDateNote])

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

    setNotesByDate((currentNotesByDate) => {
      if (!trimmedNote) {
        const nextNotesByDate = { ...currentNotesByDate }
        delete nextNotesByDate[selectedDateKey]
        return nextNotesByDate
      }

      return {
        ...currentNotesByDate,
        [selectedDateKey]: {
          text: trimmedNote,
          savedAt: new Date().toISOString()
        }
      }
    })

    setNoteSaveMessage(trimmedNote ? 'Saved.' : 'Empty note removed.')
  }

  function handleViewSavedNote(dateKey) {
    setSelectedDate(fromDateKey(dateKey))
  }

  return (
    <div className="home-page">
      {/* Header */}
      <div className="header-bar">
        <h1>Colcal</h1>
        {user && <UserButton afterSignOutUrl="/login" />}
      </div>

      {/* Main Container */}
      <div className="home-container">
        {/* Welcome Section */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Welcome, {user?.firstName || 'User'}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Selected date: {currentMonth} {currentDay}, {currentYear}
          </p>
          <ExpandableDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Grid Layout */}
        <div className="dashboard-grid">
          {/* Teams Card */}
          <YourTeamsCard
            teams={teams}
            setTeams={setTeams}
            activeTeam={activeTeam}
            setActiveTeam={setActiveTeam}
          />

          {/* Today's Work Card */}
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

          {/* Notes Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes
            </h3>
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
                Earlier Notes
              </h4>
              {earlierNotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {earlierNotes.map(([dateKey, entry]) => (
                    <div key={dateKey} style={{
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
                        <div style={{ fontSize: 12, color: 'var(--fg-300)' }}>{formatDateKey(dateKey)}</div>
                        <div style={{ fontSize: 12, color: 'var(--fg-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                          {entry.text}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleViewSavedNote(dateKey)} style={{ padding: '6px 10px', fontSize: 12 }}>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  No earlier saved notes yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
