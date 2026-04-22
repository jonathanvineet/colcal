'use client'

import { useMemo, useState } from 'react'

function toInputDateValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

export default function ExpandableDatePicker({ selectedDate, onDateChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const inputValue = useMemo(() => toInputDateValue(selectedDate), [selectedDate])

  function handleDateChange(event) {
    const value = event.target.value
    if (!value) {
      return
    }
    onDateChange(new Date(`${value}T00:00:00`))
  }

  function handleTodayClick() {
    onDateChange(new Date())
    setIsOpen(false)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--line-600)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          color: 'var(--fg-100)',
          borderRadius: 10,
          padding: '10px 12px'
        }}
      >
        <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 12 }}>
          Choose Date
        </span>
        <span style={{ fontSize: 14 }}>{isOpen ? 'Hide' : 'Open'}</span>
      </button>

      <div
        style={{
          marginTop: 10,
          maxHeight: isOpen ? 120 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
          border: isOpen ? '1px solid var(--line-600)' : '1px solid transparent',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          padding: isOpen ? 12 : 0
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={inputValue}
            onChange={handleDateChange}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleTodayClick}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--line-600)',
              borderRadius: 8,
              background: 'var(--bg-800)',
              color: 'var(--fg-100)'
            }}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  )
}