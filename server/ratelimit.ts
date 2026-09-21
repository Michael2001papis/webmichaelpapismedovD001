type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8

export function loginAllowed(ip: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const current = buckets.get(ip)
  if (!current || current.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (current.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  }
  current.count += 1
  return { ok: true }
}

export function clearLoginAttempts(ip: string) {
  buckets.delete(ip)
}
