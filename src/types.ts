export type StatusDefinition = {
  id: string
  name: string
  color: string
  bg: string
  shortcut?: string
  order: number
  isDefaultEmpty?: boolean
}

export type CheckColumn = {
  id: string
  name: string
  order: number
}

export type CellValue = {
  statusId: string
  note: string
}

export type WorkflowStatus = 'open' | 'in_progress' | 'done'

export type Inspection = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  performer: string
  hotel: string
  department: string
  rooms: string[]
  columns: CheckColumn[]
  cells: Record<string, CellValue>
  workflowStatus: WorkflowStatus
}

export type Template = {
  id: string
  name: string
  columns: string[]
  createdAt: number
}

export type AppSettings = {
  id: 'main'
  performer: string
  hotel: string
  department: string
  extraRooms: string[]
  hiddenRooms: string[]
}

export type ParseResult = {
  rooms: string[]
  checks: string[]
  allRooms: boolean
  floors: number[]
  ranges: Array<{ start: number; end: number }>
}
