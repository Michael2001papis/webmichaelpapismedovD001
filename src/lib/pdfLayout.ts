/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

/**
 * בחירת גודל עמוד וחלוקת עמודות לדוח PDF.
 * הכלל: קודם מנסים להכניס הכול בעמוד רחב יותר, ורק אחר כך מפצלים.
 * לעולם לא מקטינים מתחת ל-MIN_COL_MM ול-MIN_FONT_PT.
 */

export const PX_PER_MM = 96 / 25.4
export const PT_TO_PX = 96 / 72

export const MARGIN_MM = 12
const ROOM_COL_MM = 18
const IDEAL_COL_MM = 30
const MIN_COL_MM = 22
const MAX_COL_MM = 55
const MIN_FONT_PT = 8.5

export type PageFormat = {
  jsPdfFormat: 'a4' | 'a3'
  orientation: 'portrait' | 'landscape'
  widthMm: number
  heightMm: number
}

const A4_PORTRAIT: PageFormat = {
  jsPdfFormat: 'a4',
  orientation: 'portrait',
  widthMm: 210,
  heightMm: 297,
}
const A4_LANDSCAPE: PageFormat = {
  jsPdfFormat: 'a4',
  orientation: 'landscape',
  widthMm: 297,
  heightMm: 210,
}
const A3_LANDSCAPE: PageFormat = {
  jsPdfFormat: 'a3',
  orientation: 'landscape',
  widthMm: 420,
  heightMm: 297,
}

export type TableLayout = {
  format: PageFormat
  /** רוחב האזור שבין השוליים. */
  contentMm: number
  roomColMm: number
  checkColMm: number
  /** אינדקסים של עמודות הבדיקה לכל חלק רוחבי. עמודת החדר חוזרת בכל חלק. */
  chunks: number[][]
  fontPt: number
}

function contentWidth(format: PageFormat): number {
  return format.widthMm - 2 * MARGIN_MM
}

/** כמה עמודות בדיקה נכנסות בעמוד אחד ברוחב עמודה נתון. */
function capacity(format: PageFormat, colMm: number): number {
  return Math.max(1, Math.floor((contentWidth(format) - ROOM_COL_MM) / colMm))
}

function fontFor(colMm: number): number {
  if (colMm >= 30) return 9.5
  if (colMm >= 25) return 9
  return MIN_FONT_PT
}

function splitEvenly(total: number, perChunk: number): number[][] {
  const chunkCount = Math.ceil(total / perChunk)
  const size = Math.ceil(total / chunkCount)
  const chunks: number[][] = []
  for (let start = 0; start < total; start += size) {
    chunks.push(Array.from({ length: Math.min(size, total - start) }, (_, i) => start + i))
  }
  return chunks
}

function build(format: PageFormat, indices: number[][], columnsPerPage: number): TableLayout {
  const available = contentWidth(format) - ROOM_COL_MM
  const checkColMm = Math.min(MAX_COL_MM, available / columnsPerPage)
  return {
    format,
    contentMm: contentWidth(format),
    roomColMm: ROOM_COL_MM,
    checkColMm,
    chunks: indices,
    fontPt: fontFor(checkColMm),
  }
}

export function planTableLayout(columnCount: number): TableLayout {
  const total = Math.max(columnCount, 1)
  const all = [Array.from({ length: total }, (_, i) => i)]

  const candidates: Array<{ format: PageFormat; colMm: number }> = [
    { format: A4_PORTRAIT, colMm: IDEAL_COL_MM },
    { format: A4_LANDSCAPE, colMm: IDEAL_COL_MM },
    { format: A4_LANDSCAPE, colMm: MIN_COL_MM },
    { format: A3_LANDSCAPE, colMm: MIN_COL_MM },
  ]
  for (const candidate of candidates) {
    if (total <= capacity(candidate.format, candidate.colMm)) {
      return build(candidate.format, all, total)
    }
  }

  // רחב מדי גם ל-A3: מפצלים לרוחב במקום להמשיך להקטין.
  const perChunk = capacity(A3_LANDSCAPE, IDEAL_COL_MM)
  const chunks = splitEvenly(total, perChunk)
  const widest = Math.max(...chunks.map((chunk) => chunk.length))
  return build(A3_LANDSCAPE, chunks, widest)
}

/** אריזת שורות לעמודים לפי גובה אמיתי שנמדד, בלי לחתוך שורה באמצע. */
export function packRows(
  rowHeights: number[],
  availableFirst: number,
  availableRest: number,
): number[][] {
  const pages: number[][] = []
  let current: number[] = []
  let used = 0
  let available = availableFirst

  for (let index = 0; index < rowHeights.length; index += 1) {
    const height = rowHeights[index]!
    if (current.length > 0 && used + height > available) {
      pages.push(current)
      current = []
      used = 0
      available = availableRest
    }
    current.push(index)
    used += height
  }
  if (current.length > 0) pages.push(current)
  return pages.length > 0 ? pages : [[]]
}
