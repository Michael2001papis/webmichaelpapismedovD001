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
      <div className="flex min-w-0 gap-2">
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
          className="field min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={add}
          className="btn-primary shrink-0 px-3 text-sm sm:px-4"
        >
          <span className="sm:hidden">הוסף</span>
          <span className="hidden sm:inline">הוסף עמודה</span>
        </button>
      </div>
      <div className="space-y-2">
        {value.map((check, index) => (
          <div key={`${check}-${index}`} className="flex min-w-0 flex-col gap-2 rounded-xl bg-cream p-2 sm:flex-row sm:items-center sm:px-3 sm:py-2">
            <input
              value={check}
              onChange={(e) => {
                const next = [...value]
                next[index] = e.target.value
                onChange(next)
              }}
              className="field min-w-0 flex-1 bg-white text-sm font-semibold sm:border-0 sm:bg-transparent sm:px-0 sm:py-1"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-danger min-h-11 flex-1 px-3 text-xs sm:flex-none"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                מחק
              </button>
              <button
                type="button"
                disabled={index === 0}
                className="btn-ghost min-h-11 flex-1 px-3 text-xs sm:flex-none"
                onClick={() => move(value, index, -1, onChange)}
              >
                למעלה
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                className="btn-ghost min-h-11 flex-1 px-3 text-xs sm:flex-none"
                onClick={() => move(value, index, 1, onChange)}
              >
                למטה
              </button>
            </div>
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
