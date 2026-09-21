import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../lib/id'

export function MaintenanceScreen() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream text-ink">
      <header className="border-b border-line bg-paper px-4 py-3">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Holikar</div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper text-navy">
          <Lock size={22} strokeWidth={1.6} />
        </div>
        <div className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Holikar</div>
        <h1 className="mt-3 text-xl font-bold break-words text-navy sm:text-2xl md:text-3xl">Holikar אינה זמינה כרגע</h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          המערכת סגורה זמנית על ידי מנהל המערכת.
          <br />
          ניתן יהיה להשתמש בה שוב לאחר הפעלה מחדש.
        </p>
        <p className="mt-6 text-xs text-muted">{formatDateTime(Date.now())}</p>
      </main>
      <footer className="px-4 py-4 text-center text-[10px] text-muted" dir="ltr">
        © 2026 Michael Papismedov | Holikar
        <Link to="/admin" className="ms-3 text-muted/40 hover:text-muted">
          Admin
        </Link>
      </footer>
    </div>
  )
}
