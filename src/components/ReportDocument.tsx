/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import type { Inspection, StatusDefinition } from '../types'
import { COPYRIGHT } from '../config/copyright'
import { formatDateTime } from '../lib/id'
import { cellOf, computeInspectionStats, emptyStatusId } from '../lib/stats'

export function ReportDocument({
  inspection,
  statuses,
}: {
  inspection: Inspection
  statuses: StatusDefinition[]
}) {
  const missing = emptyStatusId(statuses)
  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const stats = computeInspectionStats(inspection, statuses)
  const notes: Array<{ room: string; check: string; status: string; note: string }> = []
  for (const room of inspection.rooms) {
    for (const column of columns) {
      const cell = cellOf(inspection, room, column.id, missing)
      if (cell.note.trim() || cell.statusId === 'bad' || cell.statusId === 'watch') {
        notes.push({
          room,
          check: column.name,
          status: statuses.find((status) => status.id === cell.statusId)?.name ?? '',
          note: cell.note,
        })
      }
    }
  }

  return (
    <div dir="rtl" className="w-[1100px] bg-white p-10 text-[#1E1E1E]" style={{ fontFamily: 'Heebo, Assistant, Arial, sans-serif' }}>
      <div className="mb-6 flex items-start justify-between border-b border-[#24364A] pb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.28em] text-[#C8A96B]">HOLIKAR</div>
          <h1 className="mt-1 text-3xl font-bold text-[#24364A]">{inspection.name}</h1>
          <div className="mt-3 space-y-0.5 text-sm text-[#5E6368]">
            <div>מלון יאכט הרצליה · {inspection.hotel}</div>
            <div>מבצע: {inspection.performer}</div>
            <div>מחלקה: {inspection.department}</div>
            <div>תאריך ושעה: {formatDateTime(Date.now())}</div>
            <div>נוצרה: {formatDateTime(inspection.createdAt)}</div>
          </div>
        </div>
        <div className="rounded-xl border border-[#24364A1a] bg-[#F6F0E6] px-4 py-3 text-sm">
          <div>חדרים: {stats.totalRooms}</div>
          <div>הושלמו: {stats.checkedRooms}</div>
          <div>לא תקינים: {stats.byStatus.bad ?? 0}</div>
          <div>דורש מעקב: {stats.byStatus.watch ?? 0}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">חדר</th>
            {columns.map((column) => (
              <th key={column.id} className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inspection.rooms.map((room, index) => (
            <tr key={room} style={{ background: index % 2 ? '#F6F0E6' : '#FCFAF6' }}>
              <td className="border border-[#d8d2c8] px-2 py-1.5 font-bold text-[#24364A]">{room}</td>
              {columns.map((column) => {
                const cell = cellOf(inspection, room, column.id, missing)
                const status = statuses.find((item) => item.id === cell.statusId)
                return (
                  <td
                    key={column.id}
                    className="border border-[#d8d2c8] px-2 py-1.5 font-semibold"
                    style={{ background: status?.bg, color: status?.color }}
                  >
                    {status?.name}
                    {cell.note ? <div className="mt-1 font-normal opacity-80">{cell.note}</div> : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {notes.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-[#24364A]">הערות וליקויים</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">חדר</th>
                <th className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">בדיקה</th>
                <th className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">סטטוס</th>
                <th className="border border-[#d8d2c8] bg-[#24364A] px-2 py-2 text-right font-semibold text-white">הערה</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((item, index) => (
                <tr key={index} style={{ background: index % 2 ? '#F6F0E6' : '#FCFAF6' }}>
                  <td className="border border-[#d8d2c8] px-2 py-2 font-bold">{item.room}</td>
                  <td className="border border-[#d8d2c8] px-2 py-2">{item.check}</td>
                  <td className="border border-[#d8d2c8] px-2 py-2">{item.status}</td>
                  <td className="border border-[#d8d2c8] px-2 py-2">{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 border-t border-[#d8d2c8] pt-3 text-center text-xs text-[#5E6368]" dir="ltr">
        {COPYRIGHT.text}
      </div>
    </div>
  )
}
