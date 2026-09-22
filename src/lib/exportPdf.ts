/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { COPYRIGHT, DOCUMENT_META } from '../config/copyright'
import { dirOf, statusLabel, t } from '../i18n'
import type { Locale } from '../i18n/types'
import type { Inspection, StatusDefinition } from '../types'
import { formatDateTime, safeFileName } from './id'
import { MARGIN_MM, packRows, planTableLayout, PT_TO_PX, PX_PER_MM, type TableLayout } from './pdfLayout'
import { cellOf, computeInspectionStats, emptyStatusId } from './stats'

function fontOf(locale: Locale): string {
  return locale === 'he' ? 'Heebo, Assistant, Arial, sans-serif' : '"Noto Sans", Arial, sans-serif'
}
const NAVY = '#24364A'
const GOLD = '#C8A96B'
const CREAM = '#F6F0E6'
const PAPER = '#FCFAF6'
const INK = '#1E1E1E'
const MUTED = '#5E6368'
const LINE = '#D8D2C8'

/** הערה ארוכה נשברת לשורות בתא; הנוסח המלא תמיד מופיע בפרק ההערות. */
const NOTE_IN_CELL_MAX = 120

const mm = (value: number) => value * PX_PER_MM
const pt = (value: number) => value * PT_TO_PX

type ReportContext = {
  title: string
  hotel: string
  performer: string
  department: string
  createdAt: string
  printedAt: string
  stats: { rooms: number; done: number; bad: number; watch: number }
  locale: Locale
  font: string
  dir: 'rtl' | 'ltr'
}

type PageShell = {
  page: HTMLDivElement
  main: HTMLDivElement
  pageLabel: HTMLSpanElement
}

export async function exportInspectionPdf(
  inspection: Inspection,
  statuses: StatusDefinition[],
  name: string,
  locale: Locale = 'he',
) {
  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const missing = emptyStatusId(statuses)
  const stats = computeInspectionStats(inspection, statuses)
  const layout = planTableLayout(columns.length)
  const font = fontOf(locale)
  const context: ReportContext = {
    title: name.trim() || inspection.name,
    hotel: inspection.hotel,
    performer: inspection.performer,
    department: inspection.department,
    createdAt: formatDateTime(inspection.createdAt, locale),
    printedAt: formatDateTime(Date.now(), locale),
    stats: {
      rooms: stats.totalRooms,
      done: stats.checkedRooms,
      bad: stats.byStatus.bad ?? 0,
      watch: stats.byStatus.watch ?? 0,
    },
    locale,
    font,
    dir: dirOf(locale),
  }

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = `position:fixed;left:-20000px;top:0;z-index:-1;background:#fff;font-family:${font};`
  document.body.appendChild(host)

  try {
    if (document.fonts?.ready) await document.fonts.ready
    const shells = buildDocument(host, layout, context, inspection, columns, statuses, missing)
    await renderToPdf(shells, layout, context.title)
  } finally {
    host.remove()
  }
}

function buildDocument(
  host: HTMLDivElement,
  layout: TableLayout,
  context: ReportContext,
  inspection: Inspection,
  columns: Inspection['columns'],
  statuses: StatusDefinition[],
  missing: string,
): PageShell[] {
  const availableFirst = measureAvailable(host, layout, context, true)
  const availableRest = measureAvailable(host, layout, context, false)
  const statusOf = (id: string) => statuses.find((status) => status.id === id)

  const planned: Array<{ shell: PageShell; fill: (shell: PageShell) => void }> = []

  // --- טבלת התוצאות, מחולקת לחלקים רוחביים ולעמודים לגובה ---
  layout.chunks.forEach((chunk, chunkIndex) => {
    const chunkColumns = chunk.map((index) => columns[index]!).filter(Boolean)
    const widths = [mm(layout.roomColMm), ...chunkColumns.map(() => mm(layout.checkColMm))]
    const source = makeTable(widths)
    source.thead.appendChild(
      headerRow(
        [t(context.locale, 'export.room'), ...chunkColumns.map((column) => column.name)],
        layout.fontPt,
        context.dir,
      ),
    )
    for (const room of inspection.rooms) {
      const cells = chunkColumns.map((column) => {
        const cell = cellOf(inspection, room, column.id, missing)
        const status = statusOf(cell.statusId)
        return {
          text: status ? statusLabel(context.locale, status) : cell.statusId,
          note: cell.note.trim(),
          color: status?.color ?? INK,
          background: status?.bg ?? PAPER,
        }
      })
      source.tbody.appendChild(bodyRow(room, cells, layout.fontPt, context.dir))
    }

    host.appendChild(source.table)
    const headHeight = source.thead.getBoundingClientRect().height
    const rowHeights = [...source.tbody.children].map((row) => row.getBoundingClientRect().height)
    source.table.remove()

    const isFirstChunk = chunkIndex === 0
    const slices = packRows(
      rowHeights,
      (isFirstChunk ? availableFirst : availableRest) - headHeight,
      availableRest - headHeight,
    )
    const rows = [...source.tbody.children] as HTMLTableRowElement[]
    const label = chunkLabel(layout, chunk, columns.length, context.locale)

    slices.forEach((slice, sliceIndex) => {
      const full = isFirstChunk && sliceIndex === 0
      const shell = createPage(layout, context, full, full ? '' : label)
      planned.push({
        shell,
        fill: () => {
          const table = makeTable(widths)
          table.thead.appendChild(source.thead.firstElementChild!.cloneNode(true))
          slice.forEach((rowIndex, position) => {
            const row = rows[rowIndex]!
            const roomCell = row.firstElementChild as HTMLElement
            roomCell.style.background = position % 2 === 0 ? PAPER : CREAM
            table.tbody.appendChild(row)
          })
          shell.main.appendChild(table.table)
        },
      })
    })
  })

  // --- פרק ההערות והליקויים, עם הנוסח המלא ---
  const notes = collectNotes(inspection, columns, statuses, missing, context.locale)
  if (notes.length > 0) {
    const widths = noteWidths(layout)
    const source = makeTable(widths)
    source.thead.appendChild(
      headerRow(
        [
          t(context.locale, 'export.room'),
          t(context.locale, 'export.check'),
          t(context.locale, 'export.status'),
          t(context.locale, 'export.note'),
        ],
        layout.fontPt,
        context.dir,
      ),
    )
    for (const note of notes) {
      source.tbody.appendChild(
        bodyRow(
          note.room,
          [
            { text: note.check, note: '', color: INK, background: PAPER },
            { text: note.status, note: '', color: note.color, background: note.background },
            { text: note.note || t(context.locale, 'export.dash'), note: '', color: INK, background: PAPER, align: context.dir === 'rtl' ? 'right' : 'left' },
          ],
          layout.fontPt,
          context.dir,
        ),
      )
    }
    host.appendChild(source.table)
    const headHeight = source.thead.getBoundingClientRect().height
    const rowHeights = [...source.tbody.children].map((row) => row.getBoundingClientRect().height)
    source.table.remove()

    const slices = packRows(rowHeights, availableRest - headHeight, availableRest - headHeight)
    const rows = [...source.tbody.children] as HTMLTableRowElement[]
    slices.forEach((slice) => {
      const shell = createPage(layout, context, false, t(context.locale, 'export.notesIssues'))
      planned.push({
        shell,
        fill: () => {
          const table = makeTable(widths)
          table.thead.appendChild(source.thead.firstElementChild!.cloneNode(true))
          slice.forEach((rowIndex, position) => {
            const row = rows[rowIndex]!
            const roomCell = row.firstElementChild as HTMLElement
            roomCell.style.background = position % 2 === 0 ? PAPER : CREAM
            table.tbody.appendChild(row)
          })
          shell.main.appendChild(table.table)
        },
      })
    })
  }

  if (planned.length === 0) {
    planned.push({ shell: createPage(layout, context, true, ''), fill: () => {} })
  }

  planned.forEach((item, index) => {
    item.fill(item.shell)
    item.shell.pageLabel.textContent = t(context.locale, 'export.pageOf', { page: index + 1, total: planned.length })
    host.appendChild(item.shell.page)
  })
  return planned.map((item) => item.shell)
}

async function renderToPdf(shells: PageShell[], layout: TableLayout, title: string) {
  const { format } = layout
  const pdf = new jsPDF({
    orientation: format.orientation,
    unit: 'mm',
    format: format.jsPdfFormat,
  })
  pdf.setProperties({
    title: `${title} — ${COPYRIGHT.product}`,
    author: DOCUMENT_META.author,
    creator: DOCUMENT_META.creator,
    subject: DOCUMENT_META.copyright,
    keywords: `${COPYRIGHT.product}, ${COPYRIGHT.owner}, ${DOCUMENT_META.copyright}`,
  })

  const scale = shells.length > 10 ? 1.4 : 2
  for (let index = 0; index < shells.length; index += 1) {
    const page = shells[index]!.page
    const canvas = await html2canvas(page, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      width: page.offsetWidth,
      height: page.offsetHeight,
      windowWidth: page.offsetWidth,
      windowHeight: page.offsetHeight,
    })
    if (index > 0) pdf.addPage(format.jsPdfFormat, format.orientation)
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      0,
      0,
      format.widthMm,
      format.heightMm,
    )
  }
  pdf.save(`${safeFileName(title)}.pdf`)
}

// ---------- בניית העמוד ----------

function createPage(
  layout: TableLayout,
  context: ReportContext,
  full: boolean,
  label: string,
): PageShell {
  const { format } = layout
  const page = document.createElement('div')
  page.dir = context.dir
  page.style.cssText = [
    `width:${mm(format.widthMm)}px`,
    `height:${mm(format.heightMm)}px`,
    `padding:${mm(MARGIN_MM)}px`,
    'box-sizing:border-box',
    'display:flex',
    'flex-direction:column',
    'background:#ffffff',
    `color:${INK}`,
    `font-family:${context.font}`,
    'overflow:hidden',
  ].join(';')

  page.appendChild(full ? fullHeader(context) : compactHeader(context, label))

  const main = document.createElement('div')
  main.style.cssText = 'flex:1 1 auto;min-height:0;overflow:hidden'
  page.appendChild(main)

  const { footer, pageLabel } = buildFooter()
  page.appendChild(footer)

  return { page, main, pageLabel }
}

function measureAvailable(
  host: HTMLDivElement,
  layout: TableLayout,
  context: ReportContext,
  full: boolean,
): number {
  const shell = createPage(layout, context, full, t(context.locale, 'export.dash'))
  host.appendChild(shell.page)
  const height = shell.main.clientHeight
  shell.page.remove()
  return height
}

function fullHeader(context: ReportContext): HTMLElement {
  const header = document.createElement('div')
  header.style.cssText = `display:flex;align-items:flex-start;justify-content:space-between;gap:${mm(8)}px;border-bottom:1.5px solid ${NAVY};padding-bottom:${mm(4)}px;margin-bottom:${mm(4)}px`

  const left = document.createElement('div')
  left.appendChild(
    line('HOLIKAR', `font-size:${pt(7.5)}px;font-weight:700;letter-spacing:.28em;color:${GOLD}`),
  )
  left.appendChild(
    line(context.title, `font-size:${pt(17)}px;font-weight:700;color:${NAVY};margin-top:${mm(1.5)}px`),
  )
  const details = document.createElement('div')
  details.style.cssText = `margin-top:${mm(2)}px;font-size:${pt(9)}px;color:${MUTED};line-height:1.6`
  details.appendChild(line(context.hotel, ''))
  details.appendChild(line(`${t(context.locale, 'export.performer')}: ${context.performer}`, ''))
  details.appendChild(line(`${t(context.locale, 'export.department')}: ${context.department}`, ''))
  details.appendChild(line(`${t(context.locale, 'export.dateTime')}: ${context.printedAt}`, ''))
  details.appendChild(line(`${t(context.locale, 'export.created')}: ${context.createdAt}`, ''))
  left.appendChild(details)

  const box = document.createElement('div')
  box.style.cssText = `flex:none;border:1px solid ${LINE};background:${CREAM};border-radius:${mm(2.5)}px;padding:${mm(3)}px ${mm(4)}px;font-size:${pt(9)}px;line-height:1.7;color:${INK}`
  box.appendChild(line(`${t(context.locale, 'export.rooms')}: ${context.stats.rooms}`, ''))
  box.appendChild(line(`${t(context.locale, 'export.completed')}: ${context.stats.done}`, ''))
  box.appendChild(line(`${t(context.locale, 'export.bad')}: ${context.stats.bad}`, ''))
  box.appendChild(line(`${t(context.locale, 'export.watch')}: ${context.stats.watch}`, ''))

  header.append(left, box)
  return header
}

function compactHeader(context: ReportContext, label: string): HTMLElement {
  const header = document.createElement('div')
  header.style.cssText = `display:flex;align-items:baseline;justify-content:space-between;gap:${mm(6)}px;border-bottom:1px solid ${LINE};padding-bottom:${mm(2.5)}px;margin-bottom:${mm(3)}px;font-size:${pt(9)}px;color:${MUTED}`

  const left = document.createElement('div')
  left.style.cssText = 'display:flex;align-items:baseline;gap:8px;min-width:0'
  left.appendChild(
    line('HOLIKAR', `font-size:${pt(7)}px;font-weight:700;letter-spacing:.24em;color:${GOLD}`),
  )
  left.appendChild(line(context.title, `font-weight:700;color:${NAVY}`))
  left.appendChild(line(`· ${context.hotel}`, ''))

  header.append(left, line(label, 'flex:none'))
  return header
}

function buildFooter(): { footer: HTMLElement; pageLabel: HTMLSpanElement } {
  const footer = document.createElement('div')
  footer.style.cssText = `flex:none;display:flex;align-items:center;justify-content:space-between;gap:${mm(6)}px;border-top:1px solid ${LINE};padding-top:${mm(2)}px;margin-top:${mm(3)}px;font-size:${pt(7.5)}px;color:${MUTED}`

  const pageLabel = document.createElement('span')
  const rights = document.createElement('span')
  rights.dir = 'ltr'
  rights.textContent = COPYRIGHT.text

  footer.append(pageLabel, rights)
  return { footer, pageLabel }
}

// ---------- טבלה ----------

function makeTable(widths: number[]) {
  const table = document.createElement('table')
  table.style.cssText = `border-collapse:collapse;table-layout:fixed;width:${widths.reduce((sum, width) => sum + width, 0)}px`
  const colgroup = document.createElement('colgroup')
  for (const width of widths) {
    const col = document.createElement('col')
    col.style.width = `${width}px`
    colgroup.appendChild(col)
  }
  const thead = document.createElement('thead')
  const tbody = document.createElement('tbody')
  table.append(colgroup, thead, tbody)
  return { table, thead, tbody }
}

function headerRow(labels: string[], fontPt: number, dir: 'rtl' | 'ltr'): HTMLTableRowElement {
  const row = document.createElement('tr')
  const side = dir === 'rtl' ? 'right' : 'left'
  labels.forEach((label, index) => {
    const cell = document.createElement('th')
    cell.textContent = label
    cell.style.cssText = [
      `border:1px solid ${LINE}`,
      `background:${NAVY}`,
      'color:#ffffff',
      'font-weight:600',
      index === 0 ? 'text-align:center' : `text-align:${side}`,
      `font-size:${pt(fontPt)}px`,
      'line-height:1.35',
      `padding:${mm(1.6)}px ${mm(1.6)}px`,
      'overflow-wrap:break-word',
      'word-break:break-word',
      'vertical-align:middle',
    ].join(';')
    row.appendChild(cell)
  })
  return row
}

type BodyCell = {
  text: string
  note: string
  color: string
  background: string
  align?: 'right' | 'center' | 'left'
}

function bodyRow(room: string, cells: BodyCell[], fontPt: number, dir: 'rtl' | 'ltr' = 'rtl'): HTMLTableRowElement {
  const row = document.createElement('tr')
  row.dir = dir
  const roomCell = document.createElement('td')
  roomCell.textContent = room
  roomCell.style.cssText = [
    `border:1px solid ${LINE}`,
    `background:${PAPER}`,
    `color:${NAVY}`,
    'font-weight:700',
    'text-align:center',
    `font-size:${pt(fontPt)}px`,
    `padding:${mm(1.4)}px ${mm(1.2)}px`,
    'overflow-wrap:break-word',
    'vertical-align:middle',
  ].join(';')
  row.appendChild(roomCell)

  for (const cell of cells) {
    const td = document.createElement('td')
    td.style.cssText = [
      `border:1px solid ${LINE}`,
      `background:${cell.background}`,
      `color:${cell.color}`,
      'font-weight:600',
      `text-align:${cell.align ?? 'center'}`,
      `font-size:${pt(fontPt)}px`,
      'line-height:1.4',
      `padding:${mm(1.4)}px ${mm(1.2)}px`,
      'overflow-wrap:break-word',
      'word-break:break-word',
      'vertical-align:middle',
    ].join(';')
    td.appendChild(line(cell.text, ''))
    if (cell.note) {
      td.appendChild(
        line(clampNote(cell.note), `font-weight:400;opacity:.85;margin-top:${mm(0.8)}px`),
      )
    }
    row.appendChild(td)
  }
  return row
}

function noteWidths(layout: TableLayout): number[] {
  const total = layout.contentMm
  const room = 16
  const check = Math.min(45, total * 0.2)
  const status = Math.min(30, total * 0.14)
  return [mm(room), mm(check), mm(status), mm(total - room - check - status)]
}

function collectNotes(
  inspection: Inspection,
  columns: Inspection['columns'],
  statuses: StatusDefinition[],
  missing: string,
  locale: Locale,
) {
  const notes: Array<{
    room: string
    check: string
    status: string
    note: string
    color: string
    background: string
  }> = []
  for (const room of inspection.rooms) {
    for (const column of columns) {
      const cell = cellOf(inspection, room, column.id, missing)
      const relevant = cell.note.trim() || cell.statusId === 'bad' || cell.statusId === 'watch'
      if (!relevant) continue
      const status = statuses.find((item) => item.id === cell.statusId)
      notes.push({
        room,
        check: column.name,
        status: status ? statusLabel(locale, status) : cell.statusId,
        note: cell.note.trim(),
        color: status?.color ?? INK,
        background: status?.bg ?? PAPER,
      })
    }
  }
  return notes
}

function chunkLabel(layout: TableLayout, chunk: number[], total: number, locale: Locale): string {
  if (layout.chunks.length < 2) return ''
  const first = (chunk[0] ?? 0) + 1
  const last = (chunk[chunk.length - 1] ?? 0) + 1
  return t(locale, 'export.chunk', { first, last, total })
}

function clampNote(note: string): string {
  return note.length > NOTE_IN_CELL_MAX ? `${note.slice(0, NOTE_IN_CELL_MAX - 1)}…` : note
}

function line(text: string, style: string): HTMLDivElement {
  const div = document.createElement('div')
  div.textContent = text
  if (style) div.style.cssText = style
  return div
}
