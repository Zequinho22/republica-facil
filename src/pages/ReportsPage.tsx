import { FileSpreadsheet, FileText } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { useAppContext } from '../context/AppContext'

const safeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()

const downloadPdf = (pdf: jsPDF, fileName: string) => {
  const url = URL.createObjectURL(pdf.output('blob'))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ReportsPage() {
  const { state, users, notify } = useAppContext()
  const expenseTotal = state.expenses.reduce((sum, item) => sum + item.amount, 0)
  const paidTotal = state.expenses.filter((item) => item.status === 'pago').reduce((sum, item) => sum + item.amount, 0)
  const pendingTotal = expenseTotal - paidTotal
  const date = new Date().toISOString().slice(0, 10)
  const baseName = `relatorio-conta-${safeFileName(state.house.name)}-${date}`

  const socialRows = state.socialEvents.flatMap((event) => event.items.flatMap((item) => {
    const participants = item.participants ?? []
    const share = item.totalPrice / Math.max(participants.length, 1)
    return participants.map((participantId) => ({
      Evento: event.name,
      Data: event.date,
      Item: item.name,
      Participante: event.participants?.find((participant) => participant.id === participantId)?.name ?? users.find((user) => user.id === participantId)?.name ?? participantId,
      'Valor devido': share,
    }))
  }))

  const downloadPdfReport = () => {
    try {
      const pdf = new jsPDF()
      pdf.setFontSize(18)
      pdf.text(`Relatório — ${state.house.name}`, 14, 18)
      pdf.setFontSize(10)
      pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 25)
      autoTable(pdf, { startY: 32, head: [['Descrição', 'Categoria', 'Responsável', 'Valor', 'Status', 'Vencimento']], body: state.expenses.map((expense) => [expense.description, expense.category, expense.responsible, `R$ ${expense.amount.toFixed(2)}`, expense.status, expense.dueDate]), foot: [['Total', '', '', `R$ ${expenseTotal.toFixed(2)}`, '', '']], styles: { fontSize: 8 }, headStyles: { fillColor: [2, 132, 199] } })
      const finalY = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 42
      pdf.setFontSize(13)
      pdf.text('Divisão de despesas sociais', 14, finalY + 12)
      autoTable(pdf, { startY: finalY + 16, head: [['Evento', 'Data', 'Item consumido', 'Participante', 'Valor devido']], body: socialRows.length ? socialRows.map((row) => [row.Evento, row.Data, row.Item, row.Participante, `R$ ${row['Valor devido'].toFixed(2)}`]) : [['Nenhuma participação social cadastrada', '', '', '', '']], styles: { fontSize: 8 }, headStyles: { fillColor: [5, 150, 105] } })
      downloadPdf(pdf, `${baseName}.pdf`)
      notify('Relatório PDF gerado com sucesso.', 'success')
    } catch (error) { notify('Falha ao gerar o relatório PDF. Tente novamente.', 'error'); console.error(error) }
  }

  const downloadExcelReport = () => {
    try {
      const workbook = XLSX.utils.book_new()
      const expenses = state.expenses.map((expense) => ({ Descrição: expense.description, Categoria: expense.category, Responsável: expense.responsible, Valor: expense.amount, Status: expense.status, Vencimento: expense.dueDate }))
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expenses), 'Despesas')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(socialRows), 'Social')
      XLSX.writeFile(workbook, `${baseName}.xlsx`)
      notify('Relatório Excel gerado com sucesso.', 'success')
    } catch (error) { notify('Falha ao gerar o relatório Excel. Tente novamente.', 'error'); console.error(error) }
  }

  const categorySummary = state.expenses.reduce((acc, expense) => { acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount; return acc }, {} as Record<string, number>)

  return <div className="space-y-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm uppercase tracking-[0.3em] text-slate-500">Relatórios</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">Relatório completo da conta</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Exporte as despesas e participações sociais em PDF ou Excel.</p></div><div className="grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={downloadPdfReport} className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"><FileText size={16} /> Gerar PDF</button>
      <button type="button" onClick={downloadExcelReport} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"><FileSpreadsheet size={16} /> Gerar Excel</button>
    </div></div><div className="grid gap-4 md:grid-cols-3">{[['Despesas totais', expenseTotal], ['Total pago', paidTotal], ['Total pendente', pendingTotal]].map(([label, total]) => <div key={String(label)} className="rounded-3xl bg-slate-50 p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold text-slate-900">R$ {Number(total).toFixed(2)}</p></div>)}</div></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold text-slate-900">Resumo por categoria</h2><p className="text-sm text-slate-500">Acompanhe os principais valores por grupo de despesa.</p></div><FileText size={20} className="text-slate-400" /></div><div className="space-y-3">{state.expenses.length === 0 ? <p className="text-sm text-slate-500">Ainda não há despesas registradas.</p> : Object.entries(categorySummary).map(([category, total]) => <div key={category} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="font-medium text-slate-700">{category}</span><span className="text-slate-900">R$ {total.toFixed(2)}</span></div>)}</div></div>
  </div>
}
