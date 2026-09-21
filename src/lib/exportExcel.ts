/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import * as XLSX from 'xlsx'
import type { Inspection, StatusDefinition } from '../types'
import { COPYRIGHT, DOCUMENT_META } from '../config/copyright'
import { formatDateTime, safeFileName } from './id'
import { cellOf, emptyStatusId } from './stats'

/** כל גיליון נפתח בשתי שורות זיהוי ואז שורה ריקה. */
function brand(title: string): string[][] {
  return [[`${COPYRIGHT.product} — ${title}`], [COPYRIGHT.text], []]
}

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
    [],
    ['זכויות יוצרים', COPYRIGHT.text],
  ]

  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: `${COPYRIGHT.product} — ${inspection.name}`,
    Subject: DOCUMENT_META.copyright,
    Author: DOCUMENT_META.author,
    LastAuthor: DOCUMENT_META.author,
    Manager: DOCUMENT_META.author,
    Company: DOCUMENT_META.company,
    Category: 'Hotel maintenance inspection',
    Keywords: `${COPYRIGHT.product}, ${COPYRIGHT.owner}`,
    Comments: DOCUMENT_META.copyright,
    CreatedDate: new Date(),
  }
  workbook.Custprops = {
    Copyright: DOCUMENT_META.copyright,
    Owner: COPYRIGHT.owner,
    Product: COPYRIGHT.product,
  }

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([...brand(inspection.name), ...info]),
    'פרטים',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([...brand('תוצאות'), header, ...rows]),
    'תוצאות',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([...brand('הערות'), ...notes]),
    'הערות',
  )
  XLSX.writeFile(workbook, `${safeFileName(inspection.name)}.xlsx`)
}
