'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser, UserButton, useOrganization } from '@clerk/nextjs'
import * as db from '@/lib/db'

function formatTimestamp(dateKey, time) {
  const date = new Date(`${dateKey}T00:00:00`)
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${dateStr} • ${time || 'Anytime'}`
}

export default function TasksExplorerPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const { membership, isLoaded: orgLoaded } = useOrganization()

  const isSuperuser = user?.publicMetadata?.isSuperuser === true
  const isAdmin = isSuperuser || membership?.role === 'org:admin'
  const userDisplayName = user?.fullName || user?.firstName || user?.username || 'Unknown User'

  const [dataLoading, setDataLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [tasksByDate, setTasksByDate] = useState({})
  const [membersByTeam, setMembersByTeam] = useState({})
  const [expandedTeam, setExpandedTeam] = useState(null)
  
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editForm, setEditForm] = useState({ task: '', assignee: '' })

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    
    async function load() {
      setDataLoading(true)
      try {
        const [fetchedTeams, fetchedTasks, fetchedMembers] = await Promise.all([
          db.fetchTeams(),
          db.fetchTasks(),
          db.fetchMembers()
        ])
        if (!cancelled) {
          // Ensure General is always an option at the top
          setTeams([{ name: 'General', color: '#64748b' }, ...fetchedTeams])
          setTasksByDate(fetchedTasks)
          setMembersByTeam(fetchedMembers)
        }
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }
    
    load()
    return () => { cancelled = true }
  }, [user?.id])

  const handleToggleTask = async (task) => {
    const newCompleted = !task.completed
    
    // Optimistic UI
    setTasksByDate(prev => {
      const copy = { ...prev }
      if (copy[task.dateKey]) {
        copy[task.dateKey] = copy[task.dateKey].map(t => 
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
  }

  const handleDeleteTask = async (task) => {
    setTasksByDate(prev => {
      const copy = { ...prev }
      if (copy[task.dateKey]) {
        copy[task.dateKey] = copy[task.dateKey].filter(t => t.id !== task.id)
      }
      return copy
    })
    
    try {
      await db.deleteTask(task.id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const startEdit = (task) => {
    setEditingTaskId(task.id)
    setEditForm({ task: task.task, assignee: task.assignee || '' })
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditForm({ task: '', assignee: '' })
  }

  const saveEdit = async (task) => {
    const updatedTask = { ...task, task: editForm.task, assignee: editForm.assignee }
    
    // Optimistic UI
    setTasksByDate(prev => {
      const copy = { ...prev }
      if (copy[task.dateKey]) {
        copy[task.dateKey] = copy[task.dateKey].map(t => 
          t.id === task.id ? updatedTask : t
        )
      }
      return copy
    })
    
    setEditingTaskId(null)
    
    try {
      await db.updateTask(task.id, { task: editForm.task, assignee: editForm.assignee })
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  // Group tasks by team
  const tasksByTeam = useMemo(() => {
    const map = {}
    teams.forEach(t => { map[t.name] = [] })
    
    Object.entries(tasksByDate).forEach(([dateKey, tasks]) => {
      tasks.forEach(task => {
        const teamName = task.team || 'General'
        if (!map[teamName]) map[teamName] = []
        map[teamName].push({ ...task, dateKey })
      })
    })
    
    // Sort tasks in each team by date descending (newest first)
    Object.values(map).forEach(list => {
      list.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime())
    })
    
    return map
  }, [teams, tasksByDate])

  if (!userLoaded || !orgLoaded) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', color: 'white',
      }}>
        Loading...
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', color: 'white',
      }}>
        Loading tasks…
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
            <h2 style={{ margin: '0 0 8px 0' }}>Tasks Explorer</h2>
            <p className="muted" style={{ margin: 0 }}>
              Track all tasks assigned to your teams and monitor their completion progress.
            </p>
          </div>
          <Link href="/" className="notes-explorer-link">Back To Dashboard</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {teams.map(team => {
            const teamTasks = tasksByTeam[team.name] || []
            const totalTasks = teamTasks.length
            const completedTasks = teamTasks.filter(t => t.completed).length
            const progressPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
            const isExpanded = expandedTeam === team.name

            return (
              <div key={team.name} className="card" style={{ padding: 0, overflow: 'hidden', transition: 'all 0.3s' }}>
                {/* Team Block Header */}
                <div 
                  onClick={() => setExpandedTeam(isExpanded ? null : team.name)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        backgroundColor: team.color,
                        boxShadow: `0 0 12px ${team.color}`,
                        flexShrink: 0
                      }} />
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{team.name}</h3>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--fg-300)' }}>
                      {completedTasks} / {totalTasks} Tasks ({progressPct}%)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${progressPct}%`,
                      background: team.color,
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                </div>

                {/* Expanded Tasks List */}
                {isExpanded && (
                  <div style={{ 
                    padding: '0 20px 20px 20px', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                  }}>
                    {teamTasks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                        {teamTasks.map(task => (
                          <div key={task.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            opacity: task.completed ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}>
                            <div style={{ marginTop: '2px' }}>
                              <input
                                type="checkbox"
                                checked={task.completed || false}
                                disabled={!isAdmin && task.assignee !== userDisplayName}
                                onChange={() => handleToggleTask(task)}
                                style={{
                                  cursor: (!isAdmin && task.assignee !== userDisplayName) ? 'not-allowed' : 'pointer',
                                  width: '18px',
                                  height: '18px',
                                  accentColor: team.color,
                                  opacity: (!isAdmin && task.assignee !== userDisplayName) ? 0.5 : 1
                                }}
                              />
                            </div>
                            
                            {editingTaskId === task.id ? (
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input 
                                  value={editForm.task}
                                  onChange={e => setEditForm({...editForm, task: e.target.value})}
                                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--line-600)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                />
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <select
                                    value={editForm.assignee}
                                    onChange={e => setEditForm({...editForm, assignee: e.target.value})}
                                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--line-600)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                  >
                                    <option value="">Unassigned</option>
                                    {(membersByTeam[team.name] || []).map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => saveEdit(task)} className="task-add-submit" style={{ padding: '4px 12px', minHeight: 'auto' }}>Save</button>
                                  <button onClick={cancelEdit} className="member-remove-btn" style={{ width: 'auto', padding: '4px 12px', fontSize: '12px' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '12px', color: 'var(--fg-500)', marginBottom: '4px' }}>
                                    {formatTimestamp(task.dateKey, task.time)}
                                    {task.assignee && ` • Assigned to: ${task.assignee}`}
                                  </div>
                                  <div style={{ 
                                    fontSize: '15px', 
                                    color: 'var(--fg-100)',
                                    textDecoration: task.completed ? 'line-through' : 'none'
                                  }}>
                                    {task.task}
                                  </div>
                                </div>
                                {isAdmin && (
                                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                                    <button 
                                      onClick={() => startEdit(task)} 
                                      style={{ background: 'transparent', border: '1px solid var(--line-600)', color: 'var(--fg-300)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTask(task)} 
                                      className="member-remove-btn" 
                                      title="Delete Task" 
                                    >
                                      &times;
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted" style={{ marginTop: '20px', textAlign: 'center' }}>
                        No tasks assigned to {team.name} yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
