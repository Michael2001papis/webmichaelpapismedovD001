/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { FileDown, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InspectionTable } from '../components/InspectionTable'
import { MobileRoomWork } from '../components/MobileRoomWork'
import { RoomPicker } from '../components/RoomPicker'
import {
  addColumn,
  db,
  DEFAULT_SETTINGS,
  deleteColumn,
  markAllRoomsStatus,
  moveColumn,
  patchInspection,
  renameColumn,
  saveAsTemplate,
  setInspectionRooms,
} from '../lib/db'
import { formatDateTime } from '../lib/id'
import { resolveHotelRooms } from '../lib/rooms'
import { useSession } from '../lib/sessionContext'
import { cellOf, computeInspectionStats, emptyStatusId } from '../lib/stats'
import { workflowLabel } from '../i18n'

export function InspectionPage() {
  const { t, locale } = useSession()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const inspection = useLiveQuery(() => db.inspections.get(id), [id])
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const [mode, setMode] = useState<'rooms' | 'table'>('rooms')
  const [newCheck, setNewCheck] = useState('')
  const [showRooms, setShowRooms] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [name, setName] = useState('')
  const hotelRooms = resolveHotelRooms(settings.extraRooms, settings.hiddenRooms)

  useEffect(() => {
    if (inspection) setName(inspection.name)
  }, [inspection?.id, inspection?.name])

  useEffect(() => {
    if (!inspection || name === inspection.name || !name.trim()) return
    const timer = window.setTimeout(() => {
      void patchInspection(inspection.id, (item) => {
        item.name = name.trim()
      })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [name, inspection])

  const stats = useMemo(
    () => (inspection && statuses.length ? computeInspectionStats(inspection, statuses) : null),
    [inspection, statuses],
  )

  const issueRooms = useMemo(() => {
    if (!inspection || !statuses.length) return []
    const missing = emptyStatusId(statuses)
    return inspection.rooms.filter((room) =>
      inspection.columns.some((column) => {
        const statusId = cellOf(inspection, room, column.id, missing).statusId
        return statusId === 'bad' || statusId === 'watch'
      }),
    )
  }, [inspection, statuses])

  if (inspection === undefined) {
    return <div className="card p-6 text-sm text-muted">{t('inspection.loading')}</div>
  }
  if (!inspection) {
    return (
      <div className="card p-6">
        {t('inspection.missing')}{' '}
        <Link to="/" className="font-semibold text-navy">
          {t('inspection.backHome')}
        </Link>
      </div>
    )
  }

  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const missing = emptyStatusId(statuses)
  const okId = statuses.find((status) => status.id === 'ok')?.id
  const viewInspection = onlyIssues ? { ...inspection, rooms: issueRooms } : inspection
  const reportName = name || inspection.name

  async function downloadPdf() {
    if (!inspection) return
    setExporting(true)
    try {
      const { exportInspectionPdf } = await import('../lib/exportPdf')
      await exportInspectionPdf(inspection, statuses, reportName, locale)
    } finally {
      setExporting(false)
    }
  }

  async function downloadExcel() {
    if (!inspection) return
    const { exportInspectionExcel } = await import('../lib/exportExcel')
    exportInspectionExcel(inspection, statuses, locale)
  }

  return (
    <div className="space-y-4">
      <div className="card min-w-0 overflow-hidden p-3 sm:p-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-w-0 bg-transparent text-xl font-bold text-navy outline-none sm:text-2xl"
        />
        <div className="mt-1 text-xs leading-5 text-muted">
          {formatDateTime(inspection.createdAt, locale)} · {inspection.performer} · {inspection.hotel} ·{' '}
          {workflowLabel(locale, inspection.workflowStatus)}
        </div>
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Mini label={t('inspection.rooms')} value={`${stats.checkedRooms}/${stats.totalRooms}`} />
            <Mini label={t('inspection.ok')} value={String(stats.byStatus.ok ?? 0)} />
            <Mini label={t('inspection.bad')} value={String(stats.byStatus.bad ?? 0)} tone="bad" />
            <Mini label={t('inspection.missingInfo')} value={String(stats.byStatus.missing ?? stats.byStatus[missing] ?? 0)} />
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => void downloadExcel()} className="btn-primary w-full px-3 text-sm sm:w-auto">
            <FileSpreadsheet size={14} strokeWidth={1.7} /> Excel
          </button>
          <button type="button" onClick={() => void downloadPdf()} className="btn-primary w-full px-3 text-sm sm:w-auto">
            <FileDown size={14} strokeWidth={1.7} /> {exporting ? t('inspection.pdfBusy') : 'PDF'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTemplateName(inspection.name)
              setTemplateOpen(true)
            }}
            className="btn-secondary w-full px-3 text-sm sm:w-auto"
          >
            {t('inspection.saveTemplate')}
          </button>
          {okId && (
            <button
              type="button"
              onClick={() => {
                if (!confirm(t('inspection.markAllOkConfirm'))) return
                void markAllRoomsStatus(inspection.id, okId)
              }}
              className="btn-ghost w-full px-3 text-sm sm:w-auto"
            >
              {t('inspection.markAllOk')}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!confirm(t('inspection.deleteConfirm'))) return
              await db.inspections.delete(inspection.id)
              navigate('/archive')
            }}
            className="btn-danger w-full px-3 text-sm sm:w-auto"
          >
            <Trash2 size={14} strokeWidth={1.7} /> {t('inspection.delete')}
          </button>
        </div>
        {templateOpen && (
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="field min-w-0 flex-1 text-sm"
              placeholder={t('inspection.templateName')}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary min-h-11 flex-1 px-3 text-sm sm:flex-none"
                onClick={async () => {
                  if (!templateName.trim()) return
                  await saveAsTemplate(inspection, templateName)
                  navigate('/templates')
                }}
              >
                {t('inspection.save')}
              </button>
              <button type="button" className="btn-ghost min-h-11 flex-1 px-3 text-sm sm:flex-none" onClick={() => setTemplateOpen(false)}>
                {t('inspection.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 rounded-[12px] border border-line bg-paper p-1">
          <button
            type="button"
            className={`min-h-11 flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold ${mode === 'rooms' ? 'bg-navy text-paper' : 'text-navy'}`}
            onClick={() => setMode('rooms')}
          >
            {t('inspection.byRoom')}
          </button>
          <button
            type="button"
            className={`min-h-11 flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold ${mode === 'table' ? 'bg-navy text-paper' : 'text-navy'}`}
            onClick={() => setMode('table')}
          >
            {t('inspection.table')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOnlyIssues((value) => !value)}
          className={`min-h-11 rounded-[12px] px-4 py-2.5 text-sm font-semibold sm:shrink-0 ${onlyIssues ? 'bg-[#f6e8e8] text-bad' : 'card'}`}
        >
          {t('inspection.issuesOnly', { n: issueRooms.length })}
        </button>
      </div>

      {onlyIssues && issueRooms.length === 0 ? (
        <div className="card p-4 text-sm text-muted">{t('inspection.noIssues')}</div>
      ) : mode === 'rooms' ? (
        <MobileRoomWork inspection={viewInspection} statuses={statuses} />
      ) : (
        <InspectionTable inspection={viewInspection} statuses={statuses} />
      )}

      <section className="card p-4">
        <button type="button" className="font-semibold text-navy" onClick={() => setShowColumns((v) => !v)}>
          {t('inspection.columns', { n: columns.length })} {showColumns ? '▾' : '▸'}
        </button>
        {showColumns && (
          <>
            <div className="mt-3 space-y-2">
              {columns.map((column) => (
                <div key={column.id} className="flex min-w-0 flex-col gap-2 rounded-xl bg-cream p-2 sm:flex-row sm:items-center">
                  <input
                    value={column.name}
                    onChange={(e) => void renameColumn(inspection.id, column.id, e.target.value)}
                    className="field min-w-0 flex-1 text-sm font-medium"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost min-h-11 flex-1 px-3 text-xs sm:flex-none" onClick={() => void moveColumn(inspection.id, column.id, -1)}>
                      {t('inspection.up')}
                    </button>
                    <button type="button" className="btn-ghost min-h-11 flex-1 px-3 text-xs sm:flex-none" onClick={() => void moveColumn(inspection.id, column.id, 1)}>
                      {t('inspection.down')}
                    </button>
                    <button type="button" className="btn-danger min-h-11 flex-1 px-3 text-xs sm:flex-none" onClick={() => void deleteColumn(inspection.id, column.id)}>
                      {t('inspection.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex min-w-0 gap-2">
              <input
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                placeholder={t('inspection.addCheck')}
                className="field min-w-0 flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCheck.trim()) {
                    void addColumn(inspection.id, newCheck)
                    setNewCheck('')
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary shrink-0 px-3 text-sm"
                onClick={() => {
                  if (!newCheck.trim()) return
                  void addColumn(inspection.id, newCheck)
                  setNewCheck('')
                }}
              >
                <Plus size={14} strokeWidth={1.7} /> {t('inspection.add')}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card p-4">
        <button type="button" className="font-semibold text-navy" onClick={() => setShowRooms((v) => !v)}>
          {t('inspection.roomsCount', { n: inspection.rooms.length })} {showRooms ? '▾' : '▸'}
        </button>
        {showRooms && (
          <div className="mt-3 space-y-3">
            <RoomPicker
              hotelRooms={hotelRooms}
              value={inspection.rooms}
              onChange={(rooms) => void setInspectionRooms(inspection.id, rooms)}
            />
          </div>
        )}
      </section>

    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="rounded-xl bg-cream px-3 py-2">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className={tone === 'bad' ? 'font-bold text-bad' : 'font-bold text-navy'}>{value}</div>
    </div>
  )
}
