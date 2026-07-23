import { FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAppContext } from '../context/AppContext'
import type { Expense } from '../types'

export function ExpensesPage() {
  const { state, canManage, currentUser, searchTerm, addExpense, updateExpense, deleteExpense, approveExpense, requireAdmin } = useAppContext()
  const [filterMonth, setFilterMonth] = useState('')
  const [filterResident, setFilterResident] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<Expense>({
    defaultValues: {
      status: 'pendente',
      splitBetween: state.users.map((user) => user.id),
    },
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const getUserName = (idOrName: string) => state.users.find((user) => user.id === idOrName)?.name ?? idOrName

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter((expense) => {
      const splitNames = (expense.splitBetween ?? []).map((id) => state.users.find((user) => user.id === id)?.name ?? id).join(' ')
      const matchesSearch = `${expense.description} ${expense.category} ${expense.responsible} ${splitNames}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMonth = filterMonth ? expense.date.startsWith(filterMonth) : true
      const matchesResident = filterResident ? expense.responsible.includes(filterResident) || (expense.splitBetween ?? []).includes(filterResident) : true
      const matchesStatus = filterStatus ? expense.status === filterStatus : true
      return matchesSearch && matchesMonth && matchesResident && matchesStatus
    })
  }, [filterMonth, filterResident, filterStatus, searchTerm, state.expenses, state.users])

  const submit = (values: Expense) => {
    if (!requireAdmin('salvar despesas')) return

    const selectedResidents = values.splitBetween?.length ? values.splitBetween : state.users.map((user) => user.id)
    const responsibleUser = state.users.find((user) => user.id === values.responsible)
    const payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      description: values.description,
      category: values.category,
      responsible: responsibleUser?.name ?? values.responsible,
      amount: Number(values.amount),
      date: values.date,
      dueDate: values.dueDate,
      status: values.status,
      splitBetween: selectedResidents,
      receiptUrl: values.receiptUrl ?? '',
      approvalStatus: 'pendente',
      approvalReason: '',
      history: [],
    }

    if (editingId) {
      updateExpense({ ...state.expenses.find((expense) => expense.id === editingId)!, ...payload, id: editingId })
      setEditingId(null)
    } else {
      addExpense(payload, receiptFile ?? undefined)
    }

    setReceiptFile(null)
    reset({ status: 'pendente', splitBetween: state.users.map((user) => user.id) } as Expense)
  }

  const startEdit = (expense: Expense) => {
    if (!requireAdmin('editar despesas')) return
    const responsibleUser = state.users.find((user) => user.name === expense.responsible)
    setEditingId(expense.id)
    reset({
      ...expense,
      responsible: responsibleUser?.id ?? expense.responsible,
      splitBetween: expense.splitBetween?.length ? expense.splitBetween : state.users.map((user) => user.id),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{editingId ? 'Editar despesa' : 'Nova despesa'}</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Descricao" {...register('description', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Categoria" {...register('category', { required: true })} />
            <select className="w-full rounded-xl border px-3 py-3" {...register('responsible', { required: true })}>
              <option value="">Quem pagou ou ficou responsavel?</option>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Valor" type="number" step="0.01" {...register('amount', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Data" type="date" {...register('date', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Vencimento" type="date" {...register('dueDate', { required: true })} />
            <select className="w-full rounded-xl border px-3 py-3" {...register('status')}>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>

            <fieldset className="rounded-2xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-slate-700">Dividir com</legend>
              <p className="text-sm text-slate-500">O administrador escolhe quais moradores entram nesta despesa.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {state.users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" value={user.id} {...register('splitBetween', { required: true })} />
                    {user.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <input className="w-full rounded-xl border px-3 py-3" placeholder="Link do comprovante" {...register('receiptUrl')} />
            <input className="w-full rounded-xl border px-3 py-3" type="file" accept="image/*,application/pdf" onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)} />
            <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" type="submit">Salvar despesa</button>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Despesas da casa</h2>
          <p className="mt-3 text-slate-500">Voce pode acompanhar todas as despesas. O administrador define quais moradores entram em cada divisao.</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <input className="rounded-xl border px-3 py-2" placeholder="Filtrar por mes (YYYY-MM)" value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)} />
          <select className="rounded-xl border px-3 py-2" value={filterResident} onChange={(event) => setFilterResident(event.target.value)}>
            <option value="">Todos os moradores</option>
            {state.users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <select className="rounded-xl border px-3 py-2" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const splitBetween = expense.splitBetween?.length ? expense.splitBetween : state.users.map((user) => user.id)
            const individualAmount = expense.amount / splitBetween.length
            const currentUserShare = currentUser && splitBetween.includes(currentUser.id)

            return (
              <div key={expense.id} className={`rounded-2xl border p-4 ${currentUserShare ? 'border-sky-200 bg-sky-50/50' : 'border-slate-200'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{expense.description}</p>
                    <p className="text-sm text-slate-500">{expense.category} - responsavel: {expense.responsible}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sky-700">R$ {expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{expense.status}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Divisao: R$ {individualAmount.toFixed(2)} por morador</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expense.approvalStatus === 'aprovado' ? 'bg-emerald-100 text-emerald-700' : expense.approvalStatus === 'rejeitado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {expense.approvalStatus ?? 'pendente'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {splitBetween.map((residentId) => (
                      <span key={residentId} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {getUserName(residentId)}
                      </span>
                    ))}
                  </div>
                  {expense.receiptUrl ? (
                    <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-700" href={expense.receiptUrl} target="_blank" rel="noreferrer">
                      <FileText size={16} /> Ver comprovante
                    </a>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-full bg-slate-100 px-3 py-2 text-sm" onClick={() => startEdit(expense)} type="button">Editar</button>
                    <button className="rounded-full bg-emerald-100 px-3 py-2 text-sm text-emerald-700" onClick={() => approveExpense(expense.id, true)} type="button">Aprovar</button>
                    <button className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => approveExpense(expense.id, false, 'Verifique os valores e categorias')} type="button">Rejeitar</button>
                    <button className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => deleteExpense(expense.id)} type="button">Excluir</button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
