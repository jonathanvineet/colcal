'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser, UserButton, useOrganization } from '@clerk/nextjs'
import * as db from '@/lib/db'
import { UploadButton } from '@/utils/uploadthing'
import imageCompression from 'browser-image-compression'

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

  const [activeTaskForDetails, setActiveTaskForDetails] = useState(null)
  const [detailsDraft, setDetailsDraft] = useState('')
  const [attachmentsDraft, setAttachmentsDraft] = useState([])

  const handleOpenDetails = (task) => {
    setActiveTaskForDetails(task)
    setDetailsDraft(task.details || '')
    setAttachmentsDraft(task.attachments || [])
  }

  const handleCloseDetails = () => {
    setActiveTaskForDetails(null)
    setDetailsDraft('')
    setAttachmentsDraft([])
  }

  const handleSaveDetails = async () => {
    if (!activeTaskForDetails) return
    const task = activeTaskForDetails
    const newDetails = detailsDraft
    const newAttachments = attachmentsDraft

    setTasksByDate(prev => {
      const copy = { ...prev }
      if (copy[task.dateKey]) {
        copy[task.dateKey] = copy[task.dateKey].map(t => 
          t.id === task.id ? { ...t, details: newDetails, attachments: newAttachments } : t
        )
      }
      return copy
    })
    
    handleCloseDetails()

    try {
      await db.updateTask(task.id, { details: newDetails, attachments: newAttachments })
    } catch (err) {
      console.error('Failed to update task details:', err)
    }
  }

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
                                <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                                  <button
                                    onClick={() => handleOpenDetails(task)}
                                    title="Proof & Details"
                                    style={{
                                      background: 'transparent', border: '1px solid var(--line-600)',
                                      color: 'var(--fg-300)', padding: '4px 8px', borderRadius: '4px',
                                      fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    Details
                                  </button>
                                  {isAdmin && (
                                    <>
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
                                    </>
                                  )}
                                </div>
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

      {/* Document Editor Modal */}
      {activeTaskForDetails && (() => {
        const canEdit = isAdmin || activeTaskForDetails.assignee === userDisplayName;
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '40vw', minWidth: '500px', height: '80vh',
              backgroundColor: 'var(--bg-800)',
              borderRadius: '12px',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05), 0 30px 80px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid var(--line-600)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'var(--bg-900)'
              }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--fg-100)', fontSize: '16px', fontWeight: 600 }}>Task Proof & Details</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--fg-500)', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeTaskForDetails.task}
                  </p>
                </div>
                <button onClick={handleCloseDetails} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--fg-500)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--fg-100)'} onMouseOut={(e) => e.target.style.color = 'var(--fg-500)'}>&times;</button>
              </div>
              
              {/* Editor Area */}
              <textarea
                value={detailsDraft}
                onChange={(e) => setDetailsDraft(e.target.value)}
                placeholder={canEdit ? "Type your notes, attach proof links, or add extra instructions here..." : "No details provided for this task."}
                readOnly={!canEdit}
                style={{
                  flex: 1, width: '100%', padding: '32px 48px',
                  border: 'none', outline: 'none',
                  resize: 'none',
                  fontSize: '15px', lineHeight: '1.8',
                  color: 'var(--fg-100)', backgroundColor: canEdit ? 'var(--bg-800)' : 'rgba(255, 255, 255, 0.02)',
                  fontFamily: 'var(--font-sans), system-ui, sans-serif'
                }}
              />

              {/* Attachments Gallery */}
              {attachmentsDraft.length > 0 && (
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--line-600)',
                  backgroundColor: 'var(--bg-900)',
                  display: 'flex', gap: '12px', flexWrap: 'wrap'
                }}>
                  {attachmentsDraft.map((att, i) => (
                    <div key={att.fileKey || i} style={{
                      position: 'relative',
                      width: '100px', height: '100px',
                      borderRadius: '8px',
                      border: '1px solid var(--line-600)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-800)'
                    }}>
                      <a href={att.ufsUrl || att.url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                        {att.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img src={att.ufsUrl || att.url} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '8px', color: 'var(--fg-300)', textAlign: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <span style={{ fontSize: '10px', marginTop: '4px', wordBreak: 'break-all', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{att.name}</span>
                          </div>
                        )}
                      </a>
                      {canEdit && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (confirm('Remove this attachment?')) {
                              if (att.fileKey) {
                                try {
                                  await fetch('/api/uploadthing/delete', { method: 'POST', body: JSON.stringify({ fileKey: att.fileKey }) });
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                              setAttachmentsDraft(prev => prev.filter((_, idx) => idx !== i));
                            }
                          }}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            width: '20px', height: '20px', borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '14px', lineHeight: '1'
                          }}
                          title="Remove Attachment"
                        >&times;</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--line-600)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'var(--bg-900)'
              }}>
                <div>
                  {canEdit && (
                    <UploadButton
                      endpoint="taskAttachment"
                      onBeforeUploadBegin={async (files) => {
                        const compressedFiles = await Promise.all(
                          files.map(async (file) => {
                            if (!file.type.startsWith('image/')) return file;
                            try {
                              const options = {
                                maxSizeMB: 1,
                                maxWidthOrHeight: 1920,
                                useWebWorker: true,
                              };
                              const compressedBlob = await imageCompression(file, options);
                              return new File([compressedBlob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                              });
                            } catch (error) {
                              console.error("Compression error:", error);
                              return file;
                            }
                          })
                        );
                        return compressedFiles;
                      }}
                      onClientUploadComplete={(res) => {
                        if (res && res.length > 0) {
                          setAttachmentsDraft(prev => [
                            ...prev,
                            ...res.map(f => ({
                              name: f.name,
                              ufsUrl: f.ufsUrl || f.serverData?.url || f.url,
                              fileKey: f.key || f.fileKey,
                              size: f.size
                            }))
                          ]);
                        }
                      }}
                      onUploadError={(error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                      appearance={{
                        button: {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--line-600)',
                          color: 'var(--fg-300)',
                          padding: '4px 12px',
                          fontSize: '13px',
                          borderRadius: '6px',
                          height: 'auto',
                          minHeight: 'auto',
                          fontWeight: 500,
                          cursor: 'pointer'
                        },
                        allowedContent: { display: 'none' }
                      }}
                      content={{
                        button({ ready, isUploading }) {
                          if (isUploading) return "Uploading...";
                          if (ready) return "Attach File";
                          return "Getting ready...";
                        },
                      }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCloseDetails} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--line-600)', backgroundColor: 'var(--bg-800)', color: 'var(--fg-300)', cursor: 'pointer', fontWeight: 500 }}>
                    {canEdit ? 'Cancel' : 'Close'}
                  </button>
                  {canEdit && (
                    <button onClick={handleSaveDetails} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(100, 108, 255, 0.4)', backgroundColor: 'rgba(100, 108, 255, 0.1)', color: '#646cff', cursor: 'pointer', fontWeight: 600 }}>
                      Save Document
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
