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
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { workflowLabel } from '../i18n'
import { db } from '../lib/db'
import { formatDateTime } from '../lib/id'
import { useSession } from '../lib/sessionContext'
import { computeInspectionStats } from '../lib/stats'

export function ArchivePage() {
  const { t, locale } = useSession()
  const inspections = useLiveQuery(() => db.inspections.orderBy('updatedAt').reverse().toArray()) ?? []
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () =>
      inspections.filter((inspection) =>
        `${inspection.name} ${inspection.performer} ${inspection.rooms.join(' ')}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [inspections, query],
  )

  return (
    <div className="holikar-stack space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">{t('archive.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('archive.lead')}</p>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('archive.search')}
        className="field"
      />
      {filtered.length === 0 ? (
        <div className="card p-6 text-muted">{t('archive.empty')}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inspection) => {
            const stats = statuses.length ? computeInspectionStats(inspection, statuses) : null
            const hasIssues = (stats?.byStatus.bad ?? 0) > 0 || (stats?.byStatus.watch ?? 0) > 0
            return (
              <div key={inspection.id} className={`card min-w-0 overflow-hidden p-3 sm:p-4 ${hasIssues ? 'border-bad/25' : ''}`}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/inspection/${inspection.id}`} className="text-base font-semibold break-words text-navy sm:text-lg">
                      {inspection.name}
                    </Link>
                    <div className="mt-1 text-xs leading-5 text-muted">
                      {formatDateTime(inspection.createdAt, locale)} · {inspection.performer} ·{' '}
                      {t('archive.rooms', { n: inspection.rooms.length })} · {workflowLabel(locale, inspection.workflowStatus)}
                      {stats ? ` · ${t('archive.bad', { n: stats.byStatus.bad ?? 0 })}` : ''}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-muted">
                      {t('archive.roomsLabel')} {inspection.rooms.slice(0, 12).join(', ')}
                      {inspection.rooms.length > 12 ? '…' : ''}
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
                      {t('archive.open')}
                    </Link>
                  </div>
                </div>
                {stats && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full bg-navy"
                      style={{ width: `${stats.totalRooms ? (stats.checkedRooms / stats.totalRooms) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
