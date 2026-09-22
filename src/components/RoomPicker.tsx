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
import { useSession } from '../lib/sessionContext'

export function RoomPicker({
  hotelRooms,
  value,
  onChange,
}: {
  hotelRooms: string[]
  value: string[]
  onChange: (rooms: string[]) => void
}) {
  const { t } = useSession()
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
          {t('picker.allRooms')}
        </button>
        {HOTEL_RANGES.map((range) => (
          <button
            key={range.floor}
            type="button"
            className="rounded-full bg-cream px-3 py-2 text-xs font-semibold text-navy min-h-11"
            onClick={() => add(floorRooms(range.floor))}
          >
            {t('picker.floor', { n: range.floor })}
          </button>
        ))}
        <button
          type="button"
          className="min-h-11 rounded-full bg-white px-3 py-2 text-xs font-bold text-muted"
          onClick={() => onChange([])}
        >
          {t('picker.clear')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
        <label className="text-xs font-semibold text-muted">
          {t('picker.from')}
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="field mt-1 block w-full sm:w-24"
            inputMode="numeric"
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          {t('picker.to')}
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
          {t('picker.addRange')}
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
          placeholder={t('picker.roomsPlaceholder')}
          className="field min-w-0 flex-1"
        />
        <button
          type="button"
          className="btn-primary shrink-0 px-3 text-sm sm:px-4"
          onClick={applyManual}
        >
          {t('picker.add')}
        </button>
      </div>

      <div className="text-xs font-semibold text-muted">{t('picker.selected', { n: selected.length })}</div>
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-auto">
        {selected.map((room) => (
          <button
            key={room}
            type="button"
            className="min-h-11 rounded-lg bg-cream px-3 py-2 text-xs font-bold text-navy"
            onClick={() => onChange(selected.filter((item) => item !== room))}
            title={t('picker.remove')}
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
