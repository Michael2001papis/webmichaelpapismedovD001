import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    return <div className="card p-4 text-sm text-muted">אין חדרים להצגה.</div>
  }

  return (
    <div className="min-w-0 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש מספר חדר"
        className="field text-base"
        inputMode="numeric"
      />

      <div className="table-scroll pb-1">
        <div className="flex w-max min-w-full gap-2">
          {grouped.map((group) => (
            <div key={String(group.floor)} className="shrink-0">
              <div className="mb-1 text-[11px] font-medium text-muted">
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
                          ? 'min-h-11 min-w-11 rounded-lg bg-navy px-3 py-2 text-sm font-bold text-paper'
                          : bad
                            ? 'min-h-11 min-w-11 rounded-lg border border-bad/40 bg-paper px-3 py-2 text-sm font-semibold text-bad'
                            : done
                              ? 'min-h-11 min-w-11 rounded-lg border border-ok/30 bg-paper px-3 py-2 text-sm font-semibold text-ok'
                              : 'min-h-11 min-w-11 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-semibold text-navy'
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
      </div>

      <div className="card overflow-hidden p-3 sm:p-4">
        <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button type="button" onClick={() => go(-1)} className="btn-ghost min-h-11 min-w-11 px-2 sm:px-3" aria-label="חדר קודם">
            <ChevronRight size={18} strokeWidth={1.7} />
            <span className="hidden sm:inline">הקודם</span>
          </button>
          <div className="min-w-0 text-center">
            <div className="text-[11px] font-medium tracking-wide text-muted uppercase">חדר</div>
            <div className="truncate text-3xl font-bold leading-none text-navy sm:text-4xl">{room}</div>
          </div>
          <button type="button" onClick={() => go(1)} className="btn-ghost min-h-11 min-w-11 px-2 sm:px-3" aria-label="חדר הבא">
            <span className="hidden sm:inline">הבא</span>
            <ChevronLeft size={18} strokeWidth={1.7} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
          {okId && (
            <button type="button" onClick={() => void markRoomOk()} className="btn-primary min-h-12 py-3 text-sm">
              הכל תקין והמשך
            </button>
          )}
          <button type="button" onClick={nextIncomplete} className="btn-secondary min-h-12 py-3 text-sm">
            דלג לחדר חסר
          </button>
        </div>

        <div className="space-y-4">
          {columns.map((column) => {
            const cell = cellOf(inspection, room, column.id, missing)
            const status = statuses.find((item) => item.id === cell.statusId)
            const showNote = cell.statusId === 'bad' || cell.statusId === 'watch' || Boolean(cell.note)
            const issue = cell.statusId === 'bad' || cell.statusId === 'watch'
            return (
              <div
                key={column.id}
                className={`rounded-[12px] border bg-paper p-3 ${issue ? 'border-bad/35' : 'border-line'}`}
              >
                <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0 font-semibold break-words text-navy">{column.name}</div>
                  {status ? <StatusBadge status={status} className="shrink-0" /> : null}
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
