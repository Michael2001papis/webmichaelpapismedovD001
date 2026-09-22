/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { downloadBackup, restoreBackup } from '../lib/backup'
import { tint } from '../lib/color'
import { db, DEFAULT_SETTINGS, DEFAULT_STATUSES } from '../lib/db'
import { uid } from '../lib/id'
import { defaultHotelRooms, floorOfRoom, HOTEL_RANGES, uniqueRooms } from '../lib/rooms'
import { useSession } from '../lib/sessionContext'
import { statusLabel } from '../i18n'
import type { StatusDefinition } from '../types'

export function SettingsPage() {
  const { t, locale, session } = useSession()
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []
  const [roomDraft, setRoomDraft] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const hotelRooms = uniqueRooms([...defaultHotelRooms(), ...settings.extraRooms]).filter(
    (room) => !settings.hiddenRooms.includes(room),
  )
  const performer = session?.name ?? settings.performer

  async function saveSettings(patch: Partial<typeof settings>) {
    await db.settings.put({ ...settings, ...patch })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('settings.lead')}</p>
      </div>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">{t('settings.backup')}</h2>
        <p className="text-sm text-muted">{t('settings.backupLead')}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 text-sm"
            onClick={async () => {
              await downloadBackup()
              setBackupMsg(t('settings.backupDownloaded'))
            }}
          >
            {t('settings.downloadBackup')}
          </button>
          <button type="button" className="btn-secondary px-4 text-sm" onClick={() => fileRef.current?.click()}>
            {t('settings.restoreBackup')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              if (!confirm(t('settings.restoreConfirm'))) return
              try {
                await restoreBackup(file)
                setBackupMsg(t('settings.restoreOk'))
              } catch {
                setBackupMsg(t('settings.restoreFail'))
              }
            }}
          />
        </div>
        {backupMsg ? <div className="text-sm font-semibold text-navy">{backupMsg}</div> : null}
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">{t('settings.reportDetails')}</h2>
        <label className="block text-sm font-semibold text-navy">
          {t('settings.performer')}
          <input value={performer} readOnly className="field mt-1 bg-cream font-medium" />
          <span className="mt-1 block text-xs font-medium text-muted">{t('settings.performerHint')}</span>
        </label>
        <Field label={t('settings.hotel')} value={settings.hotel} onChange={(hotel) => void saveSettings({ hotel })} />
        <Field
          label={t('settings.department')}
          value={settings.department}
          onChange={(department) => void saveSettings({ department })}
        />
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">{t('settings.statuses')}</h2>
        <p className="text-sm text-muted">{t('settings.statusesLead')}</p>
        {statuses.map((status) => (
          <div key={status.id} className="flex min-w-0 flex-col gap-2 rounded-xl bg-cream p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={statusLabel(locale, status)}
              onChange={(e) => void db.statuses.update(status.id, { name: e.target.value })}
              className="field min-w-0 flex-1 text-sm font-semibold"
            />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
              type="color"
              value={status.color}
              onChange={(e) =>
                void db.statuses.update(status.id, { color: e.target.value, bg: tint(e.target.value) })
              }
              className="h-11 w-12 rounded"
            />
            <label className="min-h-11 text-xs font-semibold text-navy">
              <input
                type="checkbox"
                checked={Boolean(status.isDefaultEmpty)}
                onChange={async (e) => {
                  if (e.target.checked) {
                    await db.transaction('rw', db.statuses, async () => {
                      const all = await db.statuses.toArray()
                      for (const item of all) {
                        await db.statuses.update(item.id, { isDefaultEmpty: item.id === status.id })
                      }
                    })
                  }
                }}
              />{' '}
              {t('settings.default')}
            </label>
            <button
              type="button"
              className="btn-danger min-h-11 px-3 text-xs"
              onClick={async () => {
                if (statuses.length <= 1) return
                if (!confirm(t('settings.deleteStatus', { name: statusLabel(locale, status) }))) return
                await db.statuses.delete(status.id)
              }}
            >
              {t('settings.delete')}
            </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn-primary px-4 text-sm"
          onClick={async () => {
            const status: StatusDefinition = {
              id: uid(),
              name: t('settings.newStatus'),
              color: '#24364A',
              bg: '#E8EDF1',
              order: statuses.length,
            }
            await db.statuses.add(status)
          }}
        >
          {t('settings.addStatus')}
        </button>
        <button
          type="button"
          className="btn-ghost px-4 text-sm"
          onClick={async () => {
            if (!confirm(t('settings.restoreStatusesConfirm'))) return
            await db.statuses.clear()
            await db.statuses.bulkAdd(DEFAULT_STATUSES)
          }}
        >
          {t('settings.restoreStatuses')}
        </button>
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">{t('settings.hotelRooms')}</h2>
        <p className="text-sm text-muted">{t('settings.activeRooms', { n: hotelRooms.length })}</p>
        <div className="flex min-w-0 gap-2">
          <input
            value={roomDraft}
            onChange={(e) => setRoomDraft(e.target.value)}
            placeholder={t('settings.addRoomPlaceholder')}
            className="field min-w-0 flex-1"
          />
          <button
            type="button"
            className="btn-primary shrink-0 px-3 text-sm sm:px-4"
            onClick={() => {
              const room = roomDraft.trim()
              if (!room) return
              void saveSettings({ extraRooms: uniqueRooms([...settings.extraRooms, room]) })
              setRoomDraft('')
            }}
          >
            {t('settings.add')}
          </button>
        </div>
        <div className="space-y-2">
          {HOTEL_RANGES.map((range) => {
            const rooms = hotelRooms.filter((room) => floorOfRoom(room) === range.floor)
            return (
              <details key={range.floor} className="rounded-xl bg-cream px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-navy">
                  {t('settings.floorRooms', { floor: range.floor, n: rooms.length })}
                </summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {rooms.map((room) => (
                    <button
                      key={room}
                      type="button"
                      title={t('settings.hideRoom')}
                      className="min-h-10 rounded-md bg-paper px-3 py-2 text-xs font-semibold"
                      onClick={() => void saveSettings({ hiddenRooms: uniqueRooms([...settings.hiddenRooms, room]) })}
                    >
                      {room} ×
                    </button>
                  ))}
                </div>
              </details>
            )
          })}
          {hotelRooms.some((room) => {
            const floor = floorOfRoom(room)
            return !floor || !HOTEL_RANGES.some((range) => range.floor === floor)
          }) && (
            <details className="rounded-xl bg-cream px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold text-navy">{t('settings.extraRooms')}</summary>
              <div className="mt-2 flex flex-wrap gap-1">
                {hotelRooms
                  .filter((room) => {
                    const floor = floorOfRoom(room)
                    return !floor || !HOTEL_RANGES.some((range) => range.floor === floor)
                  })
                  .map((room) => (
                    <button
                      key={room}
                      type="button"
                      className="min-h-10 rounded-md bg-paper px-3 py-2 text-xs font-semibold"
                      onClick={() => void saveSettings({ hiddenRooms: uniqueRooms([...settings.hiddenRooms, room]) })}
                    >
                      {room} ×
                    </button>
                  ))}
              </div>
            </details>
          )}
        </div>
        {settings.hiddenRooms.length > 0 && (
          <button
            type="button"
            className="text-xs font-semibold text-navy"
            onClick={() => void saveSettings({ hiddenRooms: [] })}
          >
            {t('settings.restoreHidden', { n: settings.hiddenRooms.length })}
          </button>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="field mt-1 font-medium" />
    </label>
  )
}
