import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Clock, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores/useStore'
import ProjectBadge from '@/components/ProjectBadge'
import { formatDuration, getDayKey, cn } from '@/lib/utils'

export default function Tasks() {
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const activeSession = useStore((s) => s.activeSession)
  const addTask = useStore((s) => s.addTask)
  const completeTask = useStore((s) => s.completeTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const startSession = useStore((s) => s.startSession)

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [estimateStr, setEstimateStr] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tasks],
  )

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.completedAt)
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [tasks],
  )

  const handleAdd = () => {
    if (!title.trim()) return
    const estimate = estimateStr ? parseInt(estimateStr, 10) : undefined
    addTask(title.trim(), projectId, estimate && !isNaN(estimate) ? estimate : undefined)
    setTitle('')
    setEstimateStr('')
  }

  const handleStartTask = (task: { title: string; projectId: string }) => {
    if (activeSession) return
    startSession(task.title, task.projectId, 'normal')
    navigate('/timer')
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <span className="text-sm text-slate-500">
          {activeTasks.length} active
        </span>
      </div>

      {/* Add Task Form */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Add Task</h3>
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="input-field w-full"
        />
        <div className="flex gap-2">
          {/* Project selector */}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="input-field flex-1 min-w-0"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Estimate */}
          <input
            type="number"
            placeholder="Est. min"
            value={estimateStr}
            onChange={(e) => setEstimateStr(e.target.value)}
            min={1}
            className="input-field w-24"
          />

          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-colors',
              title.trim()
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-700/40 text-slate-500 cursor-not-allowed',
            )}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Active Tasks */}
      <div>
        {activeTasks.length === 0 ? (
          <div className="text-center py-10">
            <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">No active tasks. Add one above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => {
              const estimateSecs = task.estimateMinutes ? task.estimateMinutes * 60 : null
              const progress = estimateSecs
                ? Math.min(100, Math.round((task.totalTrackedSeconds / estimateSecs) * 100))
                : null
              const isOverEstimate =
                estimateSecs !== null && task.totalTrackedSeconds > estimateSecs

              return (
                <div
                  key={task.id}
                  className="card border border-slate-700/40 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Complete button */}
                    <button
                      onClick={() => completeTask(task.id)}
                      className="mt-0.5 h-5 w-5 rounded-full border-2 border-slate-600 hover:border-indigo-500 hover:bg-indigo-600/20 flex-shrink-0 flex items-center justify-center transition-colors group"
                      title="Mark complete"
                    >
                      <Check className="h-3 w-3 text-transparent group-hover:text-indigo-400 transition-colors" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <ProjectBadge projectId={task.projectId} />
                        {task.totalTrackedSeconds > 0 && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(task.totalTrackedSeconds)}
                          </span>
                        )}
                        {task.estimateMinutes && (
                          <span
                            className={cn(
                              'text-xs',
                              isOverEstimate ? 'text-amber-400' : 'text-slate-500',
                            )}
                          >
                            / {task.estimateMinutes}m est.
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {progress !== null && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                            <div
                              className={cn(
                                'h-1.5 rounded-full transition-all duration-500',
                                isOverEstimate
                                  ? 'bg-amber-500'
                                  : 'bg-gradient-to-r from-indigo-500 to-violet-500',
                              )}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 text-right">
                            {isOverEstimate ? '+' : ''}
                            {progress}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleStartTask(task)}
                        disabled={Boolean(activeSession)}
                        title="Start timer for this task"
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          activeSession
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-600/10',
                        )}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks (collapsible) */}
      {completedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-2"
          >
            {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Completed ({completedTasks.length})
          </button>

          {showCompleted && (
            <div className="space-y-1.5">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/20 opacity-60"
                >
                  <div className="h-4 w-4 rounded-full bg-emerald-600/40 flex items-center justify-center flex-shrink-0">
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 line-through truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ProjectBadge projectId={task.projectId} />
                      {task.totalTrackedSeconds > 0 && (
                        <span className="text-xs text-slate-600">
                          {formatDuration(task.totalTrackedSeconds)}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="text-xs text-slate-600">
                          {getDayKey(new Date(task.completedAt))}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
