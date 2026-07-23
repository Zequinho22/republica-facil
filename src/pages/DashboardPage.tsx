import { Banknote, ClipboardList, Clock3, FileText, HandCoins, MessageSquareText, PlusCircle, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatCard } from '../components/StatCard'
import { useAppContext } from '../context/AppContext'

const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1']

export function DashboardPage() {
  const { state, canManage, notify, searchTerm } = useAppContext()

  const filteredExpenses = state.expenses.filter((expense) => {
    const haystack = `${expense.description} ${expense.category} ${expense.responsible}`.toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0)
  const totalPaid = filteredExpenses.filter((expense) => expense.status === 'pago').reduce((acc, expense) => acc + expense.amount, 0)
  const totalPending = filteredExpenses.filter((expense) => expense.status !== 'pago').reduce((acc, expense) => acc + expense.amount, 0)
  const overdueTotal = filteredExpenses.filter((expense) => expense.status === 'atrasado').reduce((acc, expense) => acc + expense.amount, 0)

  const monthlyExpenses = state.expenses.reduce((acc, expense) => {
    const date = new Date(expense.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(monthlyExpenses)
    .map(([monthKey, value]) => {
      const [year, month] = monthKey.split('-').map(Number)
      return {
        monthKey,
        month: new Date(year, month - 1).toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        value,
        date: new Date(year, month - 1),
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)

  const lastTwo = chartData.slice(-2)
  const monthChange = lastTwo.length === 2 ? ((lastTwo[1].value - lastTwo[0].value) / Math.max(lastTwo[0].value, 1)) * 100 : 0
  const monthChangeLabel = `${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(1)}% em relação ao mês anterior`

  const categoryTotals = state.expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))
  const topCategory = categoryData.sort((a, b) => b.value - a.value)[0]?.name ?? 'Nenhuma'
  const topExpense = [...state.expenses].sort((a, b) => b.amount - a.amount)[0]
  const topExpenseLabel = topExpense ? `${topExpense.description} - R$ ${topExpense.amount.toFixed(2)}` : 'Nenhum gasto'

  const debtorAmounts = state.users.reduce((acc, user) => {
    acc[user.id] = 0
    return acc
  }, {} as Record<string, number>)

  state.expenses
    .filter((expense) => expense.status !== 'pago')
    .forEach((expense) => {
      const participants = expense.splitBetween?.length ? expense.splitBetween : state.users.map((user) => user.id)
      const share = expense.amount / Math.max(participants.length, 1)
      participants.forEach((userId) => {
        debtorAmounts[userId] = (debtorAmounts[userId] ?? 0) + share
      })
    })

  const debtors = state.users
    .map((user) => ({
      name: user.name,
      amount: debtorAmounts[user.id] ?? 0,
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const onTimeUsers = state.users.length - debtors.length
  const worstDebtor = debtors[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-sky-700 to-emerald-600 p-6 text-white sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Resumo do mês</p>
          <h2 className="mt-2 text-3xl font-semibold">Seu controle financeiro em tempo real</h2>
        </div>
        {canManage ? (
          <Link to="/despesas" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-sky-700"> <PlusCircle size={18} /> Nova despesa </Link>
        ) : (
          <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-sky-700" onClick={() => notify('Moradores visualizam os dados. Edicoes ficam com o administrador.', 'info')} type="button">
            <PlusCircle size={18} /> Modo leitura
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total de despesas" value={`R$ ${totalExpenses.toFixed(2)}`} icon={<Banknote size={20} />} accent="bg-sky-100 text-sky-700" />
        <StatCard title="Total pago" value={`R$ ${totalPaid.toFixed(2)}`} icon={<HandCoins size={20} />} accent="bg-emerald-100 text-emerald-700" />
        <StatCard title="Total pendente" value={`R$ ${totalPending.toFixed(2)}`} icon={<Clock3 size={20} />} accent="bg-amber-100 text-amber-700" />
        <StatCard title="Em atraso" value={`R$ ${overdueTotal.toFixed(2)}`} icon={<Clock3 size={20} />} accent="bg-rose-100 text-rose-700" />
        <StatCard title="Maior gasto" value={topExpenseLabel} icon={<TrendingUp size={20} />} accent="bg-violet-100 text-violet-700" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Categoria mais onerosa</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{topCategory}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Comparação mensal</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{monthChangeLabel}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Moradores em dia</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{onTimeUsers}/{state.users.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Despesas mensais</p>
              <h3 className="text-xl font-semibold text-slate-900">Evolução do gasto</h3>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">+12% este mês</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Acesso rápido</p>
          <div className="mt-4 grid gap-3">
            <Link to="/despesas" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"> <span>Gerenciar despesas</span> <TrendingUp size={18} /></Link>
            <Link to="/tarefas" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"> <span>Organizar tarefas</span> <ClipboardList size={18} /></Link>
            <Link to="/avisos" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"> <span>Ver avisos</span> <MessageSquareText size={18} /></Link>
            <Link to="/relatorios" className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"> <span>Relatórios</span> <FileText size={18} /></Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">Próximos vencimentos</h3>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {filteredExpenses.slice(0, 3).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-800">{expense.description}</p>
                  <p className="text-sm text-slate-500">Vence em {expense.dueDate}</p>
                </div>
                <span className="font-semibold text-sky-700">R$ {expense.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Distribuição por categoria</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Maior devedor</h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{debtors.length} devedores</span>
        </div>
        {worstDebtor ? (
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Maior valor em aberto</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{worstDebtor.name}</p>
            <p className="mt-1 text-sm text-slate-600">R$ {worstDebtor.amount.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum devedor no momento.</p>
        )}
        {debtors.length > 0 ? (
          <div className="mt-5 space-y-3">
            {debtors.slice(0, 4).map((debtor) => (
              <div key={debtor.name} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{debtor.name}</p>
                    <p className="text-sm text-slate-500">Total pendente</p>
                  </div>
                  <p className="text-lg font-semibold text-rose-700">R$ {debtor.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {debtors.length > 4 ? (
              <p className="text-sm text-slate-500">Mostrando os 4 maiores devedores.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
