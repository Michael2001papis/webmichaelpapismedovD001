/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { dirOf, t, type MessageKey, type Vars } from '../i18n'
import type { Density, Locale, Session } from '../i18n/types'
import { applySessionToDocument, clearSession, readSession, writeSession } from './session'
import { db } from './db'

type SessionApi = {
  session: Session | null
  locale: Locale
  dir: 'rtl' | 'ltr'
  density: Density
  t: (key: MessageKey, vars?: Vars) => string
  enter: (input: { name: string; locale: Locale; density: Density }) => Promise<void>
  switchUser: () => void
}

const SessionContext = createContext<SessionApi | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const current = readSession()
    applySessionToDocument(current)
    return current
  })

  const api = useMemo<SessionApi>(() => {
    const locale = session?.locale ?? 'he'
    return {
      session,
      locale,
      dir: dirOf(locale),
      density: session?.density ?? 'regular',
      t: (key, vars) => t(locale, key, vars),
      enter: async (input) => {
        const next = writeSession(input)
        const settings = await db.settings.get('main')
        if (settings) await db.settings.put({ ...settings, performer: next.name })
        setSession(next)
      },
      switchUser: () => {
        clearSession()
        applySessionToDocument(null)
        setSession(null)
      },
    }
  }, [session])

  return <SessionContext value={api}>{children}</SessionContext>
}

export function useSession(): SessionApi {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}
