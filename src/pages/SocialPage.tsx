import { PlusCircle, Users, XCircle, FileText, Download, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useAppContext } from '../context/AppContext'
import type { SocialEvent, SocialItem } from '../types'
import { downloadSocialReportPdf } from '../utils/socialReportPdf'

const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`

const defaultItem = (): SocialItem => ({
  id: `item-${Date.now()}`,
  name: '',
  category: 'Outros',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  participants: [],
  attachments: [],
})

export function SocialPage() {
  const { currentUser, socialEvents, addSocialEvent, updateSocialEvent, notify, users, canManage, state } = useAppContext()
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState('')
  const { register, control, handleSubmit, reset, watch, setValue } = useForm<Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    defaultValues: {
      name: '',
      date: '',
      location: '',
      description: '',
      participants: [],
      items: [defaultItem()],
      approvalStatus: 'pendente',
      approvalReason: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const eventParticipants = watch('participants') ?? []

  const addParticipant = () => {
    const name = participantName.trim()
    if (!name) return
    if (eventParticipants.some((participant) => participant.name.toLowerCase() === name.toLowerCase())) {
      notify('Esta pessoa já participa do evento.', 'info')
      return
    }
    setValue('participants', [...eventParticipants, { id: `guest-${Date.now()}`, name }])
    setParticipantName('')
  }

  const eventSummary = useMemo(() => {
    const total = socialEvents.reduce((sum, event) => sum + event.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0), 0)
    const participantsCount = new Set(socialEvents.flatMap((event) => event.items.flatMap((item) => item.participants))).size
    return { total, participantsCount }
  }, [socialEvents])

  const onSubmit = async (data: Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!canManage) return
    const payload: Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      ...data,
      participants: data.participants ?? [],
      items: data.items.map((item) => ({
        ...item,
        id: item.id || `item-${Date.now()}`,
        totalPrice: item.unitPrice * item.quantity,
        attachments: item.attachments ?? [],
      })),
      approvalStatus: data.approvalStatus ?? 'pendente',
      approvalReason: data.approvalReason,
    }

    if (editingEventId) {
      await updateSocialEvent({ ...payload, id: editingEventId, createdAt: '', updatedAt: '', createdBy: currentUser?.id })
      notify('Evento social atualizado.', 'success')
    } else {
      await addSocialEvent(payload)
      notify('Evento social criado.', 'success')
    }

    reset({ name: '', date: '', location: '', description: '', participants: [], items: [defaultItem()], approvalStatus: 'pendente', approvalReason: '' })
    setEditingEventId(null)
  }

  const onEdit = (event: SocialEvent) => {
    setEditingEventId(event.id)
    reset({
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      participants: event.participants ?? [],
      items: event.items,
      approvalStatus: event.approvalStatus ?? 'pendente',
      approvalReason: event.approvalReason,
    })
  }

  const totalsByEvent = socialEvents.map((event) => {
    const total = event.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const perParticipant = new Map<string, number>()
    event.items.forEach((item) => {
      const share = item.totalPrice / Math.max(item.participants.length, 1)
      item.participants.forEach((participant) => {
        perParticipant.set(participant, (perParticipant.get(participant) ?? 0) + share)
      })
    })
    return { event, total, perParticipant }
  })

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Social</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Eventos, divisões e comprovantes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Cadastre festas, churrascos e compras coletivas com divisão inteligente por item.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Eventos cadastrados</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{socialEvents.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Total social gasto</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(eventSummary.total)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Novo evento social</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 lg:grid-cols-2">
                <input className="w-full rounded-2xl border px-4 py-3" placeholder="Nome do evento" {...register('name', { required: true })} />
                <input className="w-full rounded-2xl border px-4 py-3" placeholder="Local" {...register('location', { required: true })} />
                <input className="w-full rounded-2xl border px-4 py-3" type="date" {...register('date', { required: true })} />
                <select className="w-full rounded-2xl border px-4 py-3" {...register('approvalStatus')}>
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>

              <textarea className="w-full rounded-2xl border px-4 py-3" placeholder="Descrição" rows={4} {...register('description')} />

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h3 className="font-semibold text-slate-900">Pessoas do evento</h3><p className="text-sm text-slate-500">Adicione as pessoas e marque, em cada item, somente quem comeu ou bebeu.</p></div>
                  <div className="flex gap-2"><input value={participantName} onChange={(event) => setParticipantName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addParticipant() } }} className="min-w-0 rounded-2xl border px-3 py-2" placeholder="Nome da pessoa" /><button type="button" onClick={addParticipant} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white"><UserPlus size={16} /> Adicionar</button></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{eventParticipants.length === 0 ? <span className="text-sm text-slate-500">Nenhuma pessoa adicionada ainda.</span> : eventParticipants.map((participant) => <span key={participant.id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-700">{participant.name}<button type="button" aria-label={`Remover ${participant.name}`} onClick={() => { setValue('participants', eventParticipants.filter((item) => item.id !== participant.id)); setValue('items', watchedItems.map((item) => ({ ...item, participants: item.participants.filter((id) => id !== participant.id) }))) }} className="text-rose-600"><XCircle size={15} /></button></span>)}</div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">Itens do evento</h3>
                  <button type="button" className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => append(defaultItem())}>
                    <PlusCircle size={16} /> Adicionar item
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="font-semibold text-slate-900">Item {index + 1}</p>
                        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => remove(index)}>
                          <XCircle size={16} /> Remover
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Nome do item" {...register(`items.${index}.name`, { required: true })} />
                        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Categoria" {...register(`items.${index}.category`, { required: true })} />
                        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Quantidade" type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true, required: true })} />
                      </div>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <input className="w-full rounded-2xl border px-4 py-3" placeholder="Valor unitário" type="number" step="0.01" {...register(`items.${index}.unitPrice`, { valueAsNumber: true, required: true })} />
                        <div className="rounded-2xl border bg-white px-4 py-3"><p className="mb-2 text-sm font-medium text-slate-700">Quem consumiu este item?</p><div className="max-h-28 space-y-1 overflow-y-auto">{eventParticipants.length === 0 ? <p className="text-sm text-slate-500">Adicione pessoas acima.</p> : eventParticipants.map((participant) => <label key={participant.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={(watchedItems[index]?.participants ?? []).includes(participant.id)} onChange={() => { const selected = watchedItems[index]?.participants ?? []; setValue(`items.${index}.participants`, selected.includes(participant.id) ? selected.filter((id) => id !== participant.id) : [...selected, participant.id]) }} />{participant.name}</label>)}</div></div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">Valor total: {formatCurrency((watchedItems[index]?.unitPrice ?? 0) * (watchedItems[index]?.quantity ?? 1))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                {editingEventId ? 'Salvar alterações' : 'Criar evento'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Histórico</p>
                <h2 className="text-xl font-semibold text-slate-900">Últimos eventos</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">{socialEvents.length} eventos</div>
            </div>
            <div className="space-y-4">
              {socialEvents.map((event) => (
                <button key={event.id} type="button" className="w-full rounded-3xl border border-slate-200 p-4 text-left transition hover:border-sky-300" onClick={() => onEdit(event)}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{event.name}</p>
                      <p className="text-sm text-slate-500">{event.location} • {event.date}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.approvalStatus === 'aprovado' ? 'bg-emerald-100 text-emerald-700' : event.approvalStatus === 'rejeitado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{event.approvalStatus}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{event.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Resumo de participação</h2>
              <p className="text-sm text-slate-500">Veja quanto cada pessoa deve pagar com base nos itens que participou.</p>
            </div>
            <Users size={20} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {totalsByEvent.map(({ event, total, perParticipant }) => (
              <div key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{event.name}</p>
                    <p className="text-sm text-slate-500">Total do evento</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{formatCurrency(total)}</p>
                </div>
                {Array.from(perParticipant.entries()).map(([participantId, amount]) => (
                  <div key={participantId} className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <span>{users.find((user) => user.id === participantId)?.name ?? participantId}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ações rápidas</h2>
          <div className="mt-4 space-y-3">
            <button type="button" onClick={() => { try { downloadSocialReportPdf(state.house.name, socialEvents, users); notify('Relatório social em PDF gerado com sucesso.', 'success') } catch (error) { notify('Falha ao gerar o relatório social em PDF.', 'error'); console.error(error) } }} className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Gerar relatório em PDF</span>
              <Download size={16} />
            </button>
            <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Gerar comprovantes</span>
              <FileText size={16} />
            </button>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Moradores com participação</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{eventSummary.participantsCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
