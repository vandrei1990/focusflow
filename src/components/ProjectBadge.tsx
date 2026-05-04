import { useStore } from '@/stores/useStore'
import { cn } from '@/lib/utils'

interface ProjectBadgeProps {
  projectId: string
  className?: string
  size?: 'sm' | 'md'
}

export default function ProjectBadge({ projectId, className, size = 'sm' }: ProjectBadgeProps) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))

  if (!project) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-slate-700/60 text-slate-400',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Unknown
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
      style={{
        backgroundColor: `${project.color}20`,
        color: project.color,
        border: `1px solid ${project.color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color }}
      />
      {project.name}
    </span>
  )
}
