'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'
import * as db from '@/lib/db'

function formatDateKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MemberReportPage() {
  const { user, isLoaded } = useUser()
  const [dataLoading, setDataLoading] = useState(true)
  const [allMembers, setAllMembers] = useState([])
  const [tasksByDate, setTasksByDate] = useState({})
  
  const [selectedMember, setSelectedMember] = useState('')

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    
    async function load() {
      setDataLoading(true)
      try {
        const [fetchedMembers, fetchedTasks] = await Promise.all([
          db.fetchMembers(),
          db.fetchTasks()
        ])
        if (!cancelled) {
          // Extract unique member names
          const uniqueMembers = new Set()
          Object.values(fetchedMembers).forEach(teamMembers => {
            teamMembers.forEach(m => uniqueMembers.add(m))
          })
          setAllMembers(Array.from(uniqueMembers).sort())
          
          setTasksByDate(fetchedTasks)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }
    
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const memberTasksByDate = useMemo(() => {
    if (!selectedMember) return {}
    
    const result = {}
    
    Object.entries(tasksByDate).forEach(([dateKey, tasks]) => {
      const assigned = tasks.filter(t => t.assignee === selectedMember)
      if (assigned.length > 0) {
        result[dateKey] = assigned
      }
    })
    
    // Sort dates ascending
    const sortedResult = {}
    Object.keys(result).sort().forEach(dateKey => {
      sortedResult[dateKey] = result[dateKey]
    })
    
    return sortedResult
  }, [selectedMember, tasksByDate])

  const handlePrint = () => {
    window.print()
  }

  if (!isLoaded) {
    return (
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', color: 'white',
      }}>
        Loading...
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', color: 'white',
      }}>
        Loading report data…
      </div>
    )
  }

  return (
    <div className="home-page notes-page print-container">
      <div className="header-bar no-print">
        <h1>Colcal</h1>
        {user && <UserButton afterSignOutUrl="/login" />}
      </div>

      <div className="home-container notes-page-container print-content">
        <div className="card notes-page-title-card no-print">
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>Member Report</h2>
            <p className="muted" style={{ margin: 0 }}>
              Generate a printable report of all tasks assigned to a specific individual across all departments.
            </p>
          </div>
          <Link href="/" className="notes-explorer-link">Back To Dashboard</Link>
        </div>

        <div className="card no-print" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--fg-300)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Team Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--line-600)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '15px'
              }}
            >
              <option value="">-- Choose a member --</option>
              {allMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {selectedMember && (
            <button onClick={handlePrint} style={{ marginTop: '24px', minWidth: '140px', background: '#f97316' }}>
              Print / Save PDF
            </button>
          )}
        </div>

        {selectedMember && (
          <div className="report-paper">
            <div className="report-header">
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#111' }}>Task Assignment Report</h1>
              <p style={{ margin: 0, fontSize: '18px', color: '#555' }}>
                <strong>Assignee:</strong> {selectedMember}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#888' }}>
                Generated on: {new Date().toLocaleDateString()}
              </p>
            </div>

            {Object.keys(memberTasksByDate).length > 0 ? (
              <div className="report-body">
                {Object.entries(memberTasksByDate).map(([dateKey, tasks]) => (
                  <div key={dateKey} className="report-date-section">
                    <h3 className="report-date-header">{formatDateKey(dateKey)}</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>Done</th>
                          <th style={{ width: '100px' }}>Time</th>
                          <th style={{ width: '120px' }}>Department</th>
                          <th>Task Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map(task => (
                          <tr key={task.id}>
                            <td style={{ textAlign: 'center' }}>
                              <div className={`print-checkbox ${task.completed ? 'is-checked' : ''}`}>
                                {task.completed && '✓'}
                              </div>
                            </td>
                            <td>{task.time}</td>
                            <td>{task.team || 'General'}</td>
                            <td style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#777' : '#222' }}>
                              {task.task}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666', border: '1px dashed #ccc', borderRadius: '8px', background: 'white' }}>
                <p style={{ margin: 0 }}>No tasks are currently assigned to {selectedMember}.</p>
              </div>
            )}
            
            <div className="report-footer">
              End of Report — Colcal System
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
