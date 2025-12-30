'use client'

import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'

// Note: FullCalendar v6 injects its styles at runtime into a <style data-fullcalendar> tag.
// Do not import CSS files here; the packages no longer ship main.css files.

function loadEvents(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    // ignore parse errors, return empty events
    return []
  }
}

function saveEvents(storageKey, events) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(events))
  } catch {
    // ignore save errors
  }
}

export default function Calendar({ userId }) {
  const storageKey = useMemo(() => `events:${userId || 'anon'}`, [userId])
  const [events, setEvents] = useState(() => loadEvents(storageKey))

  useEffect(() => {
    saveEvents(storageKey, events)
  }, [storageKey, events])

  const handleDateSelect = (info) => {
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
    }
  }

  const handleEventChange = (changeInfo) => {
    const { event } = changeInfo
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? {
        ...e,
        start: event.start?.toISOString?.() || event.startStr,
        end: event.end?.toISOString?.() || event.endStr,
        allDay: event.allDay,
      } : e))
    )
  }

  const handleEventAdd = (addInfo) => {
    const { event } = addInfo
    // If FullCalendar creates an internal id, ensure we keep ours
    if (!events.find((e) => e.id === event.id)) {
      const newEvent = {
        id: event.id,
        title: event.title,
        start: event.start?.toISOString?.() || event.startStr,
        end: event.end?.toISOString?.() || event.endStr,
        allDay: event.allDay,
      }
      setEvents((prev) => [...prev, newEvent])
    }
  }

  const handleEventClick = (clickInfo) => {
    if (confirm(`Delete event '${clickInfo.event.title}'?`)) {
      const id = clickInfo.event.id
      setEvents((prev) => prev.filter((e) => e.id !== id))
      clickInfo.event.remove()
    }
  }

  return (
    <div className="calendar-wrapper">
      <FullCalendar
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
        eventAdd={handleEventAdd}
        eventChange={handleEventChange}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  )
}
