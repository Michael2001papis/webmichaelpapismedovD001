import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInspection } from '../lib/db'
import { parseInspectionRequest, suggestInspectionName } from '../lib/parser'
import { resolveHotelRooms } from '../lib/rooms'
import type { AppSettings } from '../types'
import { CheckEditor } from './CheckEditor'
import { RoomPicker } from './RoomPicker'

const EXAMPLE =
  'אני צריך לבדוק בחדרים 201, 217, 241, 249 ו-253: שיפוע מזגן, ניקוז מקלחון, דלת כניסה וכורסאות.'

export function Composer({ settings }: { settings: AppSettings }) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [rooms, setRooms] = useState<string[]>([])
  const [checks, setChecks] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [manual, setManual] = useState(false)
  const parsed = useMemo(() => parseInspectionRequest(text), [text])
  const hotelRooms = useMemo(
    () => resolveHotelRooms(settings.extraRooms, settings.hiddenRooms),
    [settings.extraRooms, settings.hiddenRooms],
  )

  useEffect(() => {
    if (formDirty) return
    const result = parseInspectionRequest(text)
    setRooms(result.allRooms ? hotelRooms : result.rooms)
    setChecks(result.checks)
    setName((current) => current || suggestInspectionName(result.checks))
  }, [text, formDirty, hotelRooms])

  function applyParse() {
    const result = parseInspectionRequest(text)
    setRooms(result.allRooms ? hotelRooms : result.rooms)
    setChecks(result.checks)
    if (!name) setName(suggestInspectionName(result.checks))
    setFormDirty(false)
  }

  async function create() {
    if (rooms.length === 0 || checks.filter((item) => item.trim()).length === 0) return
    setBusy(true)
    try {
      const id = await createInspection({
        name: name || suggestInspectionName(checks),
        rooms,
        checks,
      })
      navigate(`/inspection/${id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl bg-navy p-4 text-cream shadow-xl sm:p-6">
      <div className="mb-4">
        <div className="text-gold text-xs font-bold tracking-wide">יצירת בדיקה חדשה</div>
        <h2 className="mt-1 text-2xl font-extrabold">מה צריך לבדוק היום?</h2>
        <p className="mt-1 text-sm text-cream/70">
          כתוב בשפה חופשית את החדרים ואת הבדיקות. המערכת תזהה לבד ותבנה טבלה.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full resize-y rounded-2xl border-0 bg-navy-2 px-4 py-3 text-base text-cream outline-none ring-2 ring-transparent placeholder:text-cream/35 focus:ring-gold/50"
        placeholder={EXAMPLE}
      />

      {(parsed.rooms.length > 0 || parsed.checks.length > 0 || parsed.allRooms) && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <span className="text-cream/60">חדרים שזוהו: </span>
            {(parsed.allRooms ? ['כל חדרי המלון'] : parsed.rooms).map((room) => (
              <span key={room} className="ml-1 inline-block rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold">
                {room}
              </span>
            ))}
          </div>
          <div>
            <span className="text-cream/60">בדיקות שזוהו: </span>
            {parsed.checks.map((check) => (
              <span key={check} className="ml-1 inline-block rounded-lg bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold">
                {check}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyParse}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-extrabold text-navy"
        >
          זהה חדרים ובדיקות
        </button>
        <button
          type="button"
          onClick={() => {
            setFormDirty(false)
            setText(EXAMPLE)
            const result = parseInspectionRequest(EXAMPLE)
            setRooms(result.rooms)
            setChecks(result.checks)
            setName(suggestInspectionName(result.checks))
          }}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"
        >
          טען דוגמה
        </button>
        <button
          type="button"
          onClick={() => setManual(true)}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold"
        >
          בנייה ידנית
        </button>
      </div>

      {(rooms.length > 0 || checks.length > 0 || parsed.rooms.length > 0 || manual) && (
        <div className="mt-5 space-y-4 rounded-2xl bg-white p-4 text-ink">
          <label className="block text-sm font-bold">
            שם הבדיקה
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-medium"
              placeholder="למשל בדיקת מזגנים"
            />
          </label>
          <div>
            <div className="mb-2 text-sm font-bold">חדרים</div>
            <RoomPicker
              hotelRooms={hotelRooms}
              value={rooms}
              onChange={(next) => {
                setFormDirty(true)
                setRooms(next)
              }}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-bold">עמודות בדיקה</div>
            <CheckEditor
              value={checks}
              onChange={(next) => {
                setFormDirty(true)
                setChecks(next)
              }}
            />
          </div>
          <button
            type="button"
            disabled={busy || rooms.length === 0 || checks.length === 0}
            onClick={create}
            className="w-full rounded-2xl bg-sea py-3 text-base font-extrabold text-white disabled:opacity-40"
          >
            {busy ? 'יוצר טבלה...' : 'צור טבלת עבודה'}
          </button>
        </div>
      )}
    </section>
  )
}
