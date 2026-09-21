export type LockState = {
  locked: boolean
  lastClosedAt: number | null
  lastOpenedAt: number | null
  updatedBy: string | null
}

export const defaultLockState = (): LockState => ({
  locked: false,
  lastClosedAt: null,
  lastOpenedAt: null,
  updatedBy: null,
})

export type ApiRequest = {
  method: string
  path: string
  headers: Record<string, string | string[] | undefined>
  body: unknown
  ip: string
  cookies: Record<string, string>
}

export type CookieOptions = {
  httpOnly: boolean
  secure: boolean
  sameSite: 'Lax' | 'Strict'
  path: string
  maxAge: number
}

export type ApiResponse = {
  status: number
  body: unknown
  cookies?: Array<{ name: string; value: string; options: CookieOptions }>
}
