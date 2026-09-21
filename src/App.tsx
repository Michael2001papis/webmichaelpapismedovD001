import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MaintenanceScreen } from './components/MaintenanceScreen'
import { SITE_ENABLED } from './config/siteStatus'
import { ArchivePage } from './pages/ArchivePage'
import { HomePage } from './pages/HomePage'
import { InspectionPage } from './pages/InspectionPage'
import { NewInspectionPage } from './pages/NewInspectionPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TemplatesPage } from './pages/TemplatesPage'

export default function App() {
  if (!SITE_ENABLED) return <MaintenanceScreen />

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
