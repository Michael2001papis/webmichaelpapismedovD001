import type { Inspection, StatusDefinition } from '../types'
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
    <div dir="rtl" className="w-[1100px] bg-white p-8 text-black" style={{ fontFamily: 'Assistant, Arial, sans-serif' }}>
      <div className="mb-6 flex items-start justify-between border-b-4 border-[#0b1f33] pb-4">
        <div>
          <div className="text-xs font-bold tracking-[0.25em] text-[#c4a35a]">HOLIKAR</div>
          <h1 className="mt-1 text-3xl font-black">{inspection.name}</h1>
          <div className="mt-2 space-y-0.5 text-sm">
            <div>תאריך הדוח: {formatDateTime(Date.now())}</div>
            <div>נוצרה: {formatDateTime(inspection.createdAt)}</div>
            <div>{inspection.hotel}</div>
            <div>{inspection.performer}</div>
            <div>{inspection.department}</div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#f4efe4] px-4 py-3 text-sm">
          <div>חדרים: {stats.totalRooms}</div>
          <div>הושלמו: {stats.checkedRooms}</div>
          <div>לא תקינים: {stats.byStatus.bad ?? 0}</div>
          <div>דורש מעקב: {stats.byStatus.watch ?? 0}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-[#0b1f33] px-2 py-2 text-right font-bold text-white">חדר</th>
            {columns.map((column) => (
              <th key={column.id} className="border border-slate-300 bg-[#0b1f33] px-2 py-2 text-right font-bold text-white">
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inspection.rooms.map((room) => (
            <tr key={room}>
              <td className="border border-slate-300 px-2 py-1.5 font-bold">{room}</td>
              {columns.map((column) => {
                const cell = cellOf(inspection, room, column.id, missing)
                const status = statuses.find((item) => item.id === cell.statusId)
                return (
                  <td
                    key={column.id}
                    className="border border-slate-300 px-2 py-1.5 font-bold"
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
          <h2 className="mb-3 text-xl font-black">הערות וליקויים</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-right">חדר</th>
                <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-right">בדיקה</th>
                <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-right">סטטוס</th>
                <th className="border border-slate-300 bg-slate-100 px-2 py-2 text-right">הערה</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((item, index) => (
                <tr key={index}>
                  <td className="border border-slate-300 px-2 py-2 font-bold">{item.room}</td>
                  <td className="border border-slate-300 px-2 py-2">{item.check}</td>
                  <td className="border border-slate-300 px-2 py-2">{item.status}</td>
                  <td className="border border-slate-300 px-2 py-2">{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
        © Michael Papismedov
      </div>
    </div>
  )
}
