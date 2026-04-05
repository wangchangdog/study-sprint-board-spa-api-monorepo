import { formatPriority, formatStatus, type RepositoryMode, type TaskPriority, type TaskStatus } from '../features/core/board-model'
import { cn } from '../lib/utils'

const statusClassMap: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-100 text-sky-700',
  in_review: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

const priorityClassMap: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-violet-100 text-violet-700',
  high: 'bg-rose-100 text-rose-700',
  urgent: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusClassMap[status])}>
      {formatStatus(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', priorityClassMap[priority])}>
      {formatPriority(priority)}
    </span>
  )
}

export function ModeBadge({ mode }: { mode: RepositoryMode }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        mode === 'demo' ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
      )}
    >
      {mode === 'demo' ? 'demo mode' : 'api mode'}
    </span>
  )
}
