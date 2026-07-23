import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SocialEvent, UserProfile } from '../types'

const safeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()

export function downloadSocialReportPdf(houseName: string, socialEvents: SocialEvent[], users: UserProfile[]) {
  const pdf = new jsPDF()
  pdf.setFontSize(18)
  pdf.text(`Relatório social — ${houseName}`, 14, 18)
  pdf.setFontSize(10)
  pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 25)

  const rows = socialEvents.flatMap((event) => event.items.flatMap((item) => {
    const participants = item.participants ?? []
    const share = item.totalPrice / Math.max(participants.length, 1)
    return participants.map((participantId) => {
      const name = event.participants?.find((participant) => participant.id === participantId)?.name
        ?? users.find((user) => user.id === participantId)?.name
        ?? participantId
      return [event.name, event.date, item.name, name, `R$ ${share.toFixed(2)}`]
    })
  }))

  autoTable(pdf, {
    startY: 32,
    head: [['Evento', 'Data', 'Item consumido', 'Participante', 'Valor devido']],
    body: rows.length ? rows : [['Nenhuma participação social cadastrada', '', '', '', '']],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [5, 150, 105] },
  })
  const url = URL.createObjectURL(pdf.output('blob'))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `relatorio-social-${safeFileName(houseName)}-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
