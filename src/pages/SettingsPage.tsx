import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadBackup, restoreBackup } from '../lib/backup'
import { tint } from '../lib/color'
import { db, DEFAULT_SETTINGS, DEFAULT_STATUSES } from '../lib/db'
import { uid } from '../lib/id'
import { defaultHotelRooms, floorOfRoom, HOTEL_RANGES, uniqueRooms } from '../lib/rooms'
import type { StatusDefinition } from '../types'

export function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []
  const [roomDraft, setRoomDraft] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const hotelRooms = uniqueRooms([...defaultHotelRooms(), ...settings.extraRooms]).filter(
    (room) => !settings.hiddenRooms.includes(room),
  )

  async function saveSettings(patch: Partial<typeof settings>) {
    await db.settings.put({ ...settings, ...patch })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">הגדרות</h1>
        <p className="mt-1 text-sm text-muted">פרטי דוח, סטטוסים, חדרי מלון וגיבוי מקומי.</p>
      </div>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">גיבוי ושחזור</h2>
        <p className="text-sm text-muted">
          הנתונים נשמרים בדפדפן הזה בלבד. כדאי להוריד גיבוי אחרי יום עבודה, במיוחד לפני ניקוי היסטוריה.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 text-sm"
            onClick={async () => {
              await downloadBackup()
              setBackupMsg('הגיבוי ירד לקובץ JSON במחשב.')
            }}
          >
            הורד גיבוי
          </button>
          <button type="button" className="btn-secondary px-4 text-sm" onClick={() => fileRef.current?.click()}>
            שחזר מגיבוי
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
              if (!confirm('שחזור יחליף את כל הבדיקות, התבניות וההגדרות הקיימות. להמשיך?')) return
              try {
                await restoreBackup(file)
                setBackupMsg('הגיבוי שוחזר בהצלחה.')
              } catch {
                setBackupMsg('לא הצלחתי לקרוא את קובץ הגיבוי.')
              }
            }}
          />
        </div>
        {backupMsg ? <div className="text-sm font-semibold text-navy">{backupMsg}</div> : null}
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">פרטי דוח</h2>
        <Field label="שם מבצע" value={settings.performer} onChange={(performer) => void saveSettings({ performer })} />
        <Field label="מלון" value={settings.hotel} onChange={(hotel) => void saveSettings({ hotel })} />
        <Field label="מחלקה" value={settings.department} onChange={(department) => void saveSettings({ department })} />
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">סטטוסים</h2>
        <p className="text-sm text-muted">אפשר להוסיף, לשנות שם ולמחוק סטטוסים. הסטטוס עם סימון ברירת מחדל יופיע במשבצות חדשות.</p>
        {statuses.map((status) => (
          <div key={status.id} className="flex min-w-0 flex-col gap-2 rounded-xl bg-cream p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={status.name}
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
              ברירת מחדל
            </label>
            <button
              type="button"
              className="btn-danger min-h-11 px-3 text-xs"
              onClick={async () => {
                if (statuses.length <= 1) return
                if (!confirm(`למחוק את הסטטוס ${status.name}?`)) return
                await db.statuses.delete(status.id)
              }}
            >
              מחק
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
              name: 'סטטוס חדש',
              color: '#24364A',
              bg: '#E8EDF1',
              order: statuses.length,
            }
            await db.statuses.add(status)
          }}
        >
          הוסף סטטוס
        </button>
        <button
          type="button"
          className="btn-ghost px-4 text-sm"
          onClick={async () => {
            if (!confirm('לשחזר את הסטטוסים המקוריים?')) return
            await db.statuses.clear()
            await db.statuses.bulkAdd(DEFAULT_STATUSES)
          }}
        >
          שחזר סטטוסים מקוריים
        </button>
      </section>

      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">חדרי מלון</h2>
        <p className="text-sm text-muted">{hotelRooms.length} חדרים פעילים. לחצו על קומה כדי להסתיר חדר בודד.</p>
        <div className="flex min-w-0 gap-2">
          <input
            value={roomDraft}
            onChange={(e) => setRoomDraft(e.target.value)}
            placeholder="הוסף חדר, למשל 250"
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
            הוסף
          </button>
        </div>
        <div className="space-y-2">
          {HOTEL_RANGES.map((range) => {
            const rooms = hotelRooms.filter((room) => floorOfRoom(room) === range.floor)
            return (
              <details key={range.floor} className="rounded-xl bg-cream px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-navy">
                  קומה {range.floor} · {rooms.length} חדרים
                </summary>
                <div className="mt-2 flex flex-wrap gap-1">
                  {rooms.map((room) => (
                    <button
                      key={room}
                      type="button"
                      title="הסתר חדר"
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
              <summary className="cursor-pointer text-sm font-semibold text-navy">חדרים נוספים</summary>
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
            שחזר חדרים מוסתרים ({settings.hiddenRooms.length})
          </button>
        )}
      </section>

      <section className="card space-y-2 p-4 sm:p-5">
        <h2 className="font-semibold text-navy">כניסת מנהל</h2>
        <p className="text-sm text-muted">
          הכניסה למסך הניהול היא בחירה בלבד ואינה מופיעה בפתיחת האתר.
        </p>
        <Link to="/admin" className="btn-ghost w-full text-sm sm:w-auto">
          כניסה למסך ניהול
        </Link>
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
