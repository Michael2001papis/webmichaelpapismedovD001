/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import type { Density, Locale, Session } from '../i18n/types'
import { dirOf } from '../i18n'

const STORAGE_KEY = 'holikar-entry-session'
export const SESSION_MS = 2 * 60 * 60 * 1000

function isLocale(value: unknown): value is Locale {
  return value === 'he' || value === 'ru' || value === 'en'
}

function isDensity(value: unknown): value is Density {
  return value === 'fast' || value === 'regular'
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<Session>
    if (typeof data.name !== 'string' || !data.name.trim()) return null
    if (!isLocale(data.locale) || !isDensity(data.density)) return null
    if (typeof data.expiresAt !== 'number' || data.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return {
      name: data.name.trim(),
      locale: data.locale,
      density: data.density,
      expiresAt: data.expiresAt,
    }
  } catch {
    return null
  }
}

export function writeSession(input: { name: string; locale: Locale; density: Density }): Session {
  const session: Session = {
    name: input.name.trim(),
    locale: input.locale,
    density: input.density,
    expiresAt: Date.now() + SESSION_MS,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  applySessionToDocument(session)
  return session
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function applySessionToDocument(
  session: Session | null,
  locale: Locale = session?.locale ?? 'he',
  density: Density = session?.density ?? 'regular',
) {
  document.documentElement.lang = locale
  document.documentElement.dir = dirOf(locale)
  document.documentElement.dataset.density = density
}
