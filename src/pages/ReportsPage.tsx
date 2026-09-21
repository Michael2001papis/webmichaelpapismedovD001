import { FileSpreadsheet } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { formatDateTime } from '../lib/id'
import { computeInspectionStats, workflowLabel } from '../lib/stats'

export function ReportsPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">דוחות</h1>
        <p className="mt-1 text-sm text-muted">סיכום הבדיקות השמורות וייצוא Excel מתוך הארכיון הקיים.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        <Summary label="בדיקות בארכיון" value={inspections.length} />
        <Summary label="חדרים שנבדקו" value={totals.rooms} />
        <Summary label="ליקויים פתוחים" value={totals.bad} tone="bad" />
        <Summary label="דורש מעקב" value={totals.watch} tone="watch" />
      </section>

      {inspections.length === 0 ? (
        <div className="card p-6 text-sm text-muted">אין בדיקות ליצירת דוח עדיין.</div>
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
                      {formatDateTime(inspection.createdAt)} · {inspection.performer} · {inspection.hotel}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {inspection.rooms.length} חדרים · {workflowLabel[inspection.workflowStatus]}
                      {stats ? ` · ${stats.byStatus.bad ?? 0} לא תקינים · ${stats.byStatus.watch ?? 0} במעקב` : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <button
                      type="button"
                      className="btn-secondary w-full px-3 text-sm sm:w-auto"
                      onClick={() => {
                        void import('../lib/exportExcel').then(({ exportInspectionExcel }) => {
                          exportInspectionExcel(inspection, statuses)
                        })
                      }}
                    >
                      <FileSpreadsheet size={14} strokeWidth={1.7} />
                      Excel
                    </button>
                    <Link to={`/inspection/${inspection.id}`} className="btn-primary w-full px-3 text-sm sm:w-auto">
                      פתח דוח
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
