import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../components/empty-state'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { useAppContext } from '../features/core/use-app-context'
import { formatDate } from '../lib/utils'

export function TaskDetailPage() {
  const { taskId } = useParams()
  const { getTask, addComment } = useAppContext()
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const task = taskId ? getTask(taskId) : undefined

  if (!task) {
    return <EmptyState title="タスクが見つかりません" description="一覧に戻って存在するタスクを選び直してください。" action={<Link className="font-medium text-slate-900 underline" to="/tasks">タスク一覧へ戻る</Link>} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{task.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{task.description || '説明はまだありません。'}</p>
          </div>
          <Link to={`/tasks/${task.id}/edit`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            編集する
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-950">コメント</h2>
          <div className="mt-4 space-y-4">
            {task.comments.length === 0 ? (
              <EmptyState title="コメントはまだありません" description="最初のコメントを投稿して、レビュー履歴の見本を作ってみましょう。" />
            ) : (
              task.comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{comment.author.name}</p>
                      <p className="text-xs text-slate-500">{comment.author.email}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{comment.content}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <form
          className="space-y-3 rounded-2xl bg-slate-50 p-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setMessage(null)
            setError(null)
            const result = await addComment(task.id, { content })

            if (!result.ok) {
              setError(result.errors?.content ?? result.message ?? 'コメント投稿に失敗しました。')
              return
            }

            setContent('')
            setMessage('コメントを投稿しました。')
          }}
        >
          <label className="block text-sm font-medium text-slate-700" htmlFor="commentContent">
            コメントを追加
          </label>
          <textarea
            id="commentContent"
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            コメントを投稿
          </button>
        </form>
      </section>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">メタデータ</h2>
        <dl className="space-y-3 text-sm text-slate-600">
          <div>
            <dt className="font-medium text-slate-900">担当者</dt>
            <dd>{task.assignee?.name ?? '未割り当て'}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">作成者</dt>
            <dd>{task.createdBy.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">締切</dt>
            <dd>{formatDate(task.dueDate)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">作成日</dt>
            <dd>{formatDate(task.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">更新日</dt>
            <dd>{formatDate(task.updatedAt)}</dd>
          </div>
        </dl>

        <div>
          <h3 className="text-sm font-medium text-slate-900">ラベル</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {task.labels.length === 0 ? (
              <span className="text-sm text-slate-500">ラベルなし</span>
            ) : (
              task.labels.map((label) => (
                <span key={label.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </span>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
