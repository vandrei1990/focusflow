import { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  eachDayOfInterval,
  subDays,
  startOfWeek,
  startOfMonth,
  subWeeks,
  getHours,
  getDay,
} from 'date-fns'
import { TrendingUp, Flame, Calendar, Clock, Target } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { getDayKey, formatDuration, cn } from '@/lib/utils'
import type { Session } from '@/stores/useStore'

type DateRange = 'today' | 'week' | 'month' | 'all'

function getSessionsInRange(sessions: Session[], range: DateRange): Session[] {
  const now = new Date()
  switch (range) {
    case 'today': {
      const key = getDayKey(now)
      return sessions.filter((s) => getDayKey(new Date(s.startedAt)) === key)
    }
    case 'week': {
      const start = startOfWeek(now, { weekStartsOn: 1 })
      return sessions.filter((s) => new Date(s.startedAt) >= start)
    }
    case 'month': {
      const start = startOfMonth(now)
      return sessions.filter((s) => new Date(s.startedAt) >= start)
    }
    case 'all':
      return sessions
  }
}

function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(sessions.map((s) => getDayKey(new Date(s.startedAt))))
  let streak = 0
  let d = new Date()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = getDayKey(d)
    if (days.has(key)) {
      streak++
      d = subDays(d, 1)
    } else {
      break
    }
  }
  return streak
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Analytics() {
  const sessions = useStore((s) => s.sessions)
  const projects = useStore((s) => s.projects)
  const settings = useStore((s) => s.settings)

  const [range, setRange] = useState<DateRange>('week')

  const filteredSessions = useMemo(
    () => getSessionsInRange(sessions, range),
    [sessions, range],
  )

  // Summary stats
  const todaySecs = useMemo(() => {
    const key = getDayKey(new Date())
    return sessions
      .filter((s) => getDayKey(new Date(s.startedAt)) === key)
      .reduce((sum, s) => sum + s.durationSeconds, 0)
  }, [sessions])

  const weekSecs = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return sessions
      .filter((s) => new Date(s.startedAt) >= start)
      .reduce((sum, s) => sum + s.durationSeconds, 0)
  }, [sessions])

  const bestDaySecs = useMemo(() => {
    const byDay: Record<string, number> = {}
    sessions.forEach((s) => {
      const k = getDayKey(new Date(s.startedAt))
      byDay[k] = (byDay[k] ?? 0) + s.durationSeconds
    })
    return Math.max(0, ...Object.values(byDay))
  }, [sessions])

  const streak = useMemo(() => calculateStreak(sessions), [sessions])

  // Time by project (pie chart)
  const projectData = useMemo(() => {
    const byProject: Record<string, number> = {}
    filteredSessions.forEach((s) => {
      byProject[s.projectId] = (byProject[s.projectId] ?? 0) + s.durationSeconds
    })
    return Object.entries(byProject)
      .map(([projectId, secs]) => {
        const proj = projects.find((p) => p.id === projectId)
        return {
          name: proj?.name ?? 'Unknown',
          value: Math.round(secs / 60),
          color: proj?.color ?? '#6366f1',
          projectId,
        }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filteredSessions, projects])

  // Daily bar chart - last 14 days
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    })
    return days.map((day) => {
      const key = getDayKey(day)
      const daySessions = sessions.filter((s) => getDayKey(new Date(s.startedAt)) === key)
      const entry: Record<string, number | string> = {
        date: day.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      }
      projects.forEach((p) => {
        const secs = daySessions
          .filter((s) => s.projectId === p.id)
          .reduce((sum, s) => sum + s.durationSeconds, 0)
        entry[p.name] = Math.round(secs / 60)
      })
      return entry
    })
  }, [sessions, projects])

  // Hourly heatmap: last 4 weeks, 7 days × 24 hours
  const heatmapData = useMemo(() => {
    const cutoff = subWeeks(new Date(), 4)
    const recentSessions = sessions.filter((s) => new Date(s.startedAt) >= cutoff)

    // grid[dow][hour] = total minutes
    const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

    recentSessions.forEach((s) => {
      const d = new Date(s.startedAt)
      // date-fns getDay: 0=Sun, we want 0=Mon
      const rawDay = getDay(d) // 0-6, Sun=0
      const dow = rawDay === 0 ? 6 : rawDay - 1 // Mon=0 ... Sun=6
      const hour = getHours(d)
      grid[dow][hour] += Math.round(s.durationSeconds / 60)
    })

    const maxVal = Math.max(1, ...grid.flat())
    return { grid, maxVal }
  }, [sessions])

  // Focus score
  const focusScore = useMemo(() => {
    if (sessions.length === 0) return 0
    const lastWeekSessions = sessions.filter(
      (s) => new Date(s.startedAt) >= subDays(new Date(), 7),
    )
    if (lastWeekSessions.length === 0) return 0

    const avgSessionMins =
      lastWeekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) /
      lastWeekSessions.length /
      60

    const daysActive = new Set(
      lastWeekSessions.map((s) => getDayKey(new Date(s.startedAt))),
    ).size
    const consistency = daysActive / 7

    const weekTotalSecs = lastWeekSessions.reduce((sum, s) => sum + s.durationSeconds, 0)
    const goalCompletion = Math.min(1, weekTotalSecs / (settings.dailyGoalMinutes * 60 * 7))

    const score = Math.round(
      (Math.min(avgSessionMins, 90) / 90) * 40 + consistency * 30 + goalCompletion * 30,
    )
    return Math.min(100, score)
  }, [sessions, settings.dailyGoalMinutes])

  const totalFiltered = filteredSessions.reduce((sum, s) => sum + s.durationSeconds, 0)

  const RANGE_OPTIONS: { label: string; value: DateRange }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>

        {/* Date range */}
        <div className="flex rounded-xl bg-slate-800/60 border border-slate-700/50 p-0.5">
          {RANGE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                range === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-slate-400">Today</span>
          </div>
          <p className="text-xl font-bold text-white timer-display">
            {Math.floor(todaySecs / 3600)}h{Math.floor((todaySecs % 3600) / 60)}m
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-slate-400">This Week</span>
          </div>
          <p className="text-xl font-bold text-white timer-display">
            {Math.floor(weekSecs / 3600)}h{Math.floor((weekSecs % 3600) / 60)}m
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Best Day</span>
          </div>
          <p className="text-xl font-bold text-white timer-display">
            {bestDaySecs > 0
              ? `${Math.floor(bestDaySecs / 3600)}h${Math.floor((bestDaySecs % 3600) / 60)}m`
              : '—'}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400">Streak</span>
          </div>
          <p className="text-xl font-bold text-white">
            {streak} <span className="text-sm font-normal text-slate-400">day{streak !== 1 ? 's' : ''}</span>
          </p>
        </div>
      </div>

      {/* Focus Score */}
      <div className="card flex items-center gap-6">
        <div className="relative h-20 w-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#6366f1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - focusScore / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{focusScore}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-200">Focus Score</h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Based on session length, consistency, and goal completion over the last 7 days.
          </p>
          <p className="text-xs mt-1">
            <span
              className={cn(
                'font-semibold',
                focusScore >= 70
                  ? 'text-emerald-400'
                  : focusScore >= 40
                    ? 'text-amber-400'
                    : 'text-red-400',
              )}
            >
              {focusScore >= 70 ? 'Excellent' : focusScore >= 40 ? 'Good' : 'Needs Work'}
            </span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      {filteredSessions.length > 0 ? (
        <>
          {/* Time by Project + Daily Activity */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Time by Project</h3>
              {projectData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {projectData.map((entry) => (
                          <Cell key={entry.projectId} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}m`, 'Time']}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {projectData.map((d) => {
                      const pct = Math.round((d.value / (totalFiltered / 60)) * 100)
                      return (
                        <div key={d.projectId} className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-xs text-slate-300 flex-1">{d.name}</span>
                          <span className="text-xs text-slate-400 timer-display">
                            {formatDuration(d.value * 60)}
                          </span>
                          <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No data</p>
              )}
            </div>

            {/* Bar Chart */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Daily Activity (min)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  />
                  {projects.map((p) => (
                    <Bar key={p.id} dataKey={p.name} stackId="a" fill={p.color} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap */}
          <div className="card overflow-x-auto">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Hourly Focus Heatmap
              <span className="text-xs font-normal text-slate-500 ml-2">(last 4 weeks)</span>
            </h3>
            <div className="min-w-[640px]">
              {/* Hour labels */}
              <div className="flex mb-1 ml-10">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs text-slate-600 min-w-[22px]"
                  >
                    {i % 3 === 0 ? `${i}` : ''}
                  </div>
                ))}
              </div>
              {/* Grid rows */}
              {DAY_LABELS.map((day, dowIdx) => (
                <div key={day} className="flex items-center mb-1">
                  <span className="w-10 text-xs text-slate-500 text-right pr-2">{day}</span>
                  <div className="flex flex-1 gap-0.5">
                    {Array.from({ length: 24 }, (_, h) => {
                      const mins = heatmapData.grid[dowIdx][h]
                      const intensity = mins / heatmapData.maxVal
                      return (
                        <div
                          key={h}
                          title={`${day} ${h}:00 — ${mins}m`}
                          className="flex-1 h-5 rounded-sm min-w-[22px] transition-colors"
                          style={{
                            backgroundColor:
                              intensity < 0.01
                                ? '#1e293b'
                                : `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`,
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className="text-xs text-slate-600 mr-1">Less</span>
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                  <div
                    key={v}
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: `rgba(99, 102, 241, ${0.15 + v * 0.85})` }}
                  />
                ))}
                <span className="text-xs text-slate-600 ml-1">More</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-slate-500">No sessions recorded for this period.</p>
          <p className="text-slate-600 text-sm mt-1">Start tracking time to see analytics!</p>
        </div>
      )}
    </div>
  )
}
