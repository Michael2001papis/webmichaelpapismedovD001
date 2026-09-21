/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import type { ParseResult } from '../types'
import { floorRooms, uniqueRooms } from './rooms'

const FLOOR_WORDS: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  ראשונה: 1,
  ראשון: 1,
  אחת: 1,
  שנייה: 2,
  שניה: 2,
  שני: 2,
  שתיים: 2,
  שלישית: 3,
  שלישי: 3,
  שלוש: 3,
  רביעית: 4,
  רביעי: 4,
  ארבע: 4,
  חמישית: 5,
  חמישי: 5,
  חמש: 5,
  שישית: 6,
  שישי: 6,
  שש: 6,
}

const FILLERS = new Set([
  'אני',
  'צריך',
  'לבדוק',
  'נא',
  'בבקשה',
  'בחדרים',
  'בחדר',
  'חדרים',
  'חדר',
  'את',
  'עבור',
  'במלון',
  'של',
])

function pushUnique(target: number[], value: number) {
  if (!target.includes(value)) target.push(value)
}

function splitChecks(source: string): string[] {
  return source
    .replace(/[،]/g, ',')
    .replace(/[.:]/g, ' ')
    .split(',')
    .flatMap((part) => part.split(/\s+ו-?/))
    .map((item) =>
      item
        .split(/\s+/)
        .filter((word) => word && !FILLERS.has(word))
        .join(' ')
        .trim(),
    )
    .filter((item) => item.length >= 2 && !/^ו-?$/.test(item))
}

export function parseInspectionRequest(raw: string): ParseResult {
  const result: ParseResult = {
    rooms: [],
    checks: [],
    allRooms: false,
    floors: [],
    ranges: [],
  }

  let text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return result

  if (/כל\s*(החדרים|חדרי\s*המלון|המלון|הקומות)/.test(text)) {
    result.allRooms = true
    text = text.replace(/כל\s*(החדרים|חדרי\s*המלון|המלון|הקומות)/g, ' ')
  }

  const floorRe = /קומה\s*(ראשונה|ראשון|שנייה|שניה|שני|שלישית|שלישי|רביעית|רביעי|חמישית|חמישי|שישית|שישי|[1-6])/g
  text = text.replace(floorRe, (_full, word: string) => {
    const floor = FLOOR_WORDS[word]
    if (floor) {
      pushUnique(result.floors, floor)
      result.rooms.push(...floorRooms(floor))
    }
    return ' '
  })

  const rangeRe = /(\d{3})\s*(?:-|–|—|עד)\s*(\d{3})/g
  text = text.replace(rangeRe, (_full, a: string, b: string) => {
    const start = Number(a)
    const end = Number(b)
    result.ranges.push({ start, end })
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    for (let n = lo; n <= hi; n += 1) result.rooms.push(String(n))
    return ' '
  })

  const numbers: string[] = []
  text = text.replace(/\d{3}/g, (match) => {
    numbers.push(match)
    return ' '
  })
  result.rooms.push(...numbers)

  result.rooms = uniqueRooms(result.rooms)

  const colonIndex = raw.lastIndexOf(':')
  let checkSource = text
  if (colonIndex >= 0) {
    checkSource = raw.slice(colonIndex + 1)
    checkSource = checkSource.replace(rangeRe, ' ')
    checkSource = checkSource.replace(/\d{3}/g, ' ')
  }

  result.checks = splitChecks(checkSource)

  return result
}

export function suggestInspectionName(checks: string[], now = Date.now()): string {
  const date = new Date(now).toLocaleDateString('he-IL')
  if (checks.length === 0) return `בדיקה ${date}`
  if (checks.length === 1) return `בדיקת ${checks[0]} ${date}`
  if (checks.length === 2) return `בדיקת ${checks[0]} ו${checks[1]} ${date}`
  return `בדיקת ${checks[0]} ועוד ${checks.length - 1} ${date}`
}
