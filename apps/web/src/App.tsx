import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedLayout, PublicOnly } from './features/auth/require-auth'
import { useAppContext } from './features/core/use-app-context'
import { DashboardPage } from './routes/dashboard-page'
import { SettingsPage } from './routes/settings-page'
import { SignInPage } from './routes/signin-page'
import { TaskDetailPage } from './routes/task-detail-page'
import { TaskEditorPage } from './routes/task-editor-page'
import { TasksPage } from './routes/tasks-page'

function RootRedirect() {
  const { currentUser, isLoading } = useAppContext()

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">読み込み中です...</div>
  }

  return <Navigate to={currentUser ? '/dashboard' : '/signin'} replace />
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-slate-600">URL を確認するか、ダッシュボードに戻ってください。</p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/signin"
        element={
          <PublicOnly>
            <SignInPage />
          </PublicOnly>
        }
      />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<TaskEditorPage mode="create" />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/tasks/:taskId/edit" element={<TaskEditorPage mode="edit" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
