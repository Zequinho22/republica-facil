import { useForm } from 'react-hook-form'
import { useAppContext } from '../context/AppContext'
import type { Payment } from '../types'

export function PaymentsPage() {
  const { state, canManage, addPayment, requireAdmin } = useAppContext()
  const { register, handleSubmit, reset } = useForm<Payment>()

  const submit = (values: Payment) => {
    if (!requireAdmin('registrar pagamentos')) return
    addPayment({
      expenseId: values.expenseId,
      payer: values.payer,
      amount: Number(values.amount),
      method: values.method,
      status: values.status,
      paymentDate: values.paymentDate,
    })
    reset()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Registrar pagamento</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
            <select className="w-full rounded-xl border px-3 py-3" {...register('expenseId', { required: true })}>
              <option value="">Selecione a despesa</option>
              {state.expenses.map((expense) => (
                <option key={expense.id} value={expense.id}>{expense.description} - R$ {expense.amount.toFixed(2)}</option>
              ))}
            </select>
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Pagador" {...register('payer', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Valor" type="number" step="0.01" {...register('amount', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Metodo" {...register('method', { required: true })} />
            <input className="w-full rounded-xl border px-3 py-3" type="date" {...register('paymentDate')} />
            <select className="w-full rounded-xl border px-3 py-3" {...register('status', { required: true })}>
              <option value="confirmado">Confirmado</option>
              <option value="pendente">Pendente</option>
            </select>
            <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" type="submit">Salvar pagamento</button>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Pagamentos da casa</h2>
          <p className="mt-3 text-slate-500">Moradores podem acompanhar quem pagou, valores e status. Registros ficam com o administrador.</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Historico de pagamentos</h2>
        <div className="mt-4 space-y-3">
          {state.payments.map((payment) => {
            const expense = state.expenses.find((item) => item.id === payment.expenseId)
            return (
              <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{expense?.description ?? 'Despesa'}</p>
                    <p className="text-sm text-slate-500">Pago por {payment.payer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-700">R$ {payment.amount.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{payment.method} - {payment.status}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
