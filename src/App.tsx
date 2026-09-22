/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EntryScreen } from './components/EntryScreen'
import { Layout } from './components/Layout'
import { MaintenanceScreen } from './components/MaintenanceScreen'
import { SITE_ENABLED } from './config/siteStatus'
import { SessionProvider, useSession } from './lib/sessionContext'
import { ArchivePage } from './pages/ArchivePage'
import { HomePage } from './pages/HomePage'
import { InspectionPage } from './pages/InspectionPage'
import { NewInspectionPage } from './pages/NewInspectionPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TemplatesPage } from './pages/TemplatesPage'

export default function App() {
  return (
    <SessionProvider>
      <AppBody />
    </SessionProvider>
  )
}

function AppBody() {
  const { session } = useSession()

  if (!SITE_ENABLED) return <MaintenanceScreen />
  if (!session) return <EntryScreen />

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/new" element={<NewInspectionPage />} />
          <Route path="/inspection/:id" element={<InspectionPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
