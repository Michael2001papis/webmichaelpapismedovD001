import { useEffect, useState } from 'react'
import { setCell } from '../lib/db'

export function CellNote({
  inspectionId,
  room,
  columnId,
  statusId,
  note,
  placeholder,
}: {
  inspectionId: string
  room: string
  columnId: string
  statusId: string
  note: string
  placeholder: string
}) {
  const [value, setValue] = useState(note)

  useEffect(() => {
    setValue(note)
  }, [note, room, columnId])

  useEffect(() => {
    if (value === note) return
    const timer = window.setTimeout(() => {
      void setCell(inspectionId, room, columnId, statusId, value)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [value, inspectionId, room, columnId, statusId, note])

  return (
    <textarea
      className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
      rows={3}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
