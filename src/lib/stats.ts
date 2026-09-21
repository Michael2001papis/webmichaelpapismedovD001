import type { Inspection, StatusDefinition } from '../types'
import { cellKey } from './id'

export type InspectionStats = {
  totalRooms: number
  totalCells: number
  checkedRooms: number
  partialRooms: number
  pendingRooms: number
  byStatus: Record<string, number>
  percents: Record<string, number>
}

export function emptyStatusId(statuses: StatusDefinition[]): string {
  return statuses.find((status) => status.isDefaultEmpty)?.id ?? statuses[0]?.id ?? 'missing'
}

export function cellOf(
  inspection: Inspection,
  room: string,
  columnId: string,
  fallbackStatusId: string,
) {
  return inspection.cells[cellKey(room, columnId)] ?? { statusId: fallbackStatusId, note: '' }
}

export function computeInspectionStats(
  inspection: Inspection,
  statuses: StatusDefinition[],
): InspectionStats {
  const missing = emptyStatusId(statuses)
  const byStatus: Record<string, number> = {}
  for (const status of statuses) byStatus[status.id] = 0

  let checkedRooms = 0
  let partialRooms = 0
  let pendingRooms = 0
  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const totalCells = inspection.rooms.length * columns.length

  for (const room of inspection.rooms) {
    let filled = 0
    for (const column of columns) {
      const cell = cellOf(inspection, room, column.id, missing)
      byStatus[cell.statusId] = (byStatus[cell.statusId] ?? 0) + 1
      if (cell.statusId !== missing) filled += 1
    }
    if (columns.length === 0) continue
    if (filled === 0) pendingRooms += 1
    else if (filled === columns.length) checkedRooms += 1
    else partialRooms += 1
  }

  const percents: Record<string, number> = {}
  for (const [id, count] of Object.entries(byStatus)) {
    percents[id] = totalCells === 0 ? 0 : Math.round((count / totalCells) * 100)
  }

  return {
    totalRooms: inspection.rooms.length,
    totalCells,
    checkedRooms,
    partialRooms,
    pendingRooms,
    byStatus,
    percents,
  }
}

export function deriveWorkflow(inspection: Inspection, statuses: StatusDefinition[]) {
  const stats = computeInspectionStats(inspection, statuses)
  if (stats.totalCells === 0) return 'open' as const
  if (stats.pendingRooms === stats.totalRooms) return 'open' as const
  if (stats.checkedRooms === stats.totalRooms) return 'done' as const
  return 'in_progress' as const
}

export const workflowLabel: Record<string, string> = {
  open: 'טרם התחילה',
  in_progress: 'בתהליך',
  done: 'הושלמה',
}
