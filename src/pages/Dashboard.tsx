import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Square, Zap, Clock, Calendar, TrendingUp } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { useLiveTimer } from '@/hooks/useLiveTimer'
import ProjectBadge from '@/components/ProjectBadge'
import {
  formatDuration,
  formatDurationShort,
  formatTime,
  getDayKey,
  getGreeting,
  cn,
} from '@/lib/utils'
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export default function Dashboard() {
  const navigate = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const activeSession = useStore((s) => s.activeSession)
  const settings = useStore((s) => s.settings)
  const pauseSession = useStore((s) => s.pauseSession)
  const resumeSession = useStore((s) => s.resumeSession)
  const stopSession = useStore((s) => s.stopSession)
  const startSession = useStore((s) => s.startSession)
  const elapsed = useLiveTimer()

  const todayKey = getDayKey(new Date())

  const todaySessions = useMemo(
    () => sessions.filter((s) => getDayKey(new Date(s.startedAt)) === todayKey),
    [sessions, todayKey],
  )

  const todaySeconds = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    [todaySessions],
  )

  const goalSeconds = settings.dailyGoalMinutes * 60
  const progressPct = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100))

  // Weekly stats
  const weekStats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    let totalSecs = 0
    let sessionsCount = 0
    let bestDayKey = ''
    let bestDaySecs = 0

    days.forEach((day) => {
      const key = getDayKey(day)
      const daySecs = sessions
        .filter((s) => getDayKey(new Date(s.startedAt)) === key)
        .reduce((sum, s) => sum + s.durationSeconds, 0)
      totalSecs += daySecs
      sessionsCount += sessions.filter((s) => getDayKey(new Date(s.startedAt)) === key).length
      if (daySecs > bestDaySecs) {
        bestDaySecs = daySecs
        bestDayKey = key
      }
    })

    return { totalSecs, sessionsCount, bestDayKey, bestDaySecs }
  }, [sessions])

  // Recent unique tasks for quick start
  const recentTasks = useMemo(() => {
    const seen = new Set<string>()
    const result: { title: string; projectId: string }[] = []
    for (const s of sessions) {
      const key = `${s.taskTitle}::${s.projectId}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ title: s.taskTitle, projectId: s.projectId })
        if (result.length >= 4) break
      }
    }
    return result
  }, [sessions])

  // Last 5 sessions
  const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions])

  const isPaused = Boolean(activeSession?.pausedAt)
  const activeProject = projects.find((p) => p.id === activeSession?.projectId)

  const now = new Date()
  const greeting = getGreeting()
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{dateStr}</p>
      </div>

      {/* Active Session Card */}
      {activeSession && (
        <div
          className="rounded-xl border-2 p-4 relative overflow-hidden"
          style={{
            borderColor: `${activeProject?.color ?? '#6366f1'}60`,
            background: `linear-gradient(135deg, ${activeProject?.color ?? '#6366f1'}15 0%, transparent 60%)`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn('h-2 w-2 rounded-full', !isPaused && 'animate-pulse')}
                  style={{ backgroundColor: activeProject?.color ?? '#6366f1' }}
                />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {isPaused ? 'Paused' : 'In Progress'}
                  {activeSession.mode === 'pomodoro' && ' · Pomodoro'}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white truncate">{activeSession.taskTitle}</h2>
              <ProjectBadge projectId={activeSession.projectId} className="mt-1" />
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className="timer-display text-4xl font-bold"
                style={{ color: activeProject?.color ?? '#818cf8' }}
              >
                {formatDurationShort(elapsed)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={isPaused ? resumeSession : pauseSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-150"
              style={{
                backgroundColor: `${activeProject?.color ?? '#6366f1'}25`,
                color: activeProject?.color ?? '#818cf8',
                border: `1px solid ${activeProject?.color ?? '#6366f1'}40`,
              }}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-colors"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
            <button
              onClick={() => navigate('/timer')}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Open Timer →
            </button>
          </div>
        </div>
      )}

      {/* Daily Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Today's Progress</h3>
          </div>
          <span className="text-sm font-bold text-indigo-400">{progressPct}%</span>
        </div>

        <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-3">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300 font-medium">{formatDuration(todaySeconds)}</span>
          <span className="text-slate-500">
            of {formatDuration(goalSeconds)} goal
          </span>
        </div>

        {todaySessions.length > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} today
          </div>
        )}
      </div>

      {/* Quick Start */}
      {(recentTasks.length > 0 || tasks.filter((t) => !t.completedAt).length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Quick Start
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentTasks.map((t, i) => {
              const proj = projects.find((p) => p.id === t.projectId)
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!activeSession) {
                      startSession(t.title, t.projectId, 'normal')
                      navigate('/timer')
                    }
                  }}
                  disabled={Boolean(activeSession)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                    activeSession
                      ? 'opacity-40 cursor-not-allowed bg-slate-800/40 border-slate-700/30'
                      : 'bg-slate-800/60 border-slate-700/50 hover:border-indigo-600/40 hover:bg-slate-800',
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${proj?.color ?? '#6366f1'}20` }}
                  >
                    <Play
                      className="h-3.5 w-3.5"
                      style={{ color: proj?.color ?? '#818cf8' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">{proj?.name}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Recent Sessions
          </h3>
          <div className="space-y-1.5">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-200 truncate">{s.taskTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProjectBadge projectId={s.projectId} />
                    <span className="text-xs text-slate-500">
                      {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-300 flex-shrink-0 timer-display">
                  {formatDuration(s.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
          This Week
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <Clock className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {Math.floor(weekStats.totalSecs / 3600)}h
            </p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="card text-center">
            <Calendar className="h-4 w-4 text-violet-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{weekStats.sessionsCount}</p>
            <p className="text-xs text-slate-500">Sessions</p>
          </div>
          <div className="card text-center">
            <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {weekStats.bestDaySecs > 0
                ? `${Math.floor(weekStats.bestDaySecs / 3600)}h${Math.floor((weekStats.bestDaySecs % 3600) / 60)}m`
                : '—'}
            </p>
            <p className="text-xs text-slate-500">Best Day</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && !activeSession && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-1">Start tracking your time</h3>
          <p className="text-slate-500 text-sm mb-4">
            Head to the Timer page to start your first focus session
          </p>
          <button
            onClick={() => navigate('/timer')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Timer
          </button>
        </div>
      )}
    </div>
  )
}
