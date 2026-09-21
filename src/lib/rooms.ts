export const HOTEL_RANGES = [
  { floor: 1, start: 101, end: 128 },
  { floor: 2, start: 201, end: 266 },
  { floor: 3, start: 301, end: 396 },
  { floor: 4, start: 401, end: 435 },
  { floor: 5, start: 501, end: 545 },
  { floor: 6, start: 601, end: 644 },
] as const

export function roomsInRange(start: number, end: number): string[] {
  const a = Math.min(start, end)
  const b = Math.max(start, end)
  const out: string[] = []
  for (let n = a; n <= b; n += 1) out.push(String(n))
  return out
}

export function defaultHotelRooms(): string[] {
  return HOTEL_RANGES.flatMap((range) => roomsInRange(range.start, range.end))
}

export function floorRooms(floor: number): string[] {
  const range = HOTEL_RANGES.find((item) => item.floor === floor)
  return range ? roomsInRange(range.start, range.end) : []
}

export function floorOfRoom(room: string): number | null {
  const n = Number(room)
  if (!Number.isFinite(n) || n < 100) return null
  return Math.floor(n / 100)
}

export function uniqueRooms(rooms: string[]): string[] {
  return [...new Set(rooms.map((room) => room.trim()).filter(Boolean))].sort(
    (a, b) => Number(a) - Number(b) || a.localeCompare(b, 'he'),
  )
}

export function resolveHotelRooms(extra: string[], hidden: string[]): string[] {
  const set = new Set([...defaultHotelRooms(), ...extra])
  for (const room of hidden) set.delete(room)
  return uniqueRooms([...set])
}

export function groupRoomsByFloor(rooms: string[]): Array<{ floor: number | null; rooms: string[] }> {
  const map = new Map<number | null, string[]>()
  for (const room of uniqueRooms(rooms)) {
    const floor = floorOfRoom(room)
    const list = map.get(floor) ?? []
    list.push(room)
    map.set(floor, list)
  }
  return [...map.entries()]
    .sort((a, b) => {
      if (a[0] === null) return 1
      if (b[0] === null) return -1
      return a[0] - b[0]
    })
    .map(([floor, grouped]) => ({ floor, rooms: grouped }))
}
