/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

/**
 * מקור אחד לזכויות היוצרים.
 * כל מסך, דוח, PDF, Excel וגיבוי מושכים מכאן, בלי לכתוב את הנוסח מחדש.
 */
export const COPYRIGHT = {
  owner: 'Michael Papismedov',
  product: 'Holikar',
  year: 2026,
  text: '© 2026 Michael Papismedov | Holikar | All rights reserved.',
} as const

/** שורה קצרה לכותרות ולשמות מסמכים. */
export const COPYRIGHT_SHORT = `© ${COPYRIGHT.year} ${COPYRIGHT.owner}`

/** Metadata אחיד לכל קובץ שהמערכת מייצרת. */
export const DOCUMENT_META = {
  author: COPYRIGHT.owner,
  creator: COPYRIGHT.product,
  company: COPYRIGHT.product,
  copyright: COPYRIGHT.text,
} as const
