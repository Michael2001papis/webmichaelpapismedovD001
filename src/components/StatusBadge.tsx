/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import type { StatusDefinition } from '../types'
import { statusLabel } from '../i18n'
import { cn } from '../lib/id'
import { useSession } from '../lib/sessionContext'

export function StatusBadge({
  status,
  className,
}: {
  status: StatusDefinition
  className?: string
}) {
  const { locale } = useSession()
  const label = statusLabel(locale, status)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        className,
      )}
      style={{ background: status.bg, color: status.color }}
    >
      {status.shortcut ? <span>{status.shortcut}</span> : null}
      {label}
    </span>
  )
}

export function StatusPicker({
  statuses,
  value,
  onChange,
  compact = false,
}: {
  statuses: StatusDefinition[]
  value: string
  onChange: (id: string) => void
  compact?: boolean
}) {
  const { locale } = useSession()
  const quick = statuses.filter((status) => status.shortcut)
  const rest = statuses.filter((status) => !status.shortcut)
  return (
    <div className="space-y-2">
      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-2 min-[380px]:grid-cols-3')}>
        {quick.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => onChange(status.id)}
            className={cn(
              'min-h-14 rounded-xl border px-2 py-2 text-xs font-semibold transition-shadow duration-150 sm:text-sm',
              value === status.id ? 'border-current shadow-sm' : 'border-transparent opacity-90',
            )}
            style={{ background: status.bg, color: status.color }}
          >
            <div className="text-base leading-none sm:text-lg">{status.shortcut}</div>
            <span className="mt-1 block leading-tight">{statusLabel(locale, status)}</span>
          </button>
        ))}
      </div>
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => onChange(status.id)}
              className={cn(
                'min-h-10 rounded-full px-3 py-2 text-xs font-semibold',
                value === status.id ? 'ring-2 ring-navy/25' : '',
              )}
              style={{ background: status.bg, color: status.color }}
            >
              {statusLabel(locale, status)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
