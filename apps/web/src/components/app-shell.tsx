import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import type { AppUser, RepositoryMode } from '../features/core/board-model'
import { cn } from '../lib/utils'
import { ModeBadge } from './badges'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/settings', label: 'Settings' },
]

export function AppShell({
  currentUser,
  repositoryMode,
  onSignOut,
  children,
}: {
  currentUser: AppUser
  repositoryMode: RepositoryMode
  onSignOut(): Promise<void>
  children: ReactNode
}) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <Link to="/dashboard" className="text-lg font-semibold text-slate-950">
              Study Sprint Board
            </Link>
            <p className="text-sm text-slate-600">
              BaaS 構成の見本。RLS と generated types を教材として読めるようにしています。
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ModeBadge mode={repositoryMode} />
              <span>{currentUser.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                {currentUser.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-wrap items-center gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'rounded-full px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true)
                  await onSignOut()
                  navigate('/signin', { replace: true })
                }}
              >
                {isSubmitting ? 'サインアウト中...' : 'サインアウト'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
