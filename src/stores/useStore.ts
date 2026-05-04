import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId, getElapsedSeconds } from '@/lib/utils'

export interface Session {
  id: string
  taskTitle: string
  projectId: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  mode: 'normal' | 'pomodoro'
}

export interface Task {
  id: string
  title: string
  projectId: string
  estimateMinutes?: number
  totalTrackedSeconds: number
  completedAt?: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  color: string
}

export interface ActiveSession {
  id: string
  taskTitle: string
  projectId: string
  startedAt: string
  pausedAt?: string
  totalPausedSeconds: number
  mode: 'normal' | 'pomodoro'
  pomodoroRound: number
}

export interface Settings {
  dailyGoalMinutes: number
  pomodoroWorkMin: number
  pomodoroShortBreakMin: number
  pomodoroLongBreakMin: number
  pomodoroRoundsBeforeLong: number
  darkMode: boolean
}

interface AppStore {
  sessions: Session[]
  tasks: Task[]
  projects: Project[]
  activeSession: ActiveSession | null
  settings: Settings

  // Session actions
  startSession: (taskTitle: string, projectId: string, mode: 'normal' | 'pomodoro') => void
  pauseSession: () => void
  resumeSession: () => void
  stopSession: () => void
  getElapsedNow: () => number

  // Task actions
  addTask: (title: string, projectId: string, estimateMinutes?: number) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'projectId' | 'estimateMinutes'>>) => void

  // Project actions
  addProject: (name: string, color: string) => void
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'color'>>) => void
  deleteProject: (id: string) => void

  // Settings
  updateSettings: (updates: Partial<Settings>) => void
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 'att', name: 'ATT', color: '#06b6d4' },
  { id: 'dn', name: 'Drivenets', color: '#a855f7' },
  { id: 'grafana', name: 'Grafana', color: '#f59e0b' },
  { id: 'admin', name: 'Admin', color: '#6b7280' },
  { id: 'other', name: 'Other', color: '#10b981' },
]

const DEFAULT_SETTINGS: Settings = {
  dailyGoalMinutes: 450,
  pomodoroWorkMin: 25,
  pomodoroShortBreakMin: 5,
  pomodoroLongBreakMin: 15,
  pomodoroRoundsBeforeLong: 4,
  darkMode: true,
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      tasks: [],
      projects: DEFAULT_PROJECTS,
      activeSession: null,
      settings: DEFAULT_SETTINGS,

      startSession: (taskTitle, projectId, mode) => {
        const active = get().activeSession
        if (active) return // already running

        const newSession: ActiveSession = {
          id: generateId(),
          taskTitle,
          projectId,
          startedAt: new Date().toISOString(),
          totalPausedSeconds: 0,
          mode,
          pomodoroRound: 1,
        }
        set({ activeSession: newSession })
      },

      pauseSession: () => {
        const active = get().activeSession
        if (!active || active.pausedAt) return
        set({
          activeSession: {
            ...active,
            pausedAt: new Date().toISOString(),
          },
        })
      },

      resumeSession: () => {
        const active = get().activeSession
        if (!active || !active.pausedAt) return
        const pausedDuration = Math.floor(
          (Date.now() - new Date(active.pausedAt).getTime()) / 1000,
        )
        set({
          activeSession: {
            ...active,
            pausedAt: undefined,
            totalPausedSeconds: active.totalPausedSeconds + pausedDuration,
          },
        })
      },

      stopSession: () => {
        const active = get().activeSession
        if (!active) return

        const now = new Date().toISOString()
        const durationSeconds = getElapsedSeconds(
          active.startedAt,
          active.totalPausedSeconds,
          active.pausedAt,
        )

        if (durationSeconds < 5) {
          // Too short, discard
          set({ activeSession: null })
          return
        }

        const session: Session = {
          id: active.id,
          taskTitle: active.taskTitle,
          projectId: active.projectId,
          startedAt: active.startedAt,
          endedAt: now,
          durationSeconds,
          mode: active.mode,
        }

        const tasks = get().tasks
        const matchingTask = tasks.find(
          (t) =>
            t.title.toLowerCase() === active.taskTitle.toLowerCase() &&
            t.projectId === active.projectId &&
            !t.completedAt,
        )

        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSession: null,
          tasks: matchingTask
            ? state.tasks.map((t) =>
                t.id === matchingTask.id
                  ? { ...t, totalTrackedSeconds: t.totalTrackedSeconds + durationSeconds }
                  : t,
              )
            : state.tasks,
        }))
      },

      getElapsedNow: () => {
        const active = get().activeSession
        if (!active) return 0
        return getElapsedSeconds(active.startedAt, active.totalPausedSeconds, active.pausedAt)
      },

      addTask: (title, projectId, estimateMinutes) => {
        const task: Task = {
          id: generateId(),
          title,
          projectId,
          estimateMinutes,
          totalTrackedSeconds: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ tasks: [task, ...state.tasks] }))
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completedAt: new Date().toISOString() } : t,
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
      },

      addProject: (name, color) => {
        const project: Project = {
          id: generateId(),
          name,
          color,
        }
        set((state) => ({ projects: [...state.projects, project] }))
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }))
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }))
        // Apply dark mode to DOM immediately
        if (updates.darkMode !== undefined) {
          if (updates.darkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }),
    {
      name: 'focusflow-store',
    },
  ),
)
