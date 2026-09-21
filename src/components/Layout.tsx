/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import {
  Archive,
  ClipboardList,
  FileBarChart,
  Home,
  PlusSquare,
  Settings,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { NavLink, Outlet } from 'react-router-dom'
import { COPYRIGHT } from '../config/copyright'
import { db, DEFAULT_SETTINGS } from '../lib/db'
import { cn, formatDate } from '../lib/id'

const nav = [
  { to: '/', label: 'בית', short: 'בית', icon: Home, end: true },
  { to: '/new', label: 'בדיקה חדשה', short: 'חדשה', icon: PlusSquare, end: false },
  { to: '/archive', label: 'ארכיון', short: 'ארכיון', icon: Archive, end: false },
  { to: '/templates', label: 'תבניות', short: 'תבניות', icon: ClipboardList, end: false },
  { to: '/reports', label: 'דוחות', short: 'דוחות', icon: FileBarChart, end: false },
  { to: '/settings', label: 'הגדרות', short: 'הגדרות', icon: Settings, end: false },
]

export function Layout() {
  const settings = useLiveQuery(() => db.settings.get('main')) ?? DEFAULT_SETTINGS
  const today = formatDate(Date.now())

  return (
    <div className="min-h-dvh overflow-x-hidden bg-cream text-ink">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-paper">
        <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 md:px-6 md:py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold tracking-[0.22em] text-gold uppercase sm:text-[11px]">Holikar</div>
            <div className="truncate text-xs font-semibold text-navy sm:text-sm">{settings.hotel}</div>
          </div>
          <div className="hidden shrink-0 text-center text-xs text-muted md:block">{today}</div>
          <div className="min-w-0 max-w-[46%] text-left text-[11px] leading-4 sm:max-w-none sm:text-xs sm:leading-5">
            <div className="truncate font-semibold text-navy">{settings.performer}</div>
            <div className="hidden truncate text-muted min-[360px]:block">{settings.department}</div>
          </div>
        </div>
      </header>

      <div className="md:flex md:min-h-[calc(100dvh-3.35rem)]">
        <aside className="no-print hidden w-60 shrink-0 bg-navy-2 text-paper lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="text-[11px] font-semibold tracking-[0.28em] text-gold uppercase">Holikar</div>
            <div className="mt-1 text-sm font-medium text-paper/80">ניהול אחזקה</div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'border-s-2 border-gold bg-white/10 text-paper'
                      : 'border-s-2 border-transparent text-paper/75 hover:bg-white/5 hover:text-paper',
                  )
                }
              >
                <item.icon size={18} strokeWidth={1.7} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-28 sm:px-4 sm:py-5 lg:px-6 lg:py-7 lg:pb-8 xl:max-w-[1440px]">
            <Outlet />
          </main>
          <footer className="no-print hidden border-t border-line px-6 py-4 text-center text-[11px] text-muted lg:block" dir="ltr">
            {COPYRIGHT.text}
          </footer>
        </div>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 px-0.5 text-[9px] font-semibold min-[360px]:min-h-14 min-[360px]:text-[10px]',
                isActive ? 'text-navy' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} strokeWidth={isActive ? 2 : 1.7} />
                <span className="max-w-full truncate leading-none">{item.short}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <footer className="no-print px-3 pb-[calc(4.4rem+env(safe-area-inset-bottom))] pt-2 text-center text-[10px] leading-4 text-balance text-muted sm:px-4 lg:hidden" dir="ltr">
        {COPYRIGHT.text}
      </footer>
    </div>
  )
}
