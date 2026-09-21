import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createInspection } from '../lib/db'
import { parseInspectionRequest, suggestInspectionName } from '../lib/parser'
import { resolveHotelRooms } from '../lib/rooms'
import type { AppSettings } from '../types'
import { CheckEditor } from './CheckEditor'
import { RoomPicker } from './RoomPicker'

const EXAMPLE =
  'לדוגמה: חדרים 201, 217, 241 ו-249 — בדיקת שיפוע מזגן, ניקוז ודלת כניסה.'

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
    <section id="composer" className="card min-w-0 overflow-hidden p-4 sm:p-6">
      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">יצירת בדיקה</div>
        <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">מה צריך לבדוק היום?</h2>
        <p className="mt-1 text-sm text-muted">
          כתבו בשפה חופשית את החדרים ואת הבדיקות. המערכת תזהה לבד ותבנה טבלה.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="field min-h-36 resize-y text-base leading-7"
        placeholder={EXAMPLE}
      />

      {(parsed.rooms.length > 0 || parsed.checks.length > 0 || parsed.allRooms) && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <span className="text-muted">חדרים שזוהו: </span>
            {(parsed.allRooms ? ['כל חדרי המלון'] : parsed.rooms).map((room) => (
              <span key={room} className="ml-1 inline-block rounded-md bg-cream px-2 py-0.5 text-xs font-semibold text-navy">
                {room}
              </span>
            ))}
          </div>
          <div>
            <span className="text-muted">בדיקות שזוהו: </span>
            {parsed.checks.map((check) => (
              <span key={check} className="ml-1 inline-block rounded-md bg-gold/15 px-2 py-0.5 text-xs font-semibold text-navy">
                {check}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:flex lg:flex-wrap">
        <button type="button" onClick={applyParse} className="btn-primary w-full lg:w-auto">
          זהה חדרים ובדיקות
        </button>
        <button type="button" onClick={() => setManual(true)} className="btn-secondary w-full lg:w-auto">
          בנייה ידנית
        </button>
        <Link to="/templates" className="btn-secondary w-full lg:w-auto">
          טען תבנית
        </Link>
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
          className="btn-ghost w-full lg:w-auto"
        >
          טען דוגמה
        </button>
      </div>

      {(rooms.length > 0 || checks.length > 0 || parsed.rooms.length > 0 || manual) && (
        <div className="mt-5 space-y-4 rounded-[12px] border border-line bg-cream/60 p-3 sm:p-4">
          <label className="block text-sm font-semibold text-navy">
            שם הבדיקה
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field mt-1 font-medium"
              placeholder="למשל בדיקת מזגנים"
            />
          </label>
          <div>
            <div className="mb-2 text-sm font-semibold text-navy">חדרים</div>
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
            <div className="mb-2 text-sm font-semibold text-navy">עמודות בדיקה</div>
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
            className="btn-primary w-full py-3 text-base"
          >
            {busy ? 'יוצר טבלה...' : 'צור טבלת עבודה'}
          </button>
        </div>
      )}
    </section>
  )
}
