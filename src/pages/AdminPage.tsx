import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../lib/id'

type AdminState = {
  user: string
  locked: boolean
  lastClosedAt: number | null
  lastOpenedAt: number | null
  store: string
}

export function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<AdminState | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/admin/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as AdminState
      })
      .then((data) => {
        if (!cancelled && data?.user) setSession(data)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function login(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json()) as AdminState & { error?: string; retryAfter?: number }
      if (!res.ok) {
        if (res.status === 429) setError('יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.')
        else if (res.status === 503) setError('חשבון המנהל עדיין לא הוגדר בשרת.')
        else setError('שם משתמש או סיסמה שגויים.')
        return
      }
      setPassword('')
      setSession(data)
    } catch {
      setError('לא ניתן להתחבר כרגע.')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setSession(null)
  }

  async function setLocked(locked: boolean) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/lock', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked }),
      })
      const data = (await res.json()) as AdminState & { error?: string }
      if (!res.ok) {
        setError('לא ניתן לעדכן את מצב המערכת.')
        return
      }
      setSession((current) =>
        current
          ? {
              ...current,
              locked: data.locked,
              lastClosedAt: data.lastClosedAt,
              lastOpenedAt: data.lastOpenedAt,
              store: data.store,
            }
          : data,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream text-ink">
      <header className="border-b border-line bg-paper px-4 py-3">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Holikar Admin</div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-5 sm:py-12">
        {checking ? (
          <div className="text-sm text-muted">טוען...</div>
        ) : session ? (
          <section className="card min-w-0 overflow-hidden p-4 sm:p-6">
            <h1 className="text-xl font-bold text-navy">מצב המערכת</h1>
            <p className="mt-1 text-xs text-muted">מחובר כ-{session.user}</p>
            <div className="mt-6 rounded-[12px] border border-line bg-cream px-4 py-4">
              <div className="text-lg font-semibold text-navy">
                {session.locked ? '🔴 המערכת סגורה' : '🟢 המערכת פעילה'}
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setLocked(!session.locked)}
              className={session.locked ? 'btn-primary mt-5 w-full' : 'btn-danger mt-5 w-full'}
            >
              {session.locked ? 'פתח את Holikar' : 'סגור את Holikar'}
            </button>
            <div className="mt-6 space-y-1 text-xs text-muted">
              <div>
                המערכת נסגרה בתאריך:{' '}
                {session.lastClosedAt ? formatDateTime(session.lastClosedAt) : '—'}
              </div>
              <div>
                המערכת נפתחה בתאריך:{' '}
                {session.lastOpenedAt ? formatDateTime(session.lastOpenedAt) : '—'}
              </div>
            </div>
            {session.store === 'memory' && (
              <p className="mt-4 text-xs text-watch">
                מצב הנעילה נשמר כרגע בזיכרון השרת בלבד. כדי שיעבוד בין מכשירים ב-Vercel יש להגדיר Redis.
              </p>
            )}
            {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/" className="font-semibold text-navy">
                חזרה לאתר
              </Link>
              <button type="button" className="text-muted" onClick={() => void logout()}>
                Logout
              </button>
            </div>
          </section>
        ) : (
          <form className="card min-w-0 overflow-hidden p-4 sm:p-6" onSubmit={login}>
            <h1 className="text-xl font-bold text-navy">כניסת מנהל</h1>
            <p className="mt-1 text-sm text-muted">גישה למסך ניהול בלבד.</p>
            <label className="mt-5 block text-sm font-semibold text-navy">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field mt-1"
                autoComplete="username"
                required
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-navy">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-1"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
              {busy ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
