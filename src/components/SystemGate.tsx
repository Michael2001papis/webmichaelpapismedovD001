import { Outlet } from 'react-router-dom'
import { useSystemStatus } from '../lib/systemLock'
import { MaintenanceScreen } from './MaintenanceScreen'

export function SystemGate() {
  const status = useSystemStatus()

  if (!status.ready) {
    return <div className="min-h-dvh bg-cream" />
  }
  if (status.locked) return <MaintenanceScreen />
  return <Outlet />
}
