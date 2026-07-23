export function SettingsPage() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Configurações</h2>
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Permissões</p>
          <p className="text-sm text-slate-500">Administrador: gerenciar despesas, tarefas e avisos.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Notificações</p>
          <p className="text-sm text-slate-500">Conta vencendo, pagamento confirmado e novas tarefas.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">Segurança</p>
          <p className="text-sm text-slate-500">Rotas protegidas e validação de formulários habilitadas.</p>
        </div>
      </div>
    </div>
  )
}
