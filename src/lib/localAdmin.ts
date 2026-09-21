const LOCK_KEY = 'holikar-system-lock'
const SESSION_KEY = 'holikar-admin-session'
const SESSION_MS = 8 * 60 * 60 * 1000

export const LOCK_EVENT = 'holikar-lock-change'

export type LocalLock = {
  locked: boolean
  lastClosedAt: number | null
  lastOpenedAt: number | null
}

function emptyLock(): LocalLock {
  return { locked: false, lastClosedAt: null, lastOpenedAt: null }
}

export function readLocalLock(): LocalLock {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return emptyLock()
    const data = JSON.parse(raw) as Partial<LocalLock>
    return {
      locked: Boolean(data.locked),
      lastClosedAt: typeof data.lastClosedAt === 'number' ? data.lastClosedAt : null,
      lastOpenedAt: typeof data.lastOpenedAt === 'number' ? data.lastOpenedAt : null,
    }
  } catch {
    return emptyLock()
  }
}

export function writeLocalLock(locked: boolean): LocalLock {
  const prev = readLocalLock()
  const now = Date.now()
  const next: LocalLock = {
    locked,
    lastClosedAt: locked ? now : prev.lastClosedAt,
    lastOpenedAt: locked ? prev.lastOpenedAt : now,
  }
  localStorage.setItem(LOCK_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(LOCK_EVENT))
  return next
}

export function localLogin(username: string, password: string): boolean {
  const ok = username.trim().toLowerCase() === 'miki' && password === '123456'
  if (!ok) return false
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ user: 'Miki', exp: Date.now() + SESSION_MS }),
  )
  return true
}

export function localSession(): { user: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { user?: string; exp?: number }
    if (!data.user || typeof data.exp !== 'number' || data.exp < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return { user: data.user }
  } catch {
    return null
  }
}

export function localLogout() {
  localStorage.removeItem(SESSION_KEY)
}
