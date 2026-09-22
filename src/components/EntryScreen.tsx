/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { COPYRIGHT } from '../config/copyright'
import { t, type MessageKey } from '../i18n'
import type { Density, Locale } from '../i18n/types'
import { applySessionToDocument } from '../lib/session'
import { useSession } from '../lib/sessionContext'
import { cn } from '../lib/id'

const LANGUAGES: Locale[] = ['he', 'ru', 'en']
const LANG_KEYS: Record<Locale, MessageKey> = { he: 'lang.he', ru: 'lang.ru', en: 'lang.en' }
const DENSITIES: Density[] = ['fast', 'regular']

export function EntryScreen() {
  const { enter } = useSession()
  const [name, setName] = useState('')
  const [locale, setLocale] = useState<Locale>('he')
  const [density, setDensity] = useState<Density>('regular')
  const [error, setError] = useState('')

  useEffect(() => {
    applySessionToDocument(null, locale, density)
  }, [locale, density])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t(locale, 'entry.nameRequired'))
      return
    }
    await enter({ name: trimmed, locale, density })
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream text-ink">
      <header className="border-b border-line bg-paper px-4 py-3 sm:px-6">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Holikar</div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-5 sm:py-12">
        <form className="card min-w-0 overflow-hidden p-4 sm:p-6" onSubmit={(e) => void submit(e)}>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">{t(locale, 'entry.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t(locale, 'entry.subtitle')}</p>

          <label className="mt-5 block text-sm font-semibold text-navy">
            {t(locale, 'entry.name')}
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              className="field mt-1"
              autoComplete="name"
              autoFocus
              placeholder={t(locale, 'entry.namePlaceholder')}
            />
          </label>
          {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-navy">{t(locale, 'entry.language')}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {LANGUAGES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLocale(item)}
                  className={cn(
                    'min-h-12 rounded-[12px] border px-1 py-2 text-[11px] font-semibold min-[360px]:px-2 min-[360px]:text-sm',
                    locale === item ? 'border-navy bg-navy text-paper' : 'border-line bg-paper text-navy',
                  )}
                >
                  {t(locale, LANG_KEYS[item])}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-navy">{t(locale, 'entry.density')}</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {DENSITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDensity(item)}
                  className={cn(
                    'rounded-[12px] border px-3 py-3 text-start',
                    density === item ? 'border-navy bg-navy text-paper' : 'border-line bg-paper text-navy',
                  )}
                >
                  <div className="text-sm font-semibold">
                    {item === 'fast' ? t(locale, 'entry.fast') : t(locale, 'entry.regular')}
                  </div>
                  <div className={`mt-1 text-[11px] leading-4 ${density === item ? 'text-paper/75' : 'text-muted'}`}>
                    {item === 'fast' ? t(locale, 'entry.fastHint') : t(locale, 'entry.regularHint')}
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn-primary mt-6 w-full">
            {t(locale, 'entry.enter')}
          </button>
        </form>
      </main>
      <footer className="px-4 py-5 text-center text-[10px] leading-4 tracking-wide text-balance text-muted/80 sm:text-[11px]" dir="ltr">
        {COPYRIGHT.text}
      </footer>
    </div>
  )
}
