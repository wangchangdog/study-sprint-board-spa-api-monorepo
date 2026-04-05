import { Link } from 'react-router-dom'

import { EmptyState } from '../components/empty-state'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { useAppContext } from '../features/core/use-app-context'
import { formatDate } from '../lib/utils'

export function DashboardPage() {
  const { currentUser, summary } = useAppContext()

  if (!currentUser || !summary) {
    return null
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{currentUser.name} さんの作業状況</h1>
          <p className="mt-2 text-sm text-slate-600">
            自分の担当件数、締切が近いタスク、最近更新されたタスクをまとめて確認できます。
          </p>
        </div>
        <Link to="/tasks/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          新しいタスクを作る
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <p className="text-sm text-slate-500">自分の担当タスク</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{summary.assignedToMe}</p>
        </article>
        {Object.entries(summary.statusCounts).map(([status, count]) => (
          <article key={status} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{status}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{count}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">締切が近いタスク</h2>
              <p className="mt-1 text-sm text-slate-600">近いうちに手を付ける必要があるタスクです。</p>
            </div>
            <Link to="/tasks" className="text-sm font-medium text-slate-700 underline">
              一覧を見る
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {summary.dueSoon.length === 0 ? (
              <EmptyState title="期限が近いタスクはありません" description="締切が設定された未完了タスクがここに表示されます。" />
            ) : (
              summary.dueSoon.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">締切: {formatDate(task.dueDate)}</p>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">最近更新されたタスク</h2>
          <p className="mt-1 text-sm text-slate-600">チームで会話や状態変更が発生しているタスクを確認できます。</p>

          <div className="mt-4 space-y-4">
            {summary.recentlyUpdated.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <h3 className="mt-3 font-semibold text-slate-950">{task.title}</h3>
                <p className="mt-1 text-sm text-slate-600">コメント {task.comments.length} 件 / 更新日 {formatDate(task.updatedAt)}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
