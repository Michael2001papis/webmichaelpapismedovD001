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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold break-words text-navy sm:text-2xl md:text-3xl">שלום {firstName(settings.performer)}</h1>
        <p className="mt-1 text-sm text-muted">סקירה יומית של אחזקת המלון ופתיחת בדיקה חדשה.</p>
      </div>
      <Dashboard inspections={inspections} statuses={statuses} />
      <Composer settings={settings} />
      {inspections.length > 0 && (
        <section>
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <h2 className="min-w-0 text-lg font-semibold text-navy">בדיקות אחרונות</h2>
            <Link to="/archive" className="shrink-0 text-sm font-semibold text-navy hover:text-gold">
              לכל הארכיון
            </Link>
          </div>
          <div className="space-y-2">
            {inspections.slice(0, 5).map((inspection) => (
              <Link
                key={inspection.id}
                to={`/inspection/${inspection.id}`}
                className="card flex min-w-0 items-start justify-between gap-3 px-3 py-3 transition-colors duration-150 hover:border-navy/20 sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-navy">{inspection.name}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {formatDateTime(inspection.updatedAt)} · {inspection.rooms.length} חדרים
                  </div>
                </div>
                <div className="shrink-0 pt-0.5 text-xs font-semibold text-muted">{workflowLabel[inspection.workflowStatus]}</div>
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
