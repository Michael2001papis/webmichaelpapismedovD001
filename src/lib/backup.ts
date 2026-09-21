import { db } from './db'
import { formatDate } from './id'

export type HolikarBackup = {
  version: 1
  exportedAt: number
  inspections: unknown[]
  templates: unknown[]
  statuses: unknown[]
  settings: unknown[]
}

export async function buildBackup(): Promise<HolikarBackup> {
  return {
    version: 1,
    exportedAt: Date.now(),
    inspections: await db.inspections.toArray(),
    templates: await db.templates.toArray(),
    statuses: await db.statuses.toArray(),
    settings: await db.settings.toArray(),
  }
}

export async function downloadBackup() {
  const backup = await buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `holikar-backup-${formatDate(backup.exportedAt).replace(/[./]/g, '-')}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(file: File) {
  const parsed = JSON.parse(await file.text()) as Partial<HolikarBackup>
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.inspections)) {
    throw new Error('קובץ גיבוי לא תקין')
  }
  await db.transaction('rw', db.inspections, db.templates, db.statuses, db.settings, async () => {
    await db.inspections.clear()
    await db.templates.clear()
    await db.statuses.clear()
    await db.settings.clear()
    if (parsed.inspections?.length) await db.inspections.bulkAdd(parsed.inspections as never[])
    if (parsed.templates?.length) await db.templates.bulkAdd(parsed.templates as never[])
    if (parsed.statuses?.length) await db.statuses.bulkAdd(parsed.statuses as never[])
    if (parsed.settings?.length) await db.settings.bulkAdd(parsed.settings as never[])
  })
}
