import type { StatusDefinition } from '../types'
import { cn } from '../lib/id'

export function StatusBadge({
  status,
  className,
}: {
  status: StatusDefinition
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        className,
      )}
      style={{ background: status.bg, color: status.color }}
    >
      {status.shortcut ? <span>{status.shortcut}</span> : null}
      {status.name}
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
  const quick = statuses.filter((status) => status.shortcut)
  const rest = statuses.filter((status) => !status.shortcut)
  return (
    <div className="space-y-2">
      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-3')}>
        {quick.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => onChange(status.id)}
            className={cn(
              'min-h-12 rounded-xl border-2 px-2 py-2 text-sm font-bold',
              value === status.id ? 'border-current shadow-sm' : 'border-transparent opacity-90',
            )}
            style={{ background: status.bg, color: status.color }}
          >
            <div className="text-lg leading-none">{status.shortcut}</div>
            {status.name}
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
                'rounded-full px-3 py-1.5 text-xs font-bold',
                value === status.id ? 'ring-2 ring-navy/30' : '',
              )}
              style={{ background: status.bg, color: status.color }}
            >
              {status.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
