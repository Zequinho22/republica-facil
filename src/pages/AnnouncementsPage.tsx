import { useForm } from 'react-hook-form'
import { useAppContext } from '../context/AppContext'
import type { Announcement } from '../types'

export function AnnouncementsPage() {
  const { state, currentUser, canManage, addAnnouncement, deleteAnnouncement, requireAdmin } = useAppContext()
  const { register, handleSubmit, reset } = useForm<Announcement>()

  const submit = (values: Announcement) => {
    if (!requireAdmin('criar avisos')) return
    addAnnouncement({
      title: values.title,
      content: values.content,
      author: currentUser?.name ?? 'Administrador',
      important: Boolean(values.important),
    })
    reset()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Criar aviso</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
            <input className="w-full rounded-xl border px-3 py-3" placeholder="Titulo" {...register('title', { required: true })} />
            <textarea className="min-h-32 w-full rounded-xl border px-3 py-3" placeholder="Mensagem" {...register('content', { required: true })} />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600">
              <input type="checkbox" {...register('important')} />
              Marcar como importante
            </label>
            <button className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white" type="submit">Publicar aviso</button>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Avisos da casa</h2>
          <p className="mt-3 text-slate-500">Moradores podem acompanhar todos os comunicados publicados pela administracao.</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Historico de avisos</h2>
        <div className="mt-4 space-y-3">
          {state.announcements.map((announcement) => (
            <div key={announcement.id} className={`rounded-2xl border p-4 ${announcement.important ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{announcement.title}</p>
                  <p className="text-sm text-slate-500">{announcement.content}</p>
                </div>
                {canManage ? (
                  <button className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => deleteAnnouncement(announcement.id)} type="button">Excluir</button>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-500">Por {announcement.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
