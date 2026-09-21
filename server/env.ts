import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let loaded = false

export function loadLocalEnv() {
  if (loaded || process.env.VERCEL) return
  loaded = true
  const file = resolve(process.cwd(), '.env')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index < 1) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function adminUser(): string {
  return (process.env.HOLIKAR_ADMIN_USER ?? '').trim()
}

export function adminPasswordHash(): string {
  return (process.env.HOLIKAR_ADMIN_PASSWORD_HASH ?? '').trim()
}

export function sessionSecret(): string {
  return (process.env.HOLIKAR_SESSION_SECRET ?? '').trim()
}

export function isProduction(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
}

export function redisRest() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  if (!url || !token) return null
  return { url, token }
}
