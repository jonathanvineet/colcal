
'use client'

import { useState, useEffect } from 'react'
import { fetchMyProfile, saveProfile } from '../lib/db'

export default function ProfileSettings() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        if (data?.display_name) {
          setDisplayName(data.display_name)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await saveProfile(displayName)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Profile Settings
      </h3>
      <p className="muted" style={{ margin: '0 0 16px 0' }}>
        Set how your name appears to others in this workspace.
      </p>
      
      <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., John Doe"
          style={{ flex: 1, padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
        />
        <button 
          type="submit" 
          disabled={saving}
          style={{
            padding: '8px 16px',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Name'}
        </button>
      </form>
      {success && <p style={{ color: 'green', marginTop: '8px', fontSize: '0.9rem' }}>Saved successfully!</p>}
    </div>
  )
}

