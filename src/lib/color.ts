export function tint(hex: string, amount = 0.86): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#e8edf2'
  const n = Number.parseInt(raw, 16)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}
