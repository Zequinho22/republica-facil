import { useForm } from 'react-hook-form'
import { useAppContext } from '../context/AppContext'
import type { Task } from '../types'

export function TasksPage() {
  const { state, canManage, addTask, updateTask, deleteTask, requireAdmin } = useAppContext()
  const { register, handleSubmit, reset } = useForm<Task>()

  const submit = (values: Task) => {
    if (!requireAdmin('criar tarefas')) return
    addTask({
      title: values.title,
      description: values.description,
      assignee: values.assignee,
      priority: values.priority,
      dueDate: values.dueDate,
      completed: false,
    })
    reset()
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Nova tarefa</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleSubmit(submit)}>
            <input className="rounded-xl border px-3 py-3" placeholder="Titulo" {...register('title', { required: true })} />
            <input className="rounded-xl border px-3 py-3" placeholder="Descricao" {...register('description', { required: true })} />
            <input className="rounded-xl border px-3 py-3" placeholder="Responsavel" {...register('assignee', { required: true })} />
            <select className="rounded-xl border px-3 py-3" {...register('priority', { required: true })}>
              <option value="baixa">Baixa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <input className="rounded-xl border px-3 py-3" type="date" {...register('dueDate', { required: true })} />
            <button className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white md:col-span-2 xl:col-span-5" type="submit">Criar tarefa</button>
          </form>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Tarefas da casa</h2>
          <p className="mt-3 text-slate-500">Moradores podem visualizar responsaveis, prazos e progresso. Alteracoes ficam com o administrador.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Tarefas pendentes</h2>
          <div className="mt-4 space-y-3">
            {state.tasks.filter((task) => !task.completed).map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500">{task.description}</p>
                  </div>
                  {canManage ? (
                    <button className="rounded-full bg-emerald-100 px-3 py-2 text-sm text-emerald-700" onClick={() => updateTask({ ...task, completed: true })} type="button">Concluir</button>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-slate-500">Responsavel: {task.assignee} - Prioridade: {task.priority} - Prazo: {task.dueDate}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Tarefas concluidas</h2>
          <div className="mt-4 space-y-3">
            {state.tasks.filter((task) => task.completed).map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-500">{task.description}</p>
                  </div>
                  {canManage ? (
                    <button className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => deleteTask(task.id)} type="button">Excluir</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
