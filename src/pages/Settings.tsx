import { useState } from 'react'
import {
  Plus,
  Trash2,
  Check,
  Sun,
  Moon,
  Download,
  AlertTriangle,
  Minus,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { PROJECT_COLORS } from '@/lib/constants'
import { getDayKey, cn } from '@/lib/utils'

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (c: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'h-6 w-6 rounded-md transition-all duration-150 border-2',
            value === c ? 'border-white scale-110' : 'border-transparent hover:border-slate-400',
          )}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  )
}

function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 120,
  label,
  unit = 'min',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label: string
  unit?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-7 w-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-12 text-center text-sm font-semibold text-slate-100">
          {value} {unit}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-7 w-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const projects = useStore((s) => s.projects)
  const settings = useStore((s) => s.settings)
  const sessions = useStore((s) => s.sessions)
  const tasks = useStore((s) => s.tasks)
  const updateSettings = useStore((s) => s.updateSettings)
  const addProject = useStore((s) => s.addProject)
  const updateProject = useStore((s) => s.updateProject)
  const deleteProject = useStore((s) => s.deleteProject)

  // Add project form state
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])

  // Edit project inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  // Daily goal in hours (for input display)
  const [goalHoursStr, setGoalHoursStr] = useState(
    String(Math.round(settings.dailyGoalMinutes / 60 * 10) / 10),
  )

  const [clearConfirm, setClearConfirm] = useState(false)

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    addProject(newProjectName.trim(), newProjectColor)
    setNewProjectName('')
    setNewProjectColor(PROJECT_COLORS[0])
  }

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id)
    setEditName(name)
    setEditColor(color)
  }

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateProject(id, { name: editName.trim(), color: editColor })
    }
    setEditingId(null)
  }

  const handleGoalChange = (val: string) => {
    setGoalHoursStr(val)
    const hours = parseFloat(val)
    if (!isNaN(hours) && hours > 0) {
      updateSettings({ dailyGoalMinutes: Math.round(hours * 60) })
    }
  }

  const exportData = () => {
    const data = {
      sessions,
      tasks,
      projects,
      settings,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusflow-export-${getDayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    localStorage.removeItem('focusflow-store')
    window.location.reload()
  }

  const goalHours = settings.dailyGoalMinutes / 60
  const goalProgress = Math.min(100, (goalHours / 12) * 100)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Goals */}
      <section className="card space-y-4">
        <h2 className="text-base font-semibold text-slate-200">Daily Goal</h2>
        <div>
          <label className="text-sm text-slate-400 block mb-1">Daily focus goal (hours)</label>
          <input
            type="number"
            value={goalHoursStr}
            onChange={(e) => handleGoalChange(e.target.value)}
            min={0.5}
            max={24}
            step={0.5}
            className="input-field w-32"
          />
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>0h</span>
              <span className="text-indigo-400 font-medium">
                {Math.floor(goalHours)}h {Math.round((goalHours % 1) * 60)}m goal
              </span>
              <span>12h</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pomodoro */}
      <section className="card space-y-4">
        <h2 className="text-base font-semibold text-slate-200">Pomodoro Settings</h2>
        <div className="space-y-3">
          <NumberStepper
            label="Work duration"
            value={settings.pomodoroWorkMin}
            onChange={(v) => updateSettings({ pomodoroWorkMin: v })}
            min={5}
            max={90}
          />
          <NumberStepper
            label="Short break"
            value={settings.pomodoroShortBreakMin}
            onChange={(v) => updateSettings({ pomodoroShortBreakMin: v })}
            min={1}
            max={30}
          />
          <NumberStepper
            label="Long break"
            value={settings.pomodoroLongBreakMin}
            onChange={(v) => updateSettings({ pomodoroLongBreakMin: v })}
            min={5}
            max={60}
          />
          <NumberStepper
            label="Rounds before long break"
            value={settings.pomodoroRoundsBeforeLong}
            onChange={(v) => updateSettings({ pomodoroRoundsBeforeLong: v })}
            min={2}
            max={8}
            unit="×"
          />
        </div>
      </section>

      {/* Projects */}
      <section className="card space-y-4">
        <h2 className="text-base font-semibold text-slate-200">Projects</h2>

        {/* Existing projects */}
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-700/30 border border-slate-700/40"
            >
              {editingId === p.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(p.id)}
                    className="input-field flex-1 text-sm py-1.5"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={cn(
                          'h-5 w-5 rounded border',
                          editColor === c ? 'border-white' : 'border-transparent',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => saveEdit(p.id)}
                    className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded-lg"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <button
                    className="flex-1 text-left text-sm text-slate-200 hover:text-white"
                    onClick={() => startEdit(p.id, p.name, p.color)}
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => startEdit(p.id, p.name, p.color)}
                    className="text-xs text-slate-500 hover:text-slate-300 px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="p-1 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add project */}
        <div className="border-t border-slate-700/50 pt-3">
          <h3 className="text-sm text-slate-400 mb-2">Add Project</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
              className="input-field flex-1 text-sm"
            />
            <button
              onClick={handleAddProject}
              disabled={!newProjectName.trim()}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                newProjectName.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-700/40 text-slate-500 cursor-not-allowed',
              )}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <ColorPicker value={newProjectColor} onChange={setNewProjectColor} />
        </div>
      </section>

      {/* Appearance */}
      <section className="card">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.darkMode ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-200">
                {settings.darkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs text-slate-500">Toggle light/dark theme</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none',
              settings.darkMode ? 'bg-indigo-600' : 'bg-slate-600',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                settings.darkMode ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="card space-y-3">
        <h2 className="text-base font-semibold text-slate-200">Data</h2>

        <div className="text-xs text-slate-500 space-y-0.5">
          <p>{sessions.length} sessions · {tasks.length} tasks · {projects.length} projects</p>
        </div>

        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors w-full"
        >
          <Download className="h-4 w-4" />
          Export Data as JSON
        </button>

        {!clearConfirm ? (
          <button
            onClick={() => setClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-800/30 text-sm font-medium transition-colors w-full"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/40">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">
                This will permanently delete all sessions, tasks, and settings. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAllData}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Yes, Clear Everything
              </button>
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Version */}
      <p className="text-center text-xs text-slate-700">
        FocusFlow v{import.meta.env.VITE_APP_VERSION}
      </p>
    </div>
  )
}
