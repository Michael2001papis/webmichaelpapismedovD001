import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadLocalEnv } from './env.ts'
import { handleApi } from './handlers.ts'
import type { ApiRequest, ApiResponse, CookieOptions } from './types.ts'

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 1) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    out[key] = decodeURIComponent(value)
  }
  return out
}

export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0]!.trim()
  return req.socket.remoteAddress || 'unknown'
}

export function requestPath(url: string | undefined): string {
  if (!url) return '/'
  try {
    return new URL(url, 'http://localhost').pathname
  } catch {
    return url.split('?')[0] || '/'
  }
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  if (chunks.length === 0) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return {}
  }
}

export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
  ]
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}

export function applyResponse(res: ServerResponse, result: ApiResponse) {
  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (result.cookies) {
    res.setHeader(
      'Set-Cookie',
      result.cookies.map((cookie) => serializeCookie(cookie.name, cookie.value, cookie.options)),
    )
  }
  res.end(JSON.stringify(result.body))
}

export async function handleNodeRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const path = requestPath(req.url)
  if (!path.startsWith('/api/')) return false
  loadLocalEnv()
  const request: ApiRequest = {
    method: (req.method || 'GET').toUpperCase(),
    path,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? {} : await readJsonBody(req),
    ip: clientIp(req),
    cookies: parseCookies(typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined),
  }
  try {
    const result = await handleApi(request)
    applyResponse(res, result)
  } catch {
    applyResponse(res, { status: 500, body: { error: 'server_error' } })
  }
  return true
}
