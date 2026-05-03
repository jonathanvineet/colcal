'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'
import NotesExplorerCard from '@/components/NotesExplorerCard'
import { fetchNotes } from '@/lib/db'

const NOTES_PAGE_SIZE = 15

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

export default function NotesExplorerPage() {
  const { user, isLoaded } = useUser()
  const [notesByDate, setNotesByDate] = useState({})
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesQuery, setNotesQuery] = useState('')
  const [debouncedNotesQuery, setDebouncedNotesQuery] = useState('')
  const [notesDateFrom, setNotesDateFrom] = useState('')
  const [notesDateTo, setNotesDateTo] = useState('')
  const [selectedNoteTeams, setSelectedNoteTeams] = useState([])
  const [selectedNoteAuthors, setSelectedNoteAuthors] = useState([])
  const [notesSortBy, setNotesSortBy] = useState('newest')
  const [notesPage, setNotesPage] = useState(1)
  const [previewEntry, setPreviewEntry] = useState(null)

  // Load notes from DB when user is available
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    setNotesLoading(true)
    fetchNotes()
      .then((data) => {
        if (!cancelled) {
          setNotesByDate(data)
        }
      })
      .catch((err) => {
        console.error('Failed to load notes:', err)
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false)
      })

    return () => { cancelled = true }
  }, [user?.id])

  const allNotes = useMemo(() => (
    Object.entries(notesByDate)
      .flatMap(([dateKey, entries]) => (
        (Array.isArray(entries) ? entries : []).map((entry) => ({ ...entry, dateKey }))
      ))
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  ), [notesByDate])

  const noteTeamOptions = useMemo(() => (
    Array.from(new Set(allNotes.map((entry) => entry.team))).sort((a, b) => a.localeCompare(b))
  ), [allNotes])

  const noteAuthorOptions = useMemo(() => (
    Array.from(new Set(allNotes.map((entry) => entry.authorName))).sort((a, b) => a.localeCompare(b))
  ), [allNotes])

  const filteredNotes = useMemo(() => {
    const query = debouncedNotesQuery.trim().toLowerCase()
    const startMs = notesDateFrom ? new Date(`${notesDateFrom}T00:00:00`).getTime() : null
    const endMs = notesDateTo ? new Date(`${notesDateTo}T23:59:59`).getTime() : null

    const base = allNotes.filter((entry) => {
      const savedAtMs = new Date(entry.savedAt).getTime()
      if (startMs !== null && Number.isFinite(savedAtMs) && savedAtMs < startMs) return false
      if (endMs !== null && Number.isFinite(savedAtMs) && savedAtMs > endMs) return false
      if (selectedNoteTeams.length > 0 && !selectedNoteTeams.includes(entry.team)) return false
      if (selectedNoteAuthors.length > 0 && !selectedNoteAuthors.includes(entry.authorName)) return false
      if (query) {
        const searchable = `${entry.text} ${entry.team} ${entry.authorName} ${entry.dateKey}`.toLowerCase()
        if (!searchable.includes(query)) return false
      }
      return true
    })

    return base.sort((a, b) => {
      const aMs = new Date(a.savedAt).getTime()
      const bMs = new Date(b.savedAt).getTime()
      const safeAMs = Number.isFinite(aMs) ? aMs : 0
      const safeBMs = Number.isFinite(bMs) ? bMs : 0
      if (notesSortBy === 'oldest') return safeAMs - safeBMs
      return safeBMs - safeAMs
    })
  }, [allNotes, debouncedNotesQuery, notesDateFrom, notesDateTo, selectedNoteTeams, selectedNoteAuthors, notesSortBy])

  const totalFilteredNotes = filteredNotes.length
  const totalNotesPages = Math.max(1, Math.ceil(totalFilteredNotes / NOTES_PAGE_SIZE))

  const paginatedNotes = useMemo(() => {
    const start = (notesPage - 1) * NOTES_PAGE_SIZE
    return filteredNotes.slice(start, start + NOTES_PAGE_SIZE)
  }, [filteredNotes, notesPage])

  // Debounce search query
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedNotesQuery(notesQuery)
    }, 200)
    return () => { window.clearTimeout(timeoutId) }
  }, [notesQuery])

  useEffect(() => {
    setNotesPage(1)
  }, [debouncedNotesQuery, notesDateFrom, notesDateTo, selectedNoteTeams, selectedNoteAuthors, notesSortBy])

  useEffect(() => {
    if (notesPage > totalNotesPages) {
      setNotesPage(totalNotesPages)
    }
  }, [notesPage, totalNotesPages])

  function handleToggleNoteTeam(teamName) {
    setSelectedNoteTeams((current) => (
      current.includes(teamName)
        ? current.filter((item) => item !== teamName)
        : [...current, teamName]
    ))
  }

  function handleToggleNoteAuthor(authorName) {
    setSelectedNoteAuthors((current) => (
      current.includes(authorName)
        ? current.filter((item) => item !== authorName)
        : [...current, authorName]
    ))
  }

  function handleClearNoteFilters() {
    setNotesQuery('')
    setDebouncedNotesQuery('')
    setNotesDateFrom('')
    setNotesDateTo('')
    setSelectedNoteTeams([])
    setSelectedNoteAuthors([])
    setNotesSortBy('newest')
    setNotesPage(1)
  }

  function handleOpenNote(dateKey, text) {
    setPreviewEntry({ dateKey, text })
  }

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: 'white',
      }}>
        Loading...
      </div>
    )
  }

  if (notesLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: 'white',
      }}>
        Loading notes…
      </div>
    )
  }

  return (
    <div className="home-page notes-page">
      <div className="header-bar">
        <h1>Colcal</h1>
        {user && <UserButton afterSignOutUrl="/login" />}
      </div>

      <div className="home-container notes-page-container">
        <div className="card notes-page-title-card">
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>Notes Explorer</h2>
            <p className="muted" style={{ margin: 0 }}>
              Explore and filter all saved notes across all calendar dates.
            </p>
          </div>
          <Link href="/" className="notes-explorer-link">Back To Dashboard</Link>
        </div>

        <div className="card">
          <NotesExplorerCard
            query={notesQuery}
            onQueryChange={setNotesQuery}
            dateFrom={notesDateFrom}
            dateTo={notesDateTo}
            onDateFromChange={setNotesDateFrom}
            onDateToChange={setNotesDateTo}
            sortBy={notesSortBy}
            onSortByChange={setNotesSortBy}
            teamOptions={noteTeamOptions}
            authorOptions={noteAuthorOptions}
            selectedTeams={selectedNoteTeams}
            selectedAuthors={selectedNoteAuthors}
            onToggleTeam={handleToggleNoteTeam}
            onToggleAuthor={handleToggleNoteAuthor}
            onClearFilters={handleClearNoteFilters}
            totalResults={totalFilteredNotes}
            page={notesPage}
            pageSize={NOTES_PAGE_SIZE}
            paginatedNotes={paginatedNotes}
            onPrevPage={() => setNotesPage((current) => Math.max(1, current - 1))}
            onNextPage={() => setNotesPage((current) => Math.min(totalNotesPages, current + 1))}
            onOpenNote={handleOpenNote}
            formatDateKey={formatDateKey}
            formatTimestamp={formatTimestamp}
          />
        </div>

        {previewEntry && (
          <div className="card notes-preview-card">
            <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Note Preview
            </h3>
            <p className="muted" style={{ margin: '0 0 12px 0' }}>
              {formatDateKey(previewEntry.dateKey)}
            </p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{previewEntry.text}</p>
          </div>
        )}
      </div>
    </div>
  )
}
