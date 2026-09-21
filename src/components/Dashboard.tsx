import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { Inspection, StatusDefinition } from '../types'
import { computeInspectionStats } from '../lib/stats'
import { StatusBadge } from './StatusBadge'

export function Dashboard({
  inspections,
  statuses,
}: {
  inspections: Inspection[]
  statuses: StatusDefinition[]
}) {
  const latest = inspections[0]
  const stats = latest ? computeInspectionStats(latest, statuses) : null
  const chart = statuses
    .map((status) => ({
      name: status.name,
      value: stats?.byStatus[status.id] ?? 0,
      color: status.color,
    }))
    .filter((item) => item.value > 0)

  const totals = inspections.reduce(
    (acc, inspection) => {
      const s = computeInspectionStats(inspection, statuses)
      acc.rooms += s.checkedRooms
      acc.inspections += 1
      for (const status of statuses) acc.byStatus[status.id] = (acc.byStatus[status.id] ?? 0) + (s.byStatus[status.id] ?? 0)
      return acc
    },
    { rooms: 0, inspections: 0, byStatus: {} as Record<string, number> },
  )

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="בדיקות בארכיון" value={totals.inspections} />
      <StatCard label="חדרים שהושלמו" value={totals.rooms} />
      <StatCard
        label="לא תקינים"
        value={totals.byStatus.bad ?? 0}
        tone="bad"
      />
      <StatCard
        label="דורש מעקב"
        value={totals.byStatus.watch ?? 0}
        tone="watch"
      />

      {latest && stats && (
        <div className="sm:col-span-2 lg:col-span-4 rounded-3xl bg-paper p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-muted">הבדיקה האחרונה</div>
              <div className="text-lg font-extrabold">{latest.name}</div>
            </div>
            <div className="text-sm text-muted">
              {stats.checkedRooms}/{stats.totalRooms} חדרים הושלמו
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[200px_1fr] md:items-center">
            <div className="mx-auto h-44 w-full min-w-[180px] max-w-[220px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chart.length ? chart : [{ name: 'אין נתונים', value: 1, color: '#d9e1e8' }]} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {(chart.length ? chart : [{ color: '#d9e1e8' }]).map((item, index) => (
                      <Cell key={index} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {statuses.map((status) => (
                <div key={status.id} className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2">
                  <StatusBadge status={status} />
                  <div className="text-sm font-extrabold">
                    {stats.byStatus[status.id] ?? 0}
                    <span className="mr-2 text-xs font-semibold text-muted">
                      {stats.percents[status.id] ?? 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'bad' | 'watch'
}) {
  return (
    <div className="rounded-3xl bg-paper p-4 shadow-sm">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div
        className={
          tone === 'bad'
            ? 'mt-1 text-3xl font-black text-red-700'
            : tone === 'watch'
              ? 'mt-1 text-3xl font-black text-orange-700'
              : 'mt-1 text-3xl font-black text-navy'
        }
      >
        {value}
      </div>
    </div>
  )
}
