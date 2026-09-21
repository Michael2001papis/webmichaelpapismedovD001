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
  const activeCell = active
    ? cellOf(inspection, active.room, active.columnId, missing)
    : null
  const activeColumn = columns.find((column) => column.id === active?.columnId)

  return (
    <div className="overflow-auto rounded-3xl bg-paper shadow-sm">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky right-0 bg-navy px-3 py-3 text-right font-bold text-cream">חדר</th>
            {columns.map((column) => (
              <th key={column.id} className="bg-navy px-3 py-3 text-right font-bold text-cream">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inspection.rooms.map((room, index) => (
            <tr key={room} className={index % 2 ? 'bg-cream/40' : 'bg-white'}>
              <td className="sticky right-0 bg-inherit px-3 py-2 font-extrabold text-navy">{room}</td>
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
                        'block w-full rounded-xl px-2 py-2 text-right text-xs font-bold',
                        isActive ? 'ring-2 ring-sea' : '',
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

      {active && activeCell && activeColumn && (
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="font-extrabold">
              חדר {active.room} · {activeColumn.name}
            </div>
            <button type="button" className="text-sm font-bold text-muted" onClick={() => setActive(null)}>
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
      )}
    </div>
  )
}
