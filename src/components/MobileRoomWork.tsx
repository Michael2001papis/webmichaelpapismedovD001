import { useEffect, useMemo, useState } from 'react'
import type { Inspection, StatusDefinition } from '../types'
import { markRoomStatus, setCell } from '../lib/db'
import { cellOf, emptyStatusId } from '../lib/stats'
import { groupRoomsByFloor } from '../lib/rooms'
import { CellNote } from './CellNote'
import { StatusBadge, StatusPicker } from './StatusBadge'

export function MobileRoomWork({
  inspection,
  statuses,
}: {
  inspection: Inspection
  statuses: StatusDefinition[]
}) {
  const missing = emptyStatusId(statuses)
  const okId = statuses.find((status) => status.id === 'ok')?.id ?? statuses[0]?.id
  const columns = useMemo(
    () => [...inspection.columns].sort((a, b) => a.order - b.order),
    [inspection.columns],
  )
  const [query, setQuery] = useState('')
  const [room, setRoom] = useState(inspection.rooms[0] ?? '')

  useEffect(() => {
    if (!inspection.rooms.includes(room)) setRoom(inspection.rooms[0] ?? '')
  }, [inspection.rooms, room])

  const rooms = inspection.rooms.filter((item) => item.includes(query.trim()))
  const grouped = groupRoomsByFloor(rooms)
  const roomIndex = inspection.rooms.indexOf(room)

  function go(delta: number) {
    const next = inspection.rooms[roomIndex + delta]
    if (next) setRoom(next)
  }

  function nextIncomplete() {
    const start = Math.max(roomIndex, 0)
    const ordered = [...inspection.rooms.slice(start + 1), ...inspection.rooms.slice(0, start + 1)]
    const found = ordered.find((item) =>
      columns.some((column) => cellOf(inspection, item, column.id, missing).statusId === missing),
    )
    if (found) setRoom(found)
  }

  async function markRoomOk() {
    if (!okId) return
    await markRoomStatus(inspection.id, room, okId)
    go(1)
  }

  if (!inspection.rooms.length) {
    return <div className="rounded-3xl bg-paper p-4 text-sm text-muted">אין חדרים להצגה.</div>
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש מספר חדר"
        className="w-full rounded-2xl border border-slate-200 bg-paper px-4 py-3 text-base"
        inputMode="numeric"
      />

      <div className="flex gap-2 overflow-auto pb-1">
        {grouped.map((group) => (
          <div key={String(group.floor)} className="min-w-max">
            <div className="mb-1 text-[11px] font-bold text-muted">
              {group.floor ? `קומה ${group.floor}` : 'אחר'}
            </div>
            <div className="flex gap-1">
              {group.rooms.map((item) => {
                const done = columns.every(
                  (column) => cellOf(inspection, item, column.id, missing).statusId !== missing,
                )
                const bad = columns.some((column) => {
                  const statusId = cellOf(inspection, item, column.id, missing).statusId
                  return statusId === 'bad' || statusId === 'watch'
                })
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRoom(item)}
                    className={
                      item === room
                        ? 'rounded-xl bg-navy px-3 py-2 text-sm font-extrabold text-cream'
                        : bad
                          ? 'rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-800'
                          : done
                            ? 'rounded-xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800'
                            : 'rounded-xl bg-paper px-3 py-2 text-sm font-bold'
                    }
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-paper p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => go(-1)} className="rounded-full bg-cream px-3 py-2 text-sm font-bold">
            הקודם
          </button>
          <div className="text-center">
            <div className="text-xs font-bold text-muted">חדר</div>
            <div className="text-3xl font-black text-navy">{room}</div>
          </div>
          <button type="button" onClick={() => go(1)} className="rounded-full bg-cream px-3 py-2 text-sm font-bold">
            הבא
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {okId && (
            <button
              type="button"
              onClick={() => void markRoomOk()}
              className="rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white"
            >
              הכל תקין והמשך
            </button>
          )}
          <button
            type="button"
            onClick={nextIncomplete}
            className="rounded-2xl bg-cream py-3 text-sm font-extrabold text-navy"
          >
            דלג לחדר חסר
          </button>
        </div>

        <div className="space-y-4">
          {columns.map((column) => {
            const cell = cellOf(inspection, room, column.id, missing)
            const status = statuses.find((item) => item.id === cell.statusId)
            const showNote = cell.statusId === 'bad' || cell.statusId === 'watch' || Boolean(cell.note)
            return (
              <div key={column.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-extrabold">{column.name}</div>
                  {status ? <StatusBadge status={status} /> : null}
                </div>
                <StatusPicker
                  statuses={statuses}
                  value={cell.statusId}
                  onChange={(statusId) => void setCell(inspection.id, room, column.id, statusId)}
                />
                {showNote && (
                  <CellNote
                    inspectionId={inspection.id}
                    room={room}
                    columnId={column.id}
                    statusId={cell.statusId}
                    note={cell.note}
                    placeholder="הערה לחדר זה"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
