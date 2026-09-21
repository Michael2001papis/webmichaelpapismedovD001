import { Archive, ClipboardList, Home, Settings } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { NavLink, Outlet } from 'react-router-dom'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { cn } from '../lib/id'

const nav = [
  { to: '/', label: 'בית', icon: Home, end: true },
  { to: '/archive', label: 'ארכיון', icon: Archive, end: false },
  { to: '/templates', label: 'תבניות', icon: ClipboardList, end: false },
  { to: '/settings', label: 'הגדרות', icon: Settings, end: false },
]

export function Layout() {
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS

  return (
    <div className="min-h-dvh bg-[#eef3f6] text-ink">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-[11px] tracking-[0.22em] text-gold uppercase">Holikar</div>
            <div className="text-sm font-semibold">{settings.hotel} · אחזקה</div>
          </div>
          <div className="hidden text-left text-xs text-cream/70 sm:block">
            {settings.performer}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-3 py-4 pb-24 md:px-4 md:pb-8">
        <aside className="no-print hidden w-52 shrink-0 md:block">
          <nav className="sticky top-20 space-y-1 rounded-2xl bg-paper p-2 shadow-sm">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-navy text-cream' : 'text-navy-2 hover:bg-cream',
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 hidden grid-cols-4 border-t border-slate-200 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur max-md:grid">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-[11px] font-semibold',
                isActive ? 'text-sea' : 'text-muted',
              )
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
