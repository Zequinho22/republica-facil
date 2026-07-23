import { useAppContext } from '../context/AppContext'

export function ProfilePage() {
  const { currentUser, updateProfile } = useAppContext()

  const handleSave = () => {
    updateProfile({ phone: '(11) 90000-1111', course: 'Design' })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Perfil</h2>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="flex flex-col items-center rounded-2xl bg-slate-50 p-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-600 text-3xl font-semibold text-white">{currentUser?.name?.[0] ?? 'U'}</div>
          <p className="mt-4 text-lg font-semibold text-slate-900">{currentUser?.name}</p>
          <p className="text-sm text-slate-500">{currentUser?.role}</p>
        </div>

        <div className="flex-1 space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Nome</p>
            <p className="font-semibold text-slate-900">{currentUser?.name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">E-mail</p>
            <p className="font-semibold text-slate-900">{currentUser?.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Telefone</p>
            <p className="font-semibold text-slate-900">{currentUser?.phone}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Curso</p>
            <p className="font-semibold text-slate-900">{currentUser?.course}</p>
          </div>
          <button className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" onClick={handleSave} type="button">Atualizar perfil</button>
        </div>
      </div>
    </div>
  )
}
