import { useAuth } from '../auth/context'
import Calendar from '../components/Calendar'

export default function Home() {
  const { user, signOut } = useAuth()
  return (
    <div className="home">
      <div className="card">
        <h1>Hello {user?.email}</h1>
        <p className="muted">Your calendar is below. Drag, resize, and switch views.</p>
        <div style={{ margin: '12px 0 20px' }}>
          <button className="btn" onClick={() => signOut()}>Sign out</button>
        </div>
        <Calendar userId={user?.id} />
      </div>
    </div>
  )
}
