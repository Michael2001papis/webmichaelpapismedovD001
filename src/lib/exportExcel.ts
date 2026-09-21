import * as XLSX from 'xlsx'
import type { Inspection, StatusDefinition } from '../types'
import { formatDateTime, safeFileName } from './id'
import { cellOf, emptyStatusId } from './stats'

export function exportInspectionExcel(inspection: Inspection, statuses: StatusDefinition[]) {
  const missing = emptyStatusId(statuses)
  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const statusName = (id: string) => statuses.find((status) => status.id === id)?.name ?? id

  const header = ['חדר', ...columns.map((column) => column.name)]
  const rows = inspection.rooms.map((room) => [
    room,
    ...columns.map((column) => statusName(cellOf(inspection, room, column.id, missing).statusId)),
  ])

  const notes = [['חדר', 'בדיקה', 'סטטוס', 'הערה']]
  for (const room of inspection.rooms) {
    for (const column of columns) {
      const cell = cellOf(inspection, room, column.id, missing)
      if (cell.note.trim()) {
        notes.push([room, column.name, statusName(cell.statusId), cell.note])
      }
    }
  }

  const info = [
    ['שם הבדיקה', inspection.name],
    ['תאריך ושעה', formatDateTime(inspection.updatedAt)],
    ['מלון', inspection.hotel],
    ['מבצע', inspection.performer],
    ['מחלקה', inspection.department],
    ['חדרים', inspection.rooms.join(', ')],
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(info), 'פרטים')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ...rows]), 'תוצאות')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(notes), 'הערות')
  XLSX.writeFile(workbook, `${safeFileName(inspection.name)}.xlsx`)
}
