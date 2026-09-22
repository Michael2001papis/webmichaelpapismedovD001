/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { AlertTriangle, CheckCircle2, ClipboardList, DoorOpen, Eye } from 'lucide-react'
import type { Inspection, StatusDefinition } from '../types'
import { computeInspectionStats } from '../lib/stats'
import { useSession } from '../lib/sessionContext'
import { StatusBadge } from './StatusBadge'

export function Dashboard({
  inspections,
  statuses,
}: {
  inspections: Inspection[]
  statuses: StatusDefinition[]
}) {
  const { t } = useSession()
  const latest = inspections[0]
  const stats = latest ? computeInspectionStats(latest, statuses) : null

  const totals = inspections.reduce(
    (acc, inspection) => {
      const s = computeInspectionStats(inspection, statuses)
      acc.rooms += s.checkedRooms
      if (inspection.workflowStatus !== 'done') acc.active += 1
      if (inspection.workflowStatus === 'done') acc.done += 1
      for (const status of statuses) acc.byStatus[status.id] = (acc.byStatus[status.id] ?? 0) + (s.byStatus[status.id] ?? 0)
      return acc
    },
    { rooms: 0, active: 0, done: 0, byStatus: {} as Record<string, number> },
  )

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t('dash.active')} value={totals.active} icon={ClipboardList} />
        <StatCard label={t('dash.roomsChecked')} value={totals.rooms} icon={DoorOpen} />
        <StatCard label={t('dash.openIssues')} value={totals.byStatus.bad ?? 0} tone="bad" icon={AlertTriangle} />
        <StatCard label={t('dash.watch')} value={totals.byStatus.watch ?? 0} tone="watch" icon={Eye} />
        <StatCard label={t('dash.done')} value={totals.done} icon={CheckCircle2} />
      </div>

      {latest && stats && (
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t('dash.last')}</div>
              <div className="mt-1 truncate text-base font-semibold text-navy sm:text-lg">{latest.name}</div>
            </div>
            <div className="text-sm text-muted">
              {t('dash.roomsDone', { done: stats.checkedRooms, total: stats.totalRooms })}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2.5">
                <StatusBadge status={status} />
                <div className="text-sm font-semibold text-navy">
                  {stats.byStatus[status.id] ?? 0}
                  <span className="mr-2 text-xs font-medium text-muted">{stats.percents[status.id] ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone?: 'bad' | 'watch'
  icon: typeof ClipboardList
}) {
  return (
    <div className="card min-w-0 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-xs font-medium text-muted">{label}</div>
        <Icon size={16} strokeWidth={1.6} className="shrink-0 text-gold" />
      </div>
      <div
        className={
          tone === 'bad'
            ? 'mt-2 text-2xl font-bold text-bad sm:text-3xl'
            : tone === 'watch'
              ? 'mt-2 text-2xl font-bold text-watch sm:text-3xl'
              : 'mt-2 text-2xl font-bold text-navy sm:text-3xl'
        }
      >
        {value}
      </div>
    </div>
  )
}
