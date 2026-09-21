import { useMemo, useState } from 'react'
import type { Inspection, StatusDefinition } from '../types'
import { setCell } from '../lib/db'
import { cn } from '../lib/id'
import { cellOf, emptyStatusId } from '../lib/stats'
import { CellNote } from './CellNote'
import { StatusPicker } from './StatusBadge'

export function InspectionTable({
  inspection,
  statuses,
}: {
  inspection: Inspection
  statuses: StatusDefinition[]
}) {
  const missing = emptyStatusId(statuses)
  const columns = useMemo(
    () => [...inspection.columns].sort((a, b) => a.order - b.order),
    [inspection.columns],
  )
  const [active, setActive] = useState<{ room: string; columnId: string } | null>(null)
  const activeCell = active ? cellOf(inspection, active.room, active.columnId, missing) : null
  const activeColumn = columns.find((column) => column.id === active?.columnId)

  function editor() {
    if (!active || !activeCell || !activeColumn) return null
    return (
      <div className="border-t border-line p-3 sm:p-4">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 font-semibold break-words text-navy">
            חדר {active.room} · {activeColumn.name}
          </div>
          <button type="button" className="btn-ghost min-h-11 shrink-0 px-3 text-sm" onClick={() => setActive(null)}>
            סגור
          </button>
        </div>
        <StatusPicker
          statuses={statuses}
          value={activeCell.statusId}
          onChange={(statusId) => {
            void setCell(inspection.id, active.room, active.columnId, statusId)
          }}
        />
        <CellNote
          inspectionId={inspection.id}
          room={active.room}
          columnId={active.columnId}
          statusId={activeCell.statusId}
          note={activeCell.note}
          placeholder="הערה, למשל: המים נשארים באזור הכניסה ולא מתנקזים בצורה תקינה."
        />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="space-y-3 lg:hidden">
        {inspection.rooms.map((room) => (
          <article key={room} className="card overflow-hidden p-3">
            <div className="mb-2 text-2xl font-bold text-navy">{room}</div>
            <div className="space-y-2">
              {columns.map((column) => {
                const cell = cellOf(inspection, room, column.id, missing)
                const status = statuses.find((item) => item.id === cell.statusId)
                const isActive = active?.room === room && active?.columnId === column.id
                return (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => setActive({ room, columnId: column.id })}
                    className={cn(
                      'flex min-h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2 text-right',
                      isActive ? 'ring-2 ring-navy/30' : '',
                    )}
                    style={{
                      background: status?.bg ?? '#f3f4f6',
                      color: status?.color ?? '#111',
                    }}
                  >
                    <span className="min-w-0 font-semibold break-words">{column.name}</span>
                    <span className="shrink-0 text-xs font-semibold">{status?.name ?? 'מידע חסר'}</span>
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="card hidden overflow-hidden lg:block">
        <div className="table-scroll">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky right-0 bg-navy px-3 py-3 text-right font-semibold text-paper">חדר</th>
                {columns.map((column) => (
                  <th key={column.id} className="whitespace-nowrap bg-navy px-3 py-3 text-right font-semibold text-paper">
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inspection.rooms.map((room, index) => (
                <tr key={room} className={index % 2 ? 'bg-cream/70' : 'bg-paper'}>
                  <td className="sticky right-0 bg-inherit px-3 py-2.5 text-base font-bold text-navy">{room}</td>
                  {columns.map((column) => {
                    const cell = cellOf(inspection, room, column.id, missing)
                    const status = statuses.find((item) => item.id === cell.statusId)
                    const isActive = active?.room === room && active?.columnId === column.id
                    return (
                      <td key={column.id} className="px-1 py-1">
                        <button
                          type="button"
                          onClick={() => setActive({ room, columnId: column.id })}
                          className={cn(
                            'block min-h-11 w-full min-w-28 rounded-lg px-2 py-2 text-right text-xs font-semibold',
                            isActive ? 'ring-2 ring-navy/30' : '',
                          )}
                          style={{
                            background: status?.bg ?? '#f3f4f6',
                            color: status?.color ?? '#111',
                          }}
                        >
                          <div>{status?.name ?? 'מידע חסר'}</div>
                          {cell.note ? <div className="mt-1 line-clamp-2 font-medium opacity-80">{cell.note}</div> : null}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {active ? <div className="card mt-3 overflow-hidden">{editor()}</div> : null}
    </div>
  )
}
