'use client'

import { useEffect, useMemo, useState, Fragment } from 'react'
import Link from 'next/link'
import { useUser, UserButton, useOrganization } from '@clerk/nextjs'
import * as db from '@/lib/db'
import useSWR from 'swr'
import Skeleton from '@/components/Skeleton'

const fetchReportData = async () => {
  const [fetchedMembers, fetchedTasks] = await Promise.all([
    db.fetchMembers(),
    db.fetchTasks()
  ])
  return { fetchedMembers, fetchedTasks }
}

function formatDateKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MemberReportPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { membership, organization, isLoaded: orgLoaded } = useOrganization()

  const isSuperuser = user?.publicMetadata?.isSuperuser === true
  const isAdmin = isSuperuser || membership?.role === 'org:admin'
  const userDisplayName = user?.fullName || user?.firstName || user?.username || 'Unknown User'

  const activeOrgId = organization?.id || 'personal'

  const { data: dbData, isLoading: swrLoading, error: swrError } = useSWR(user?.id ? `member-report-${activeOrgId}` : null, fetchReportData, {
    revalidateOnFocus: false,
  })

  const dataLoading = swrLoading && !dbData

  const [allMembers, setAllMembers] = useState([])
  const [tasksByDate, setTasksByDate] = useState({})
  
  const [selectedMember, setSelectedMember] = useState('')

  useEffect(() => {
    if (!isAdmin && userDisplayName) {
      setSelectedMember(userDisplayName)
    }
  }, [isAdmin, userDisplayName])

  useEffect(() => {
    if (dbData) {
      const uniqueMembers = new Set()
      Object.values(dbData.fetchedMembers).forEach(teamMembers => {
        teamMembers.forEach(m => uniqueMembers.add(m))
      })
      setAllMembers(Array.from(uniqueMembers).sort())
      setTasksByDate(dbData.fetchedTasks)
    }
  }, [dbData])

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

  if (!userLoaded || !orgLoaded || (dataLoading && !dbData)) {
    return (
      <div className="home-page notes-page print-container">
        <div className="header-bar no-print">
          <h1>Colcal</h1>
        </div>
        <div className="home-container notes-page-container print-content">
          <div className="card notes-page-title-card no-print">
            <div>
              <h2 style={{ margin: '0 0 8px 0' }}>Member Report</h2>
              <Skeleton width="400px" height="15px" />
            </div>
            <Skeleton width="120px" height="34px" />
          </div>
          <div className="card no-print" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Skeleton width="150px" height="15px" style={{ marginBottom: '8px' }} />
              <Skeleton width="100%" height="45px" />
            </div>
          </div>
          <div className="report-paper">
            <div className="report-header">
              <Skeleton width="300px" height="32px" style={{ marginBottom: '8px' }} />
              <Skeleton width="200px" height="20px" style={{ marginBottom: '4px' }} />
              <Skeleton width="150px" height="15px" />
            </div>
            <div className="report-body">
              <Skeleton width="100%" height="40px" style={{ marginBottom: '10px' }} />
              <Skeleton width="100%" height="40px" style={{ marginBottom: '10px' }} />
              <Skeleton width="100%" height="40px" style={{ marginBottom: '10px' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (swrError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--brand)' }}>
        Failed to load report data.
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
          {isAdmin ? (
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--fg-300)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Team Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="report-select"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px'
                }}
              >
                <option value="">-- Choose a member --</option>
                {allMembers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--fg-300)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Viewing Your Report
              </label>
              <div style={{ fontSize: '16px', color: 'var(--fg-100)', fontWeight: 500 }}>
                {userDisplayName}
              </div>
            </div>
          )}
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
                          <Fragment key={task.id}>
                            <tr>
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
                            {task.details && (
                              <tr>
                                <td></td>
                                <td colSpan="3" style={{ paddingBottom: '16px', paddingTop: 0 }}>
                                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #3b82f6', color: '#4b5563', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    <strong style={{ display: 'block', marginBottom: '4px', color: '#111827' }}>Proof & Details:</strong>
                                    {task.details}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
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
