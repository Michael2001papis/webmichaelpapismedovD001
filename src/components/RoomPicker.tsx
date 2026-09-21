/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { useMemo, useState } from 'react'
import { HOTEL_RANGES, floorRooms, uniqueRooms } from '../lib/rooms'

export function RoomPicker({
  hotelRooms,
  value,
  onChange,
}: {
  hotelRooms: string[]
  value: string[]
  onChange: (rooms: string[]) => void
}) {
  const [from, setFrom] = useState('201')
  const [to, setTo] = useState('220')
  const [manual, setManual] = useState('')
  const selected = useMemo(() => uniqueRooms(value), [value])

  function add(rooms: string[]) {
    onChange(uniqueRooms([...selected, ...rooms]))
  }

  function applyManual() {
    const rooms = manual
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
    if (rooms.length) add(rooms)
    setManual('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-full bg-navy px-3 py-2 text-xs font-semibold text-paper"
          onClick={() => onChange(hotelRooms)}
        >
          כל חדרי המלון
        </button>
        {HOTEL_RANGES.map((range) => (
          <button
            key={range.floor}
            type="button"
            className="rounded-full bg-cream px-3 py-2 text-xs font-semibold text-navy min-h-11"
            onClick={() => add(floorRooms(range.floor))}
          >
            קומה {range.floor}
          </button>
        ))}
        <button
          type="button"
          className="min-h-11 rounded-full bg-white px-3 py-2 text-xs font-bold text-muted"
          onClick={() => onChange([])}
        >
          נקה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
        <label className="text-xs font-semibold text-muted">
          מ-
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="field mt-1 block w-full sm:w-24"
            inputMode="numeric"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          עד
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="field mt-1 block w-full sm:w-24"
            inputMode="numeric"
          />
        </label>
        <button
          type="button"
          className="btn-primary col-span-2 w-full px-4 text-sm sm:col-auto sm:w-auto"
          onClick={() => add(rangeRooms(from, to))}
        >
          הוסף טווח
        </button>
      </div>

      <div className="flex min-w-0 gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applyManual()
            }
          }}
          placeholder="חדרים: 201 217 241"
          className="field min-w-0 flex-1"
        />
        <button
          type="button"
          className="btn-primary shrink-0 px-3 text-sm sm:px-4"
          onClick={applyManual}
        >
          הוסף
        </button>
      </div>

      <div className="text-xs font-semibold text-muted">{selected.length} חדרים נבחרו</div>
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-auto">
        {selected.map((room) => (
          <button
            key={room}
            type="button"
            className="min-h-11 rounded-lg bg-cream px-3 py-2 text-xs font-bold text-navy"
            onClick={() => onChange(selected.filter((item) => item !== room))}
            title="הסר חדר"
          >
            {room} ×
          </button>
        ))}
      </div>
    </div>
  )
}

function rangeRooms(from: string, to: string): string[] {
  const start = Number(from)
  const end = Number(to)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return []
  const lo = Math.min(start, end)
  const hi = Math.max(start, end)
  const rooms: string[] = []
  for (let n = lo; n <= hi; n += 1) rooms.push(String(n))
  return rooms
}
