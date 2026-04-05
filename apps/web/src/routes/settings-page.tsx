import { Navigate } from 'react-router-dom'

import { CONTRACT_SOURCES } from '../features/core/board-model'
import { useAppContext } from '../features/core/use-app-context'

export function SettingsPage() {
  const { currentUser, users, repositoryMode } = useAppContext()

  if (!currentUser) {
    return null
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">管理ビュー</h1>
        <p className="mt-2 text-sm text-slate-600">
          admin ロールだけが閲覧できます。この見本ではまず UI 側のガードで制御し、admin 専用 API の認可は今後の拡張ポイントとして残しています。
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">現在の接続モード</h2>
        <p className="mt-2 text-sm text-slate-600">
          現在は <span className="font-semibold text-slate-950">{repositoryMode}</span> モードです。demo モードでは localStorage を使い、api モードでは HTTP-only Cookie と Express API を使います。
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">契約ファイル一覧</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CONTRACT_SOURCES.map((source) => (
            <article key={source.path} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-950">{source.title}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">{source.path}</p>
              <p className="mt-3 text-sm text-slate-600">{source.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">ユーザー一覧</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">名前</th>
                <th className="pb-3 pr-4 font-medium">メール</th>
                <th className="pb-3 pr-4 font-medium">ロール</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 font-medium text-slate-950">{user.name}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4 uppercase">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
