/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { DATE_LOCALES, LOCALE_DIR, messages, type MessageKey } from './messages'
import type { Locale } from './types'

export type Vars = Record<string, string | number>

export function t(locale: Locale, key: MessageKey, vars?: Vars): string {
  let text: string = messages[locale][key] ?? messages.he[key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function dirOf(locale: Locale): 'rtl' | 'ltr' {
  return LOCALE_DIR[locale]
}

export function dateLocale(locale: Locale): string {
  return DATE_LOCALES[locale]
}

const STATUS_KEYS: Record<string, MessageKey> = {
  ok: 'status.ok',
  bad: 'status.bad',
  missing: 'status.missing',
  na: 'status.na',
  watch: 'status.watch',
  fixed: 'status.fixed',
}

const DEFAULT_STATUS_NAMES: Record<string, string> = {
  ok: 'תקין',
  bad: 'לא תקין',
  missing: 'מידע חסר',
  na: 'לא רלוונטי',
  watch: 'דורש מעקב',
  fixed: 'טופל',
}

export function statusLabel(locale: Locale, status: { id: string; name: string }): string {
  const key = STATUS_KEYS[status.id]
  if (!key) return status.name
  const original = DEFAULT_STATUS_NAMES[status.id]
  if (original && status.name !== original) return status.name
  return t(locale, key)
}

export function workflowLabel(locale: Locale, status: string): string {
  if (status === 'open') return t(locale, 'workflow.open')
  if (status === 'in_progress') return t(locale, 'workflow.in_progress')
  if (status === 'done') return t(locale, 'workflow.done')
  return status
}

export type { MessageKey }
export { messages }
