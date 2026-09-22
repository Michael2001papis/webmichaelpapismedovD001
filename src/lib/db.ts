/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import Dexie, { type Table } from 'dexie'
import { t } from '../i18n'
import type { AppSettings, CheckColumn, Inspection, StatusDefinition, Template } from '../types'
import { uid } from './id'
import { uniqueRooms } from './rooms'
import { deriveWorkflow, emptyStatusId } from './stats'

export const DEFAULT_STATUSES: StatusDefinition[] = [
  { id: 'ok', name: 'תקין', color: '#4F7A5A', bg: '#E8F0EA', shortcut: '✓', order: 0 },
  { id: 'bad', name: 'לא תקין', color: '#B44949', bg: '#F6E8E8', shortcut: '✕', order: 1 },
  {
    id: 'missing',
    name: 'מידע חסר',
    color: '#7C8894',
    bg: '#EEF1F3',
    shortcut: '?',
    order: 2,
    isDefaultEmpty: true,
  },
  { id: 'na', name: 'לא רלוונטי', color: '#5E6368', bg: '#F0F1F2', order: 3 },
  { id: 'watch', name: 'דורש מעקב', color: '#C97A2B', bg: '#F8EEDF', order: 4 },
  { id: 'fixed', name: 'טופל', color: '#24364A', bg: '#E8EDF1', order: 5 },
]

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'main',
  performer: 'Michael Papismedov',
  hotel: 'מלון יאכט הרצליה',
  department: 'Holikar / אחזקה',
  extraRooms: [],
  hiddenRooms: [],
}

const DEFAULT_TEMPLATES: Array<{ name: string; columns: string[] }> = [
  { name: 'בדיקת מזגנים', columns: ['שיפוע מזגן', 'ניקוז מזגן', 'רעש', 'שלט', 'קירור'] },
  { name: 'בדיקת יצחקי', columns: ['שיפוע מזגן', 'ניקוז מקלחון', 'דלת כניסה', 'כורסאות', 'תקרה'] },
  {
    name: 'בדיקת חדר לפני אכלוס',
    columns: ['דלת כניסה', 'מזגן', 'מקלחון', 'כורסאות', 'תאורה', 'טלוויזיה'],
  },
  { name: 'בדיקת דלתות', columns: ['דלת כניסה', 'ידית', 'מנעול', 'דלת מרפסת', 'סגירה'] },
  { name: 'בדיקת אינסטלציה', columns: ['ניקוז מקלחון', 'ברז כיור', 'אסלה', 'נזילה', 'לחץ מים'] },
  { name: 'בדיקת צבע', columns: ['קירות', 'תקרה', 'דלתות', 'מרפסת', 'פגיעות'] },
]

export class HolikarDB extends Dexie {
  inspections!: Table<Inspection, string>
  templates!: Table<Template, string>
  statuses!: Table<StatusDefinition, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('holikar-db')
    this.version(1).stores({
      inspections: 'id, createdAt, updatedAt, workflowStatus',
      templates: 'id, name, createdAt',
      statuses: 'id, order',
      settings: 'id',
    })
  }
}

export const db = new HolikarDB()

export async function seedDatabase() {
  const statusCount = await db.statuses.count()
  if (statusCount === 0) await db.statuses.bulkAdd(DEFAULT_STATUSES)
  else {
    for (const def of DEFAULT_STATUSES) {
      const existing = await db.statuses.get(def.id)
      if (existing) await db.statuses.update(def.id, { color: def.color, bg: def.bg })
    }
  }

  const settings = await db.settings.get('main')
  if (!settings) await db.settings.add(DEFAULT_SETTINGS)

  const templateCount = await db.templates.count()
  if (templateCount === 0) {
    await db.templates.bulkAdd(
      DEFAULT_TEMPLATES.map((template) => ({
        id: uid(),
        name: template.name,
        columns: template.columns,
        createdAt: Date.now(),
      })),
    )
  }
}

function columnsFromNames(names: string[]): CheckColumn[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, order) => ({ id: uid(), name, order }))
}

export async function createInspection(input: {
  name: string
  rooms: string[]
  checks: string[]
  performer?: string
}): Promise<string> {
  const settings = (await db.settings.get('main')) ?? DEFAULT_SETTINGS
  const id = uid()
  const now = Date.now()
  const inspection: Inspection = {
    id,
    name: input.name.trim() || t('he', 'inspection.defaultName', { date: new Date(now).toLocaleDateString('he-IL') }),
    createdAt: now,
    updatedAt: now,
    performer: input.performer?.trim() || settings.performer,
    hotel: settings.hotel,
    department: settings.department,
    rooms: uniqueRooms(input.rooms),
    columns: columnsFromNames(input.checks),
    cells: {},
    workflowStatus: 'open',
  }
  await db.inspections.add(inspection)
  return id
}

export async function saveInspection(inspection: Inspection) {
  const statuses = await db.statuses.orderBy('order').toArray()
  inspection.updatedAt = Date.now()
  inspection.workflowStatus = deriveWorkflow(inspection, statuses)
  await db.inspections.put(inspection)
}

export async function patchInspection(id: string, mutate: (inspection: Inspection) => void) {
  const inspection = await db.inspections.get(id)
  if (!inspection) return
  mutate(inspection)
  await saveInspection(inspection)
}

export async function setCell(
  inspectionId: string,
  room: string,
  columnId: string,
  statusId: string,
  note?: string,
) {
  await patchInspection(inspectionId, (inspection) => {
    const key = `${room}::${columnId}`
    const prev = inspection.cells[key] ?? { statusId, note: '' }
    inspection.cells[key] = {
      statusId,
      note: note === undefined ? prev.note : note,
    }
  })
}

export async function markRoomStatus(
  inspectionId: string,
  room: string,
  statusId: string,
) {
  await patchInspection(inspectionId, (inspection) => {
    for (const column of inspection.columns) {
      const key = `${room}::${column.id}`
      const prev = inspection.cells[key] ?? { statusId, note: '' }
      inspection.cells[key] = { statusId, note: prev.note }
    }
  })
}

export async function markAllRoomsStatus(inspectionId: string, statusId: string) {
  await patchInspection(inspectionId, (inspection) => {
    for (const room of inspection.rooms) {
      for (const column of inspection.columns) {
        const key = `${room}::${column.id}`
        const prev = inspection.cells[key] ?? { statusId, note: '' }
        inspection.cells[key] = { statusId, note: prev.note }
      }
    }
  })
}

export async function setInspectionRooms(inspectionId: string, rooms: string[]) {
  await patchInspection(inspectionId, (inspection) => {
    const next = uniqueRooms(rooms)
    const removed = inspection.rooms.filter((room) => !next.includes(room))
    inspection.rooms = next
    for (const room of removed) {
      for (const key of Object.keys(inspection.cells)) {
        if (key.startsWith(`${room}::`)) delete inspection.cells[key]
      }
    }
  })
}

export async function addColumn(inspectionId: string, name: string) {
  await patchInspection(inspectionId, (inspection) => {
    inspection.columns.push({
      id: uid(),
      name: name.trim(),
      order: inspection.columns.length,
    })
  })
}

export async function renameColumn(inspectionId: string, columnId: string, name: string) {
  await patchInspection(inspectionId, (inspection) => {
    const column = inspection.columns.find((item) => item.id === columnId)
    if (column) column.name = name.trim()
  })
}

export async function deleteColumn(inspectionId: string, columnId: string) {
  await patchInspection(inspectionId, (inspection) => {
    inspection.columns = inspection.columns
      .filter((item) => item.id !== columnId)
      .map((item, order) => ({ ...item, order }))
    for (const key of Object.keys(inspection.cells)) {
      if (key.endsWith(`::${columnId}`)) delete inspection.cells[key]
    }
  })
}

export async function moveColumn(inspectionId: string, columnId: string, direction: -1 | 1) {
  await patchInspection(inspectionId, (inspection) => {
    const sorted = [...inspection.columns].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((item) => item.id === columnId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= sorted.length) return
    const [item] = sorted.splice(index, 1)
    sorted.splice(next, 0, item)
    inspection.columns = sorted.map((column, order) => ({ ...column, order }))
  })
}

export async function addRooms(inspectionId: string, rooms: string[]) {
  await patchInspection(inspectionId, (inspection) => {
    inspection.rooms = uniqueRooms([...inspection.rooms, ...rooms])
  })
}

export async function removeRoom(inspectionId: string, room: string) {
  await patchInspection(inspectionId, (inspection) => {
    inspection.rooms = inspection.rooms.filter((item) => item !== room)
    for (const key of Object.keys(inspection.cells)) {
      if (key.startsWith(`${room}::`)) delete inspection.cells[key]
    }
  })
}

export async function saveAsTemplate(inspection: Inspection, name: string) {
  const template: Template = {
    id: uid(),
    name: name.trim(),
    columns: [...inspection.columns].sort((a, b) => a.order - b.order).map((column) => column.name),
    createdAt: Date.now(),
  }
  await db.templates.add(template)
  return template.id
}

export { emptyStatusId }
