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

export default function Calendar({ userId, selectedDate, onDateChange }) {
  const calendarRef = useRef(null)
  const [events, setEvents] = useState([])
  const [eventsLoaded, setEventsLoaded] = useState(false)

  // Load events from DB once userId is available
  useEffect(() => {
    if (!userId) return
    let cancelled = false

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
  }, [userId])

  // Sync calendar view when selectedDate changes externally
  useEffect(() => {
    if (!selectedDate) return

    const api = calendarRef.current?.getApi?.()
    if (!api) return

    const current = api.getDate()
    if (!isSameDay(current, selectedDate)) {
      api.gotoDate(selectedDate)
    }
  }, [selectedDate])

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
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        selectable
        selectMirror
        dayMaxEvents
        editable
        droppable
        events={events}
        select={handleDateSelect}
        dateClick={handleDateClick}
        eventAdd={handleEventAdd}
        eventChange={handleEventChange}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        dayCellClassNames={(arg) => (isSameDay(arg.date, selectedDate) ? ['is-selected-day'] : [])}
        height="auto"
      />
    </div>
  )
}
