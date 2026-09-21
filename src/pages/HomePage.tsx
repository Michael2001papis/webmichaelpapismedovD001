import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Composer } from '../components/Composer'
import { Dashboard } from '../components/Dashboard'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { formatDateTime } from '../lib/id'
import { workflowLabel } from '../lib/stats'

export function HomePage() {
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const statuses = useLiveQuery(() => db.statuses.orderBy('order').toArray()) ?? []
  const inspections = useLiveQuery(() => db.inspections.orderBy('updatedAt').reverse().toArray()) ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-navy">שלום {firstName(settings.performer)}</h1>
        <p className="text-sm text-muted">כתוב מה צריך לבדוק — תוך שניות תהיה טבלת עבודה מוכנה.</p>
      </div>
      <Composer settings={settings} />
      <Dashboard inspections={inspections} statuses={statuses} />
      {inspections.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">בדיקות אחרונות</h2>
            <Link to="/archive" className="text-sm font-bold text-sea">
              לכל הארכיון
            </Link>
          </div>
          <div className="space-y-2">
            {inspections.slice(0, 5).map((inspection) => (
              <Link
                key={inspection.id}
                to={`/inspection/${inspection.id}`}
                className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3 shadow-sm"
              >
                <div>
                  <div className="font-extrabold">{inspection.name}</div>
                  <div className="text-xs text-muted">
                    {formatDateTime(inspection.updatedAt)} · {inspection.rooms.length} חדרים
                  </div>
                </div>
                <div className="text-xs font-bold text-sea">{workflowLabel[inspection.workflowStatus]}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function firstName(full: string) {
  return full.split(' ')[0] || full
}
