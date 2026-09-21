import { useEffect, useState } from 'react'

export type SystemStatus = {
  locked: boolean
  ready: boolean
  error: boolean
}

const POLL_MS = 12000

export function useSystemStatus(): SystemStatus {
  const [state, setState] = useState<SystemStatus>({ locked: false, ready: false, error: false })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/system-status', { credentials: 'include', cache: 'no-store' })
        const text = await res.text()
        if (cancelled) return
        try {
          const data = JSON.parse(text) as { locked?: boolean }
          if (!res.ok) {
            setState((prev) => ({ locked: prev.ready ? prev.locked : false, ready: true, error: true }))
            return
          }
          setState({ locked: Boolean(data.locked), ready: true, error: false })
        } catch {
          setState((prev) => ({ locked: prev.ready ? prev.locked : false, ready: true, error: true }))
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ locked: prev.ready ? prev.locked : false, ready: true, error: true }))
        }
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), POLL_MS)
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return state
}
