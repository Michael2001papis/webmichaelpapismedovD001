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
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-navy">תבניות</h1>
      <p className="text-sm text-muted">פתחו תבנית, בחרו חדרים, והתחילו לעבוד מיד.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setActiveId(template.id)}
            className={`rounded-3xl p-4 text-right shadow-sm ${activeId === template.id ? 'bg-navy text-cream' : 'bg-paper'}`}
          >
            <div className="text-lg font-black">{template.name}</div>
            <div className={`mt-1 text-xs ${activeId === template.id ? 'text-cream/70' : 'text-muted'}`}>
              {template.columns.join(' · ')}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <section className="rounded-3xl bg-paper p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">התחל מ{active.name}</h2>
            <button
              type="button"
              className="text-xs font-bold text-red-700"
              onClick={() => void db.templates.delete(active.id)}
            >
              מחק תבנית
            </button>
          </div>
          <RoomPicker hotelRooms={hotelRooms} value={rooms} onChange={setRooms} />
          <button
            type="button"
            onClick={() => void start()}
            disabled={rooms.length === 0}
            className="mt-4 w-full rounded-2xl bg-sea py-3 font-extrabold text-white disabled:opacity-40"
          >
            צור טבלה מהתבנית
          </button>
        </section>
      )}

      <section className="rounded-3xl bg-paper p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-extrabold">תבנית חדשה</h2>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם התבנית, למשל בדיקת מזגנים"
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
        />
        <CheckEditor value={newCols} onChange={setNewCols} />
        <button
          type="button"
          className="mt-3 rounded-2xl bg-navy px-4 py-2 text-sm font-bold text-cream disabled:opacity-40"
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
