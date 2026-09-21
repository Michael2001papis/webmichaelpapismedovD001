/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { Lock } from 'lucide-react'
import { COPYRIGHT } from '../config/copyright'

export function MaintenanceScreen() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream text-ink">
      <header className="border-b border-line bg-paper px-4 py-3 sm:px-6">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Holikar</div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-16">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper text-navy">
          <Lock size={22} strokeWidth={1.6} />
        </div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl md:text-3xl">Holikar סגורה כרגע</h1>
        <p className="mt-4 max-w-sm text-sm leading-7 text-ink sm:text-base">
          המערכת אינה זמינה לשימוש כעת.
          <br />
          ניתן יהיה להיכנס שוב לאחר הפעלה מחדש.
        </p>
        <p className="mt-5 text-xs leading-6 text-muted sm:text-sm">המערכת נסגרה זמנית על ידי מנהל המערכת.</p>
      </main>
      <footer className="px-4 py-5 text-center text-[10px] leading-4 tracking-wide text-balance text-muted/80 sm:text-[11px]" dir="ltr">
        {COPYRIGHT.text}
      </footer>
    </div>
  )
}
