'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import {
  fetchCalendarEvents,
  saveCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../lib/db'

// Note: FullCalendar v6 injects its styles at runtime into a <style data-fullcalendar> tag.
// Do not import CSS files here; the packages no longer ship main.css files.

function isSameDay(a, b) {
  return (
    a instanceof Date &&
    b instanceof Date &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

export default function Calendar({
  userId,
  orgId,
  selectedDate,
  onDateChange,
  notesByDate = {},
  workByDate = {},
  teams = [],
  onOpenTaskDetails
}) {
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])
  const [eventsLoaded, setEventsLoaded] = useState(false)

  // Load events from DB when userId or orgId changes
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    setEventsLoaded(false)
    setEvents([])

    fetchCalendarEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data)
          setEventsLoaded(true)
        }
      })
      .catch((err) => {
        console.error('Failed to load calendar events:', err)
        if (!cancelled) setEventsLoaded(true)
      })

    return () => { cancelled = true }
  }, [userId, orgId])

  // Sync calendar view when selectedDate changes externally
  useEffect(() => {
    if (!selectedDate) return

    const api = calendarRef.current?.getApi?.()
    if (!api) return

    const current = api.getDate()
    if (!isSameDay(current, selectedDate)) {
      const timer = setTimeout(() => {
        api.gotoDate(selectedDate)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [selectedDate])

  // Merge regular calendar events with scheduled tasks from workByDate
  const allCalendarEvents = useMemo(() => {
    const taskEvents = Object.entries(workByDate).flatMap(([dateKey, dailyTasks]) => {
      if (!Array.isArray(dailyTasks)) return []
      return dailyTasks.map((task) => {
        const teamObj = teams.find((t) => t.name === task.team)
        const teamColor = teamObj?.color || '#3b82f6'
        const isCompleted = !!task.completed

        return {
          id: `task-${task.id}`,
          title: task.task,
          start: dateKey,
          allDay: true,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: '#ffffff',
          classNames: ['fc-task-event', isCompleted ? 'is-task-completed' : ''],
          extendedProps: {
            isTask: true,
            task,
            teamColor: isCompleted ? 'rgba(255,255,255,0.2)' : teamColor,
            teamName: task.team || '',
            assignee: task.assignee || '',
            isCompleted,
          },
        }
      })
    })

    return [...events, ...taskEvents]
  }, [events, workByDate, teams])

  const handleDateSelect = (info) => {
    onDateChange?.(info.start)

    const isSingleDayAllDaySelection = (
      info.allDay &&
      info.start &&
      info.end &&
      info.end.getTime() - info.start.getTime() === 24 * 60 * 60 * 1000
    )

    if (isSingleDayAllDaySelection) return

    const title = prompt('Event title?')
    if (title) {
      const newEvent = {
        id: String(Date.now()),
        title,
        start: info.startStr,
        end: info.endStr,
        allDay: info.allDay,
      }
      setEvents((prev) => [...prev, newEvent])
      saveCalendarEvent(newEvent).catch((err) =>
        console.error('Failed to save calendar event:', err)
      )
    }
  }

  const handleDateClick = (info) => {
    onDateChange?.(new Date(info.dateStr))
  }

  const handleEventChange = (changeInfo) => {
    const { event } = changeInfo
    if (event.extendedProps?.isTask) return // Task scheduling is managed via task system

    const updated = {
      id: event.id,
      start: event.start?.toISOString?.() || event.startStr,
      end: event.end?.toISOString?.() || event.endStr,
      allDay: event.allDay,
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, ...updated } : e))
    )
    updateCalendarEvent(updated).catch((err) =>
      console.error('Failed to update calendar event:', err)
    )
  }

  const handleEventAdd = (addInfo) => {
    const { event } = addInfo
    if (event.extendedProps?.isTask) return
    // FullCalendar may fire eventAdd for events already in state — only persist if new
    if (!events.find((e) => e.id === event.id)) {
      const newEvent = {
        id: event.id,
        title: event.title,
        start: event.start?.toISOString?.() || event.startStr,
        end: event.end?.toISOString?.() || event.endStr,
        allDay: event.allDay,
      }
      setEvents((prev) => [...prev, newEvent])
      saveCalendarEvent(newEvent).catch((err) =>
        console.error('Failed to save calendar event:', err)
      )
    }
  }

  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps?.isTask) {
      const task = clickInfo.event.extendedProps.task
      onOpenTaskDetails?.(task)
      return
    }

    if (confirm(`Delete event '${clickInfo.event.title}'?`)) {
      const id = clickInfo.event.id
      setEvents((prev) => prev.filter((e) => e.id !== id))
      clickInfo.event.remove()
      deleteCalendarEvent(id).catch((err) =>
        console.error('Failed to delete calendar event:', err)
      )
    }
  }

  if (!eventsLoaded) {
    return (
      <div className="calendar-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Loading calendar…
      </div>
    )
  }

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        selectable
        selectMirror
        dayMaxEvents
        editable
        droppable
        events={allCalendarEvents}
        select={handleDateSelect}
        dateClick={handleDateClick}
        eventAdd={handleEventAdd}
        eventChange={handleEventChange}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        dayCellClassNames={(arg) => (isSameDay(arg.date, selectedDate) ? ['is-selected-day'] : [])}
        dayCellContent={(arg) => {
          const dateKey = getDateKey(arg.date)
          const dayNotes = notesByDate[dateKey]
          const noteCount = Array.isArray(dayNotes) ? dayNotes.length : 0

          const dayTasks = workByDate[dateKey]
          const taskCount = Array.isArray(dayTasks) ? dayTasks.length : 0
          const pendingCount = Array.isArray(dayTasks) ? dayTasks.filter((t) => !t.completed).length : 0

          return (
            <div className="fc-daygrid-day-number-wrapper">
              <span className="fc-daygrid-day-number-text">{arg.dayNumberText}</span>
              {taskCount > 0 && (
                <span
                  className="fc-day-task-badge"
                  title={`${taskCount} task${taskCount > 1 ? 's' : ''} (${pendingCount} pending)`}
                >
                  <span className="fc-day-task-dot" />
                  {taskCount > 1 && <span className="fc-day-task-count">{taskCount}</span>}
                </span>
              )}
              {noteCount > 0 && (
                <span
                  className="fc-day-note-badge"
                  title={`${noteCount} note${noteCount > 1 ? 's' : ''} on this date`}
                >
                  <span className="fc-day-note-dot" />
                  {noteCount > 1 && <span className="fc-day-note-count">{noteCount}</span>}
                </span>
              )}
            </div>
          )
        }}
        eventContent={(arg) => {
          if (!arg.event.extendedProps?.isTask) return undefined
          const { teamColor, teamName, assignee, isCompleted, task } = arg.event.extendedProps
          const initial = assignee ? assignee.trim()[0].toUpperCase() : '?'
          const shortTask = arg.event.title.length > 18
            ? arg.event.title.slice(0, 17) + '…'
            : arg.event.title
          return (
            <div
              title={`${teamName ? `[${teamName}] ` : ''}${task.task}${assignee ? ` · ${assignee}` : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: isCompleted ? 'rgba(255,255,255,0.05)' : `${teamColor}22`,
                borderLeft: `2px solid ${isCompleted ? 'rgba(255,255,255,0.2)' : teamColor}`,
                width: '100%',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: isCompleted ? 0.45 : 1,
              }}
            >
              {/* Assignee avatar dot */}
              <span style={{
                flexShrink: 0,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: isCompleted ? 'rgba(255,255,255,0.15)' : `${teamColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 700,
                color: '#000',
                lineHeight: 1,
              }}>{initial}</span>
              {/* Task name */}
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textDecoration: isCompleted ? 'line-through' : 'none',
                letterSpacing: '0.01em',
              }}>{shortTask}</span>
            </div>
          )
        }}
        height="auto"
      />
    </div>
  )
}

