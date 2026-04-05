import { Link } from 'react-router-dom'

import { EmptyState } from '../components/empty-state'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { useAppContext } from '../features/core/use-app-context'
import { formatDate } from '../lib/utils'

export function TasksPage() {
  const { tasks } = useAppContext()

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Tasks</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">タスク一覧</h1>
          <p className="mt-2 text-sm text-slate-600">一覧・詳細・作成・編集の基本導線を最小限の SPA 構成で示します。</p>
        </div>
        <Link to="/tasks/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          タスクを作成する
        </Link>
      </section>

      {tasks.length === 0 ? (
        <EmptyState title="タスクがありません" description="新しいタスクを作成するとここに表示されます。" action={<Link className="font-medium text-slate-900 underline" to="/tasks/new">最初のタスクを作る</Link>} />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.labels.map((label) => (
                      <span key={label.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </span>
                    ))}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{task.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{task.description || '説明はまだありません。'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600 md:text-right">
                  <p>担当者: {task.assignee?.name ?? '未割り当て'}</p>
                  <p>締切: {formatDate(task.dueDate)}</p>
                  <p>コメント: {task.comments.length} 件</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-slate-900 underline">
                  詳細を見る
                </Link>
                <Link to={`/tasks/${task.id}/edit`} className="text-sm font-medium text-slate-700 underline">
                  編集する
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
