import { Bell, FileText, Home, ListTodo, LogOut, MessageSquareMore, Receipt, Settings, UserCircle2, Users, Wallet2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/despesas', label: 'Despesas', icon: Receipt },
  { to: '/pagamentos', label: 'Pagamentos', icon: Wallet2 },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/avisos', label: 'Avisos', icon: MessageSquareMore },
  { to: '/social', label: 'Social', icon: Users },
  { to: '/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/perfil', label: 'Perfil', icon: UserCircle2 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const { currentUser, feedback, isAdmin, logout, markNotificationsRead, notifications, searchTerm, setSearchTerm, unreadNotifications, state } = useAppContext()

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase()
    if (!query) return []
    const entries = [
      ...navItems.map((item) => ({ title: item.label, subtitle: 'Página', to: item.to })),
      ...state.expenses.map((expense) => ({ title: expense.description, subtitle: `Despesa · ${expense.category}`, to: '/despesas' })),
      ...state.tasks.map((task) => ({ title: task.title, subtitle: 'Tarefa', to: '/tarefas' })),
      ...state.announcements.map((announcement) => ({ title: announcement.title, subtitle: 'Aviso', to: '/avisos' })),
      ...state.socialEvents.map((event) => ({ title: event.name, subtitle: 'Evento social', to: '/social' })),
      ...state.users.map((user) => ({ title: user.name, subtitle: 'Morador', to: '/perfil' })),
    ]
    return entries.filter((entry) => `${entry.title} ${entry.subtitle}`.toLocaleLowerCase().includes(query)).slice(0, 6)
  }, [searchTerm, state.announcements, state.expenses, state.socialEvents, state.tasks, state.users])

  const openSearchResult = (to: string) => {
    navigate(to)
    setSearchTerm('')
  }

  const handleNotificationToggle = () => {
    const nextValue = !showNotifications
    setShowNotifications(nextValue)
    if (nextValue) {
      markNotificationsRead()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">República Fácil</p>
              <h1 className="mt-2 text-xl font-semibold">Gestão inteligente</h1>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 lg:mt-4">
              {currentUser?.role ?? 'Morador'}
            </div>
            <p className="mt-3 hidden text-sm text-slate-500 lg:block">
              {isAdmin ? 'Voce pode criar, editar e excluir dados da casa.' : 'Voce pode acompanhar tudo em modo leitura.'}
            </p>
          </div>

          <nav className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100" onClick={logout} type="button">
              <LogOut size={18} />
              Sair
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">{location.pathname.replace('/', '') || 'Dashboard'}</p>
                <h2 className="text-2xl font-semibold text-slate-900">Bem-vindo(a), {currentUser?.name?.split(' ')[0] ?? 'morador'}</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  <span className="text-slate-400">🔎</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Pesquisar"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
                {searchTerm.trim() ? (
                  <div className="absolute right-4 top-28 z-40 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:right-auto sm:top-14">
                    {searchResults.length ? searchResults.map((result, index) => (
                      <button key={`${result.to}-${result.title}-${index}`} type="button" onClick={() => openSearchResult(result.to)} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-50">
                        <p className="text-sm font-semibold text-slate-900">{result.title}</p>
                        <p className="text-xs text-slate-500">{result.subtitle}</p>
                      </button>
                    )) : <p className="px-3 py-3 text-sm text-slate-500">Nenhum resultado encontrado.</p>}
                  </div>
                ) : null}
                <div className="relative">
                <button className="relative rounded-full border border-slate-200 p-2 text-slate-600" onClick={handleNotificationToggle} type="button">
                  <Bell size={18} />
                  {unreadNotifications.length > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-semibold text-white">
                      {unreadNotifications.length}
                    </span>
                  ) : null}
                </button>
                {showNotifications ? (
                  <div className="absolute right-0 top-12 z-40 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-slate-900">Notificacoes</p>
                      <span className="text-xs text-slate-500">2 dias antes</span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-auto">
                      {notifications.length > 0 ? notifications.map((notification) => (
                        <div key={notification.id} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                        </div>
                      )) : (
                        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nenhum prazo vence em 2 dias.</p>
                      )}
                    </div>
                  </div>
                ) : null}
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            {feedback ? (
              <div
                className={`fixed right-4 top-4 z-50 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${
                  feedback.type === 'error'
                    ? 'bg-rose-600 text-white'
                    : feedback.type === 'info'
                      ? 'bg-sky-600 text-white'
                      : 'bg-emerald-600 text-white'
                }`}
              >
                {feedback.message}
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
