/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { FileSpreadsheet } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { workflowLabel } from '../i18n'
import { db } from '../lib/db'
import { formatDateTime } from '../lib/id'
import { useSession } from '../lib/sessionContext'
import { computeInspectionStats } from '../lib/stats'

export function ReportsPage() {
  const { t, locale } = useSession()
  const inspections = useLiveQuery(() => db.inspections.orderBy('updatedAt').reverse().toArray()) ?? []
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []

  const totals = inspections.reduce(
    (acc, inspection) => {
      const stats = computeInspectionStats(inspection, statuses)
      acc.rooms += stats.checkedRooms
      acc.bad += stats.byStatus.bad ?? 0
      acc.watch += stats.byStatus.watch ?? 0
      return acc
    },
    { rooms: 0, bad: 0, watch: 0 },
  )

  return (
    <div className="holikar-stack space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">{t('reports.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('reports.lead')}</p>
      </div>

      <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <Summary label={t('reports.inArchive')} value={inspections.length} />
        <Summary label={t('reports.roomsChecked')} value={totals.rooms} />
        <Summary label={t('reports.openIssues')} value={totals.bad} tone="bad" />
        <Summary label={t('reports.watch')} value={totals.watch} tone="watch" />
      </section>

      {inspections.length === 0 ? (
        <div className="card p-6 text-sm text-muted">{t('reports.empty')}</div>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => {
            const stats = statuses.length ? computeInspectionStats(inspection, statuses) : null
            return (
              <article key={inspection.id} className="card min-w-0 overflow-hidden p-3 sm:p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/inspection/${inspection.id}`} className="text-base font-semibold break-words text-navy sm:text-lg">
                      {inspection.name}
                    </Link>
                    <div className="mt-1 text-xs leading-5 text-muted">
                      {formatDateTime(inspection.createdAt, locale)} · {inspection.performer} · {inspection.hotel}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {t('reports.rooms', { n: inspection.rooms.length })} · {workflowLabel(locale, inspection.workflowStatus)}
                      {stats
                        ? ` · ${t('reports.badWatch', { bad: stats.byStatus.bad ?? 0, watch: stats.byStatus.watch ?? 0 })}`
                        : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <button
                      type="button"
                      className="btn-secondary w-full px-3 text-sm sm:w-auto"
                      onClick={() => {
                        void import('../lib/exportExcel').then(({ exportInspectionExcel }) => {
                          exportInspectionExcel(inspection, statuses, locale)
                        })
                      }}
                    >
                      <FileSpreadsheet size={14} strokeWidth={1.7} />
                      Excel
                    </button>
                    <Link to={`/inspection/${inspection.id}`} className="btn-primary w-full px-3 text-sm sm:w-auto">
                      {t('reports.open')}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'bad' | 'watch'
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
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
