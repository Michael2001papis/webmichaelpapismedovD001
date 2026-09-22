/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createInspection } from '../lib/db'
import { parseInspectionRequest, suggestInspectionName } from '../lib/parser'
import { resolveHotelRooms } from '../lib/rooms'
import { useSession } from '../lib/sessionContext'
import type { AppSettings } from '../types'
import { CheckEditor } from './CheckEditor'
import { RoomPicker } from './RoomPicker'

export function Composer({ settings }: { settings: AppSettings }) {
  const { t, locale, session } = useSession()
  const navigate = useNavigate()
  const example = t('composer.example')
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
    setName((current) => current || suggestInspectionName(result.checks, Date.now(), locale))
  }, [text, formDirty, hotelRooms, locale])

  function applyParse() {
    const result = parseInspectionRequest(text)
    setRooms(result.allRooms ? hotelRooms : result.rooms)
    setChecks(result.checks)
    if (!name) setName(suggestInspectionName(result.checks, Date.now(), locale))
    setFormDirty(false)
  }

  async function create() {
    if (rooms.length === 0 || checks.filter((item) => item.trim()).length === 0) return
    setBusy(true)
    try {
      const id = await createInspection({
        name: name || suggestInspectionName(checks, Date.now(), locale),
        rooms,
        checks,
        performer: session?.name,
      })
      navigate(`/inspection/${id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="composer" className="card min-w-0 overflow-hidden p-4 sm:p-6">
      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">{t('composer.kicker')}</div>
        <h2 className="mt-1 text-xl font-bold text-navy sm:text-2xl">{t('composer.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('composer.lead')}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="field min-h-36 resize-y text-base leading-7"
        placeholder={example}
      />

      {(parsed.rooms.length > 0 || parsed.checks.length > 0 || parsed.allRooms) && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <span className="text-muted">{t('composer.roomsFound')} </span>
            {(parsed.allRooms ? [t('composer.allHotelRooms')] : parsed.rooms).map((room) => (
              <span key={room} className="ml-1 inline-block rounded-md bg-cream px-2 py-0.5 text-xs font-semibold text-navy">
                {room}
              </span>
            ))}
          </div>
          <div>
            <span className="text-muted">{t('composer.checksFound')} </span>
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
          {t('composer.identify')}
        </button>
        <button type="button" onClick={() => setManual(true)} className="btn-secondary w-full lg:w-auto">
          {t('composer.manual')}
        </button>
        <Link to="/templates" className="btn-secondary w-full lg:w-auto">
          {t('composer.loadTemplate')}
        </Link>
        <button
          type="button"
          onClick={() => {
            setFormDirty(false)
            setText(example)
            const result = parseInspectionRequest(example)
            setRooms(result.rooms)
            setChecks(result.checks)
            setName(suggestInspectionName(result.checks, Date.now(), locale))
          }}
          className="btn-ghost w-full lg:w-auto"
        >
          {t('composer.loadExample')}
        </button>
      </div>

      {(rooms.length > 0 || checks.length > 0 || parsed.rooms.length > 0 || manual) && (
        <div className="mt-5 space-y-4 rounded-[12px] border border-line bg-cream/60 p-3 sm:p-4">
          <label className="block text-sm font-semibold text-navy">
            {t('composer.inspectionName')}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field mt-1 font-medium"
              placeholder={t('composer.namePlaceholder')}
            />
          </label>
          <div>
            <div className="mb-2 text-sm font-semibold text-navy">{t('composer.rooms')}</div>
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
            <div className="mb-2 text-sm font-semibold text-navy">{t('composer.columns')}</div>
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
            {busy ? t('composer.creating') : t('composer.create')}
          </button>
        </div>
      )}
    </section>
  )
}
