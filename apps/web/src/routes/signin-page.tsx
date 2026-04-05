import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ModeBadge } from '../components/badges'
import { ADMIN_ACCOUNT, CONTRACT_SOURCES, DEMO_ACCOUNTS } from '../features/core/board-model'
import { useAppContext } from '../features/core/use-app-context'

export function SignInPage() {
  const navigate = useNavigate()
  const { repositoryMode, signIn } = useAppContext()
  const [email, setEmail] = useState<string>(ADMIN_ACCOUNT.email)
  const [password, setPassword] = useState<string>(ADMIN_ACCOUNT.password)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <ModeBadge mode={repositoryMode} />
          <h1 className="mt-4 text-3xl font-semibold">Study Sprint Board</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">
            既存の標準見本と同じ題材を、Vite SPA と独立 API サーバーに分離して再実装した教材です。
            demo モードでは localStorage 上の seed データで、api モードでは Express + PostgreSQL で同じ UI を試せます。
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-semibold">この見本で学べること</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>・SPA と独立 API を OpenAPI 契約でつなぐときの責務境界</li>
              <li>・UI 側のルーティングと API 側の認証・認可を別々に設計する考え方</li>
              <li>・無料枠前提で、SPA と API を別々に配備する現実的な運用方針</li>
            </ul>
          </div>

          <div className="mt-6 rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-semibold">契約ファイル</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-200">
              {CONTRACT_SOURCES.map((source) => (
                <li key={source.path}>
                  <p className="font-medium text-white">{source.title}</p>
                  <p className="font-mono text-xs text-slate-300">{source.path}</p>
                  <p>{source.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">サインイン</h2>
            <p className="mt-2 text-sm text-slate-600">
              API 接続前でも流れを確認できるよう、demo モード用アカウントを用意しています。
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault()
              setErrors({})
              setMessage(null)
              setIsSubmitting(true)
              const result = await signIn({ email, password })
              setIsSubmitting(false)

              if (!result.ok) {
                setErrors(result.errors ?? {})
                setMessage(result.message ?? 'サインインに失敗しました。')
                return
              }

              navigate('/dashboard', { replace: true })
            }}
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                メールアドレス
              </label>
              <input
                id="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {errors.email ? <p className="text-sm text-rose-600">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errors.password ? <p className="text-sm text-rose-600">{errors.password}</p> : null}
            </div>

            {message ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p> : null}

            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'サインイン中...' : 'サインイン'}
            </button>
          </form>

          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-900">開発用アカウント</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p>{account.email}</p>
                  <p>password: {account.password}</p>
                  <p className="uppercase text-slate-500">{account.role}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-slate-600">
            セットアップと契約ファイルの読み方は <Link className="font-medium text-slate-900 underline" to="/dashboard">サインイン後の設定画面</Link> と
            `docs/` を参照してください。
          </p>
        </section>
      </div>
    </div>
  )
}
