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
import { statusLabel, t } from '../i18n'
import type { Locale } from '../i18n/types'
import { formatDateTime, safeFileName } from './id'
import { cellOf, emptyStatusId } from './stats'

/** כל גיליון נפתח בשתי שורות זיהוי ואז שורה ריקה. */
function brand(title: string): string[][] {
  return [[`${COPYRIGHT.product} — ${title}`], [COPYRIGHT.text], []]
}

function sheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Holikar'
}

export function exportInspectionExcel(
  inspection: Inspection,
  statuses: StatusDefinition[],
  locale: Locale = 'he',
) {
  const missing = emptyStatusId(statuses)
  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const statusName = (id: string) => {
    const status = statuses.find((item) => item.id === id)
    return status ? statusLabel(locale, status) : id
  }

  const header = [t(locale, 'export.room'), ...columns.map((column) => column.name)]
  const rows = inspection.rooms.map((room) => [
    room,
    ...columns.map((column) => statusName(cellOf(inspection, room, column.id, missing).statusId)),
  ])

  const notes = [[t(locale, 'export.room'), t(locale, 'export.check'), t(locale, 'export.status'), t(locale, 'export.note')]]
  for (const room of inspection.rooms) {
    for (const column of columns) {
      const cell = cellOf(inspection, room, column.id, missing)
      if (cell.note.trim()) {
        notes.push([room, column.name, statusName(cell.statusId), cell.note])
      }
    }
  }

  const info = [
    [t(locale, 'export.inspectionName'), inspection.name],
    [t(locale, 'export.dateTime'), formatDateTime(inspection.updatedAt, locale)],
    [t(locale, 'export.hotel'), inspection.hotel],
    [t(locale, 'export.performer'), inspection.performer],
    [t(locale, 'export.department'), inspection.department],
    [t(locale, 'export.rooms'), inspection.rooms.join(', ')],
    [],
    [t(locale, 'export.copyright'), COPYRIGHT.text],
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
    sheetName(t(locale, 'export.details')),
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([...brand(t(locale, 'export.results')), header, ...rows]),
    sheetName(t(locale, 'export.results')),
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([...brand(t(locale, 'export.notes')), ...notes]),
    sheetName(t(locale, 'export.notes')),
  )
  XLSX.writeFile(workbook, `${safeFileName(inspection.name)}.xlsx`)
}
