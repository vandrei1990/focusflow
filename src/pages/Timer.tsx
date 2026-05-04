import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square, ChevronDown, SkipForward, Bell } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { useLiveTimer } from '@/hooks/useLiveTimer'
import ProjectBadge from '@/components/ProjectBadge'
import {
  formatDurationShort,
  formatDuration,
  formatTime,
  getDayKey,
  cn,
} from '@/lib/utils'

type Phase = 'work' | 'short-break' | 'long-break'

export default function Timer() {
  const activeSession = useStore((s) => s.activeSession)
  const sessions = useStore((s) => s.sessions)
  const projects = useStore((s) => s.projects)
  const settings = useStore((s) => s.settings)
  const startSession = useStore((s) => s.startSession)
  const pauseSession = useStore((s) => s.pauseSession)
  const resumeSession = useStore((s) => s.resumeSession)
  const stopSession = useStore((s) => s.stopSession)

  const [mode, setMode] = useState<'normal' | 'pomodoro'>('normal')
  const [taskTitle, setTaskTitle] = useState('')
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? '')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [pomodoroPhase, setPomodoroPhase] = useState<Phase>('work')
  const [pomodoroRound, setPomodoroRound] = useState(1)
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [notifPermission, setNotifPermission] = useState(Notification.permission)

  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsed = useLiveTimer()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const todayKey = getDayKey(new Date())
  const todaySessions = sessions.filter((s) => getDayKey(new Date(s.startedAt)) === todayKey)

  const workSeconds = settings.pomodoroWorkMin * 60
  const shortBreakSeconds = settings.pomodoroShortBreakMin * 60
  const longBreakSeconds = settings.pomodoroLongBreakMin * 60

  // When active session exists, sync mode and task
  useEffect(() => {
    if (activeSession) {
      setMode(activeSession.mode)
      setTaskTitle(activeSession.taskTitle)
      setSelectedProject(activeSession.projectId)
    }
  }, [activeSession])

  // Close project dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Pomodoro: check if work phase is done
  useEffect(() => {
    if (
      mode === 'pomodoro' &&
      activeSession &&
      !activeSession.pausedAt &&
      !isBreak &&
      elapsed >= workSeconds
    ) {
      handlePomodoroWorkComplete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, mode, activeSession, isBreak, workSeconds])

  // Break countdown
  useEffect(() => {
    if (isBreak && breakSecondsLeft > 0) {
      breakIntervalRef.current = setInterval(() => {
        setBreakSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(breakIntervalRef.current!)
            setIsBreak(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
      return () => clearInterval(breakIntervalRef.current!)
    }
  }, [isBreak, breakSecondsLeft])

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
    }
  }

  const sendNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: 'focusflow-pomodoro',
      })
    }
  }, [])

  const handlePomodoroWorkComplete = useCallback(() => {
    stopSession()
    const isLong = pomodoroRound % settings.pomodoroRoundsBeforeLong === 0
    const nextPhase: Phase = isLong ? 'long-break' : 'short-break'
    const breakDuration = isLong ? longBreakSeconds : shortBreakSeconds
    setPomodoroPhase(nextPhase)
    setBreakSecondsLeft(breakDuration)
    setIsBreak(true)
    sendNotification(
      'Pomodoro Complete! 🎉',
      isLong
        ? `Round ${pomodoroRound} done! Take a ${settings.pomodoroLongBreakMin}-minute long break.`
        : `Round ${pomodoroRound} done! Take a ${settings.pomodoroShortBreakMin}-minute short break.`,
    )
  }, [
    pomodoroRound,
    settings.pomodoroRoundsBeforeLong,
    settings.pomodoroLongBreakMin,
    settings.pomodoroShortBreakMin,
    longBreakSeconds,
    shortBreakSeconds,
    stopSession,
    sendNotification,
  ])

  const skipBreak = () => {
    clearInterval(breakIntervalRef.current!)
    setIsBreak(false)
    setBreakSecondsLeft(0)
    setPomodoroPhase('work')
    setPomodoroRound((r) => r + 1)
  }

  const handleStart = () => {
    if (!taskTitle.trim()) return
    requestNotificationPermission()
    startSession(taskTitle.trim(), selectedProject, mode)
  }

  const handleStop = () => {
    stopSession()
    if (mode === 'pomodoro' && !isBreak) {
      setIsBreak(false)
    }
  }

  const isPaused = Boolean(activeSession?.pausedAt)
  const activeProject = projects.find((p) => p.id === (activeSession?.projectId ?? selectedProject))

  // Pomodoro progress
  const pomodoroProgress =
    mode === 'pomodoro' && !isBreak
      ? Math.min(1, elapsed / workSeconds)
      : isBreak
        ? Math.min(1, 1 - breakSecondsLeft / (pomodoroPhase === 'long-break' ? longBreakSeconds : shortBreakSeconds))
        : 0

  const displaySeconds = isBreak ? breakSecondsLeft : elapsed

  // Circumference for progress ring
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const dashOffset =
    mode === 'pomodoro'
      ? circumference * (1 - pomodoroProgress)
      : 0

  const phaseColor =
    isBreak
      ? pomodoroPhase === 'long-break'
        ? '#10b981'
        : '#06b6d4'
      : activeProject?.color ?? '#6366f1'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Timer</h1>
        {notifPermission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            Enable notifications
          </button>
        )}
      </div>

      {/* Mode Toggle */}
      {!activeSession && (
        <div className="flex rounded-xl bg-slate-800/60 border border-slate-700/50 p-1">
          {(['normal', 'pomodoro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150',
                mode === m
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {m === 'normal' ? 'Normal' : 'Pomodoro'}
            </button>
          ))}
        </div>
      )}

      {/* Timer Display */}
      <div className="flex flex-col items-center">
        {/* SVG Ring (Pomodoro) */}
        {mode === 'pomodoro' ? (
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            {/* Background ring */}
            <svg
              className="absolute inset-0"
              width="280"
              height="280"
              viewBox="0 0 280 280"
            >
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke={phaseColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 140 140)"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
              />
            </svg>
            {/* Time */}
            <div className="text-center z-10">
              <div
                className="timer-display font-bold"
                style={{
                  fontSize: 'clamp(2.5rem, 10vw, 4rem)',
                  color: isBreak ? phaseColor : 'white',
                }}
              >
                {formatDurationShort(displaySeconds)}
              </div>
              <div
                className="text-sm font-semibold mt-1"
                style={{ color: phaseColor }}
              >
                {isBreak
                  ? pomodoroPhase === 'long-break'
                    ? 'Long Break'
                    : 'Short Break'
                  : `Round ${pomodoroRound}`}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div
              className="timer-display font-bold text-white"
              style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)' }}
            >
              {formatDurationShort(elapsed)}
            </div>
          </div>
        )}

        {/* Pomodoro rounds indicator */}
        {mode === 'pomodoro' && (
          <div className="flex gap-2 mt-2">
            {Array.from({ length: settings.pomodoroRoundsBeforeLong }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-300',
                  i < ((pomodoroRound - 1) % settings.pomodoroRoundsBeforeLong)
                    ? 'scale-100'
                    : i === ((pomodoroRound - 1) % settings.pomodoroRoundsBeforeLong) && !isBreak
                      ? 'scale-125 animate-pulse'
                      : 'opacity-30',
                )}
                style={{
                  backgroundColor:
                    i < ((pomodoroRound - 1) % settings.pomodoroRoundsBeforeLong)
                      ? activeProject?.color ?? '#6366f1'
                      : i === ((pomodoroRound - 1) % settings.pomodoroRoundsBeforeLong) && !isBreak
                        ? activeProject?.color ?? '#6366f1'
                        : '#475569',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Break UI */}
      {isBreak && (
        <div
          className="rounded-xl border p-4 text-center"
          style={{
            backgroundColor: `${phaseColor}15`,
            borderColor: `${phaseColor}40`,
          }}
        >
          <p className="text-base font-semibold" style={{ color: phaseColor }}>
            {pomodoroPhase === 'long-break' ? '🎉 Long Break Time!' : '☕ Short Break'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {formatDurationShort(breakSecondsLeft)} remaining
          </p>
          <button
            onClick={skipBreak}
            className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip Break
          </button>
        </div>
      )}

      {/* Task Input & Project - shown when not in a break */}
      {!isBreak && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="What are you working on?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={Boolean(activeSession)}
            onKeyDown={(e) => e.key === 'Enter' && !activeSession && handleStart()}
            className={cn(
              'input-field w-full text-base',
              activeSession && 'opacity-60 cursor-not-allowed',
            )}
          />

          {/* Project Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => !activeSession && setShowProjectDropdown((v) => !v)}
              disabled={Boolean(activeSession)}
              className={cn(
                'w-full flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-700/50 bg-slate-800/60 text-sm transition-colors',
                activeSession ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-600',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeProject?.color ?? '#6366f1' }}
                />
                <span className="text-slate-200">{activeProject?.name ?? 'Select project'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {showProjectDropdown && !activeSession && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p.id)
                      setShowProjectDropdown(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-700/60 transition-colors text-left',
                      selectedProject === p.id && 'bg-slate-700/40',
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-slate-200">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {!isBreak && (
        <div className="flex items-center justify-center gap-4">
          {!activeSession ? (
            <button
              onClick={handleStart}
              disabled={!taskTitle.trim()}
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-150 shadow-lg',
                taskTitle.trim()
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/30'
                  : 'bg-slate-700/40 text-slate-500 cursor-not-allowed',
              )}
            >
              <Play className="h-6 w-6" />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? resumeSession : pauseSession}
                className={cn(
                  'flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold transition-all duration-150',
                  'bg-slate-700 hover:bg-slate-600 text-slate-100',
                )}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 transition-all duration-150"
              >
                <Square className="h-5 w-5" />
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {/* Mode info */}
      {mode === 'pomodoro' && !activeSession && !isBreak && (
        <div className="text-center text-xs text-slate-500 space-y-0.5">
          <p>
            {settings.pomodoroWorkMin}min work · {settings.pomodoroShortBreakMin}min short break · {settings.pomodoroLongBreakMin}min long break
          </p>
          <p>Long break after {settings.pomodoroRoundsBeforeLong} rounds</p>
        </div>
      )}

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Today's Sessions
          </h3>
          <div className="space-y-1.5">
            {todaySessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{s.taskTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ProjectBadge projectId={s.projectId} />
                    <span className="text-xs text-slate-500">
                      {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
                    </span>
                    {s.mode === 'pomodoro' && (
                      <span className="text-xs text-indigo-500">Pomo</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-300 timer-display">
                  {formatDuration(s.durationSeconds)}
                </span>
              </div>
            ))}
            <div className="text-right text-xs text-slate-500 pt-1">
              Total today:{' '}
              <span className="font-semibold text-slate-300">
                {formatDuration(todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
