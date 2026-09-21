import { FileDown, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InspectionTable } from '../components/InspectionTable'
import { MobileRoomWork } from '../components/MobileRoomWork'
import { ReportDocument } from '../components/ReportDocument'
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
import { cellOf, computeInspectionStats, emptyStatusId, workflowLabel } from '../lib/stats'

export function InspectionPage() {
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
  const reportRef = useRef<HTMLDivElement>(null)
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
    return <div className="rounded-3xl bg-paper p-6">טוען בדיקה...</div>
  }
  if (!inspection) {
    return (
      <div className="rounded-3xl bg-paper p-6">
        הבדיקה לא נמצאה. <Link to="/" className="font-bold text-sea">חזרה לבית</Link>
      </div>
    )
  }

  const columns = [...inspection.columns].sort((a, b) => a.order - b.order)
  const missing = emptyStatusId(statuses)
  const okId = statuses.find((status) => status.id === 'ok')?.id
  const viewInspection = onlyIssues ? { ...inspection, rooms: issueRooms } : inspection
  const reportName = name || inspection.name

  async function downloadPdf() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const { exportElementToPdf } = await import('../lib/exportPdf')
      await exportElementToPdf(reportRef.current, reportName)
    } finally {
      setExporting(false)
    }
  }

  async function downloadExcel() {
    if (!inspection) return
    const { exportInspectionExcel } = await import('../lib/exportExcel')
    exportInspectionExcel(inspection, statuses)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-paper p-4 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent text-2xl font-black outline-none"
        />
        <div className="mt-1 text-xs text-muted">
          {formatDateTime(inspection.createdAt)} · {inspection.performer} · {inspection.hotel} · {workflowLabel[inspection.workflowStatus]}
        </div>
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Mini label="חדרים" value={`${stats.checkedRooms}/${stats.totalRooms}`} />
            <Mini label="תקינים" value={String(stats.byStatus.ok ?? 0)} />
            <Mini label="לא תקינים" value={String(stats.byStatus.bad ?? 0)} />
            <Mini label="חסר מידע" value={String(stats.byStatus.missing ?? stats.byStatus[missing] ?? 0)} />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void downloadExcel()} className="rounded-xl bg-navy px-3 py-2 text-xs font-bold text-cream">
            <span className="inline-flex items-center gap-1"><FileSpreadsheet size={14} /> Excel</span>
          </button>
          <button type="button" onClick={() => void downloadPdf()} className="rounded-xl bg-navy px-3 py-2 text-xs font-bold text-cream">
            <span className="inline-flex items-center gap-1"><FileDown size={14} /> {exporting ? 'מכין PDF...' : 'PDF'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTemplateName(inspection.name)
              setTemplateOpen(true)
            }}
            className="rounded-xl bg-cream px-3 py-2 text-xs font-bold"
          >
            שמור כתבנית
          </button>
          {okId && (
            <button
              type="button"
              onClick={() => {
                if (!confirm('לסמן את כל המשבצות בבדיקה כתקינות?')) return
                void markAllRoomsStatus(inspection.id, okId)
              }}
              className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800"
            >
              סמן הכל תקין
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!confirm('למחוק את הבדיקה מהארכיון?')) return
              await db.inspections.delete(inspection.id)
              navigate('/archive')
            }}
            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
          >
            <span className="inline-flex items-center gap-1"><Trash2 size={14} /> מחק</span>
          </button>
        </div>
        {templateOpen && (
          <div className="mt-3 flex gap-2">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="שם התבנית"
            />
            <button
              type="button"
              className="rounded-xl bg-sea px-3 py-2 text-xs font-bold text-white"
              onClick={async () => {
                if (!templateName.trim()) return
                await saveAsTemplate(inspection, templateName)
                navigate('/templates')
              }}
            >
              שמור
            </button>
            <button type="button" className="text-xs font-bold text-muted" onClick={() => setTemplateOpen(false)}>
              ביטול
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-56 flex-1 rounded-2xl bg-paper p-1">
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${mode === 'rooms' ? 'bg-navy text-cream' : ''}`}
            onClick={() => setMode('rooms')}
          >
            לפי חדר
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${mode === 'table' ? 'bg-navy text-cream' : ''}`}
            onClick={() => setMode('table')}
          >
            טבלה
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOnlyIssues((value) => !value)}
          className={`rounded-2xl px-4 py-2 text-sm font-bold ${onlyIssues ? 'bg-red-100 text-red-800' : 'bg-paper'}`}
        >
          רק ליקויים ({issueRooms.length})
        </button>
      </div>

      {onlyIssues && issueRooms.length === 0 ? (
        <div className="rounded-3xl bg-paper p-4 text-sm text-muted">אין ליקויים בבדיקה זו.</div>
      ) : mode === 'rooms' ? (
        <MobileRoomWork inspection={viewInspection} statuses={statuses} />
      ) : (
        <InspectionTable inspection={viewInspection} statuses={statuses} />
      )}

      <section className="rounded-3xl bg-paper p-4 shadow-sm">
        <button type="button" className="font-extrabold" onClick={() => setShowColumns((v) => !v)}>
          עמודות בדיקה ({columns.length}) {showColumns ? '▾' : '▸'}
        </button>
        {showColumns && (
          <>
            <div className="mt-3 space-y-2">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center gap-2">
                  <input
                    value={column.name}
                    onChange={(e) => void renameColumn(inspection.id, column.id, e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                  />
                  <button type="button" className="text-xs font-bold" onClick={() => void moveColumn(inspection.id, column.id, -1)}>למעלה</button>
                  <button type="button" className="text-xs font-bold" onClick={() => void moveColumn(inspection.id, column.id, 1)}>למטה</button>
                  <button type="button" className="text-xs font-bold text-red-700" onClick={() => void deleteColumn(inspection.id, column.id)}>מחק</button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                placeholder="הוסף בדיקה חדשה"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCheck.trim()) {
                    void addColumn(inspection.id, newCheck)
                    setNewCheck('')
                  }
                }}
              />
              <button
                type="button"
                className="rounded-xl bg-sea px-3 py-2 text-sm font-bold text-white"
                onClick={() => {
                  if (!newCheck.trim()) return
                  void addColumn(inspection.id, newCheck)
                  setNewCheck('')
                }}
              >
                <span className="inline-flex items-center gap-1"><Plus size={14} /> הוסף</span>
              </button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-3xl bg-paper p-4 shadow-sm">
        <button type="button" className="font-extrabold" onClick={() => setShowRooms((v) => !v)}>
          חדרים ({inspection.rooms.length}) {showRooms ? '▾' : '▸'}
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

      <div aria-hidden="true" className="pointer-events-none absolute left-[-10000px] top-0">
        <div ref={reportRef}>
          <ReportDocument inspection={inspection} statuses={statuses} />
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream px-3 py-2">
      <div className="text-[11px] font-bold text-muted">{label}</div>
      <div className="font-black">{value}</div>
    </div>
  )
}
