'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export default function SuperuserDashboard() {
  const { user, isLoaded } = useUser()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoaded || !user) return;

    if (user.id !== process.env.NEXT_PUBLIC_SUPERUSER_ID) {
      setError('Access Denied. You are not a superuser.')
      setLoading(false)
      return;
    }

    async function loadOrgs() {
      try {
        const res = await fetch('/api/db/admin/orgs')
        if (!res.ok) throw new Error('Failed to fetch orgs')
        const data = await res.json()
        setOrgs(data.orgs || [])
      } catch(err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrgs()
  }, [user, isLoaded])

  if (!isLoaded || loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Superuser Dashboard</h1>
        <UserButton />
      </div>

      <div className="card">
        <h2>Registered Workspaces (Organizations)</h2>
        <p className="muted">Select an organization to impersonate and view its dashboard.</p>
        
        <div style={{ marginTop: '1rem' }}>
          {orgs.length === 0 ? (
            <p>No active organizations found in the database.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-700)' }}>
                  <th style={{ padding: '10px' }}>Organization ID</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.org_id} style={{ borderBottom: '1px solid var(--line-700)' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                      {org.org_id || 'Personal Accounts (null)'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        className="task-add-submit" 
                        onClick={() => window.open('/?superOrgId=' + (org.org_id || 'personal'), '_blank')}
                      >
                        View Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
