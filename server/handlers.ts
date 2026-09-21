import { adminPasswordHash, adminUser, isProduction, sessionSecret } from './env.ts'
import {
  SESSION_COOKIE,
  SESSION_HOURS,
  newExpiry,
  readSession,
  safeEqual,
  signSession,
  verifyPassword,
} from './crypto.ts'
import { clearLoginAttempts, loginAllowed } from './ratelimit.ts'
import { readLock, storeKind, writeLock } from './store.ts'
import type { ApiRequest, ApiResponse, CookieOptions } from './types.ts'

function cookieOptions(maxAge = SESSION_HOURS * 60 * 60): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'Lax',
    path: '/',
    maxAge,
  }
}

function json(status: number, body: unknown, extra?: Partial<ApiResponse>): ApiResponse {
  return { status, body, ...extra }
}

function sessionFrom(req: ApiRequest) {
  const secret = sessionSecret()
  const token = req.cookies[SESSION_COOKIE]
  if (!secret || !token) return null
  return readSession(token, secret)
}

export async function handleApi(req: ApiRequest): Promise<ApiResponse> {
  const path = req.path.replace(/\/$/, '') || '/'
  if (req.method === 'GET' && path === '/api/system-status') {
    const state = await readLock()
    return json(200, { locked: state.locked })
  }
  if (req.method === 'POST' && path === '/api/admin/login') return login(req)
  if (req.method === 'POST' && path === '/api/admin/logout') return logout()
  if (req.method === 'GET' && path === '/api/admin/me') return me(req)
  if (req.method === 'POST' && path === '/api/admin/lock') return setLock(req)
  return json(404, { error: 'not_found' })
}

async function login(req: ApiRequest): Promise<ApiResponse> {
  const user = adminUser()
  const hash = adminPasswordHash()
  const secret = sessionSecret()
  if (!user || !hash || !secret) {
    return json(503, { error: 'admin_not_configured' })
  }
  const limit = loginAllowed(req.ip)
  if (!limit.ok) {
    return json(429, { error: 'too_many_attempts', retryAfter: limit.retryAfter })
  }
  const body = req.body as { username?: unknown; password?: unknown }
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const userOk = username.length > 0 && safeEqual(username.toLowerCase(), user.toLowerCase())
  const passOk = password.length > 0 && verifyPassword(password, hash)
  if (!userOk || !passOk) {
    return json(401, { error: 'invalid_credentials' })
  }
  clearLoginAttempts(req.ip)
  const token = signSession({ sub: user, exp: newExpiry() }, secret)
  const state = await readLock()
  return json(
    200,
    {
      ok: true,
      user,
      locked: state.locked,
      lastClosedAt: state.lastClosedAt,
      lastOpenedAt: state.lastOpenedAt,
      store: storeKind(),
    },
    {
      cookies: [{ name: SESSION_COOKIE, value: token, options: cookieOptions() }],
    },
  )
}

function logout(): ApiResponse {
  return json(
    200,
    { ok: true },
    {
      cookies: [{ name: SESSION_COOKIE, value: '', options: cookieOptions(0) }],
    },
  )
}

async function me(req: ApiRequest): Promise<ApiResponse> {
  const session = sessionFrom(req)
  if (!session) return json(401, { error: 'unauthorized' })
  const state = await readLock()
  return json(200, {
    user: session.sub,
    locked: state.locked,
    lastClosedAt: state.lastClosedAt,
    lastOpenedAt: state.lastOpenedAt,
    store: storeKind(),
  })
}

async function setLock(req: ApiRequest): Promise<ApiResponse> {
  const session = sessionFrom(req)
  if (!session) return json(401, { error: 'unauthorized' })
  const body = req.body as { locked?: unknown }
  if (typeof body.locked !== 'boolean') return json(400, { error: 'invalid_body' })
  const prev = await readLock()
  const now = Date.now()
  const next = {
    locked: body.locked,
    lastClosedAt: body.locked ? now : prev.lastClosedAt,
    lastOpenedAt: body.locked ? prev.lastOpenedAt : now,
    updatedBy: session.sub,
  }
  try {
    const kind = await writeLock(next)
    return json(200, {
      ok: true,
      locked: next.locked,
      lastClosedAt: next.lastClosedAt,
      lastOpenedAt: next.lastOpenedAt,
      store: kind,
    })
  } catch {
    return json(500, { error: 'persist_failed' })
  }
}
