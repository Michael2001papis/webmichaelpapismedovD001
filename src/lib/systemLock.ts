import { useEffect, useState } from 'react'
import { LOCK_EVENT, readLocalLock } from './localAdmin'

export type SystemStatus = {
  locked: boolean
  ready: boolean
  error: boolean
}

export function useSystemStatus(): SystemStatus {
  const [locked, setLocked] = useState(() => readLocalLock().locked)

  useEffect(() => {
    const sync = () => setLocked(readLocalLock().locked)
    window.addEventListener(LOCK_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(LOCK_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { locked, ready: true, error: false }
}
