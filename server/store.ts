import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { redisRest } from './env.ts'
import { defaultLockState, type LockState } from './types.ts'

const KEY = 'holikar:system-lock'
const FILE = resolve(process.cwd(), 'data', 'system-lock.json')

let memory = defaultLockState()

export type StoreKind = 'redis' | 'file' | 'memory'

export function storeKind(): StoreKind {
  if (redisRest()) return 'redis'
  if (!process.env.VERCEL) return 'file'
  return 'memory'
}

export async function readLock(): Promise<LockState> {
  const kind = storeKind()
  if (kind === 'redis') {
    const redis = redisRest()
    if (!redis) return defaultLockState()
    const value = await redisGet(redis.url, redis.token, KEY)
    if (!value) return defaultLockState()
    try {
      return { ...defaultLockState(), ...(JSON.parse(value) as LockState) }
    } catch {
      return defaultLockState()
    }
  }
  if (kind === 'file') {
    if (!existsSync(FILE)) return defaultLockState()
    try {
      return { ...defaultLockState(), ...(JSON.parse(readFileSync(FILE, 'utf8')) as LockState) }
    } catch {
      return defaultLockState()
    }
  }
  return memory
}

export async function writeLock(next: LockState): Promise<StoreKind> {
  const kind = storeKind()
  if (kind === 'redis') {
    const redis = redisRest()
    if (!redis) throw new Error('Redis is not configured')
    await redisSet(redis.url, redis.token, KEY, JSON.stringify(next))
    return kind
  }
  if (kind === 'file') {
    mkdirSync(dirname(FILE), { recursive: true })
    writeFileSync(FILE, JSON.stringify(next, null, 2), 'utf8')
    return kind
  }
  memory = next
  return kind
}

async function redisCommand(url: string, token: string, command: unknown[]): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error('Redis command failed')
  const data = (await res.json()) as { result?: unknown }
  return data.result ?? null
}

async function redisGet(url: string, token: string, key: string): Promise<string | null> {
  try {
    const result = await redisCommand(url, token, ['GET', key])
    return typeof result === 'string' ? result : null
  } catch {
    return null
  }
}

async function redisSet(url: string, token: string, key: string, value: string) {
  await redisCommand(url, token, ['SET', key, value])
}
