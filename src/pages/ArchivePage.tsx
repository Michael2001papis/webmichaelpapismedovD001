import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { formatDateTime } from '../lib/id'
import { computeInspectionStats, workflowLabel } from '../lib/stats'

export function ArchivePage() {
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
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-navy">ארכיון בדיקות</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש לפי שם, חדר או מבצע"
        className="w-full rounded-2xl border border-slate-200 bg-paper px-4 py-3"
      />
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-paper p-6 text-muted">אין בדיקות בארכיון עדיין.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inspection) => {
            const stats = statuses.length ? computeInspectionStats(inspection, statuses) : null
            return (
              <div key={inspection.id} className="rounded-3xl bg-paper p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/inspection/${inspection.id}`} className="text-lg font-black">
                      {inspection.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      {formatDateTime(inspection.createdAt)} · {inspection.performer} · {inspection.rooms.length} חדרים · {workflowLabel[inspection.workflowStatus]}
                      {stats ? ` · ${stats.byStatus.bad ?? 0} לא תקינים` : ''}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-muted">
                      חדרים: {inspection.rooms.slice(0, 12).join(', ')}
                      {inspection.rooms.length > 12 ? '…' : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-cream px-3 py-2 text-xs font-bold"
                      onClick={() => {
                        void import('../lib/exportExcel').then(({ exportInspectionExcel }) => {
                          exportInspectionExcel(inspection, statuses)
                        })
                      }}
                    >
                      Excel
                    </button>
                    <Link to={`/inspection/${inspection.id}`} className="rounded-xl bg-navy px-3 py-2 text-xs font-bold text-cream">
                      פתח
                    </Link>
                  </div>
                </div>
                {stats && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-sea"
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
