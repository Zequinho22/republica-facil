import { Component, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useAppContext } from './context/AppContext'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { TasksPage } from './pages/TasksPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { SocialPage } from './pages/SocialPage'
import { ReportsPage } from './pages/ReportsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro na aplicação:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Não foi possível carregar a aplicação</h1>
            <p style={{ marginBottom: '16px', color: '#4b5563' }}>Recarregue a página ou verifique o console para detalhes.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, authReady } = useAppContext()

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-lg text-center">
          <p className="text-base font-semibold">Carregando o painel...</p>
          <p className="mt-2 text-sm text-slate-500">Aguarde enquanto verificamos seu acesso.</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/despesas/novo" element={<Navigate to="/despesas" replace />} />
              <Route path="/despesas" element={<ExpensesPage />} />
              <Route path="/pagamentos" element={<PaymentsPage />} />
              <Route path="/tarefas" element={<TasksPage />} />
              <Route path="/avisos" element={<AnnouncementsPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppProvider>
    </AppErrorBoundary>
  )
}
