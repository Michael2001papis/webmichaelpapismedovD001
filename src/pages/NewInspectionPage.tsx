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
import { Composer } from '../components/Composer'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { useSession } from '../lib/sessionContext'

export function NewInspectionPage() {
  const { t } = useSession()
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS

  return (
    <div className="holikar-stack space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">{t('new.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('new.lead')}</p>
      </div>
      <Composer settings={settings} />
    </div>
  )
}
