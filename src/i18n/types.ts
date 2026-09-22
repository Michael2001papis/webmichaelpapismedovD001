/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

export type Locale = 'he' | 'ru' | 'en'
export type Density = 'fast' | 'regular'

export type Session = {
  name: string
  locale: Locale
  density: Density
  expiresAt: number
}
