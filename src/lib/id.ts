/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { dateLocale } from '../i18n'
import type { Locale } from '../i18n/types'

export function uid(): string {
  return crypto.randomUUID()
}

export function cellKey(room: string, columnId: string): string {
  return `${room}::${columnId}`
}

export function formatDateTime(ts: number, locale: Locale = 'he'): string {
  return new Date(ts).toLocaleString(dateLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(ts: number, locale: Locale = 'he'): string {
  return new Date(ts).toLocaleDateString(dateLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'holikar'
}
