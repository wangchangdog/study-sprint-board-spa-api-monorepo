import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { AppShell } from '../../components/app-shell'
import { useAppContext } from '../core/use-app-context'

function FullPageMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-sm text-slate-600">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">{message}</div>
    </div>
  )
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { isLoading, currentUser } = useAppContext()

  if (isLoading) {
    return <FullPageMessage message="読み込み中です..." />
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function ProtectedLayout() {
  const { isLoading, currentUser, repositoryMode, signOut } = useAppContext()

  if (isLoading) {
    return <FullPageMessage message="読み込み中です..." />
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />
  }

  return (
    <AppShell currentUser={currentUser} repositoryMode={repositoryMode} onSignOut={signOut}>
      <Outlet />
    </AppShell>
  )
}
