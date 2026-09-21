import { useState } from 'react'

export function CheckEditor({
  value,
  onChange,
}: {
  value: string[]
  onChange: (checks: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const name = draft.trim()
    if (!name) return
    onChange([...value, name])
    setDraft('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="הוסף בדיקה, למשל חלודה בידית"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-sea px-4 py-2 text-sm font-bold text-white"
        >
          הוסף עמודה
        </button>
      </div>
      <div className="space-y-2">
        {value.map((check, index) => (
          <div key={`${check}-${index}`} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2">
            <input
              value={check}
              onChange={(e) => {
                const next = [...value]
                next[index] = e.target.value
                onChange(next)
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            />
            <button
              type="button"
              className="text-xs font-bold text-muted"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              מחק
            </button>
            <button
              type="button"
              disabled={index === 0}
              className="text-xs font-bold text-navy disabled:opacity-30"
              onClick={() => move(value, index, -1, onChange)}
            >
              למעלה
            </button>
            <button
              type="button"
              disabled={index === value.length - 1}
              className="text-xs font-bold text-navy disabled:opacity-30"
              onClick={() => move(value, index, 1, onChange)}
            >
              למטה
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function move(value: string[], index: number, direction: -1 | 1, onChange: (next: string[]) => void) {
  const next = [...value]
  const target = index + direction
  if (target < 0 || target >= next.length) return
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  onChange(next)
}
