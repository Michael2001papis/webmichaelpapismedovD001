import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckEditor } from '../components/CheckEditor'
import { RoomPicker } from '../components/RoomPicker'
import { createInspection, db, DEFAULT_SETTINGS } from '../lib/db'
import { uid } from '../lib/id'
import { suggestInspectionName } from '../lib/parser'
import { resolveHotelRooms } from '../lib/rooms'

export function TemplatesPage() {
  const templates = useLiveQuery(() => db.templates.orderBy('createdAt').reverse().toArray()) ?? []
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const hotelRooms = resolveHotelRooms(settings.extraRooms, settings.hiddenRooms)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  const [newCols, setNewCols] = useState<string[]>([])
  const navigate = useNavigate()
  const active = templates.find((template) => template.id === activeId)

  async function start() {
    if (!active || rooms.length === 0) return
    const id = await createInspection({
      name: suggestInspectionName(active.columns),
      rooms,
      checks: active.columns,
    })
    navigate(`/inspection/${id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">תבניות</h1>
        <p className="mt-1 text-sm text-muted">פתחו תבנית, בחרו חדרים, והתחילו לעבוד מיד.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActiveId(template.id)}
            className={`min-w-0 rounded-[14px] border p-4 text-right transition-colors duration-150 ${
              activeId === template.id
                ? 'border-gold bg-navy text-paper'
                : 'card hover:border-navy/20'
            }`}
          >
            <div className="text-lg font-semibold break-words">{template.name}</div>
            <div className={`mt-1 text-xs break-words ${activeId === template.id ? 'text-paper/70' : 'text-muted'}`}>
              {template.columns.join(' · ')}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="min-w-0 text-lg font-semibold break-words text-navy">התחל מ{active.name}</h2>
            <button
              type="button"
              className="btn-danger min-h-11 w-full px-3 text-xs sm:w-auto"
              onClick={() => {
                if (!confirm(`למחוק את התבנית ${active.name}?`)) return
                void db.templates.delete(active.id)
              }}
            >
              מחק תבנית
            </button>
          </div>
          <RoomPicker hotelRooms={hotelRooms} value={rooms} onChange={setRooms} />
          <button
            type="button"
            onClick={() => void start()}
            disabled={rooms.length === 0}
            className="btn-primary mt-4 w-full py-3"
          >
            צור טבלה מהתבנית
          </button>
        </section>
      )}

      <section className="card p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold text-navy">תבנית חדשה</h2>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם התבנית, למשל בדיקת מזגנים"
          className="field mb-3"
        />
        <CheckEditor value={newCols} onChange={setNewCols} />
        <button
          type="button"
          className="btn-primary mt-3 px-4 text-sm"
          disabled={!newName.trim() || newCols.length === 0}
          onClick={async () => {
            await db.templates.add({
              id: uid(),
              name: newName.trim(),
              columns: newCols.filter(Boolean),
              createdAt: Date.now(),
            })
            setNewName('')
            setNewCols([])
          }}
        >
          שמור תבנית
        </button>
      </section>
    </div>
  )
}
