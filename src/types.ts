export type UserRole = 'Administrador' | 'Morador'
export type ExpenseStatus = 'pago' | 'pendente' | 'atrasado'
export type TaskPriority = 'alta' | 'media' | 'baixa'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  password?: string
  photoUrl?: string
  course: string
  role: UserRole
  republicId?: string
  authUid?: string
  isApproved: boolean
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface Republic {
  id: string
  name: string
  address: string
  monthlyBudget: number
  createdAt: string | any
  updatedAt: string | any
  createdBy: string
}

export interface ReceiptAttachment {
  id: string
  name: string
  url: string
  type: 'nota' | 'pix' | 'recibo' | 'pdf'
  uploadedAt: string
  uploadedBy: string
}

export interface HistoryEntry {
  id: string
  action: string
  user: string
  date: string
  time: string
  changes: string
  attachments?: ReceiptAttachment[]
}

export interface Expense {
  id: string
  description: string
  category: string
  responsible: string
  amount: number
  date: string
  dueDate: string
  status: ExpenseStatus
  splitBetween?: string[]
  receiptUrl?: string
  attachments?: ReceiptAttachment[]
  approvalStatus?: 'pendente' | 'aprovado' | 'rejeitado'
  approvalReason?: string
  history?: HistoryEntry[]
  observations?: string
  republicId?: string
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface Payment {
  id: string
  expenseId: string
  payer: string
  amount: number
  method: string
  status: 'confirmado' | 'pendente'
  receiptUrl?: string
  paymentDate?: string
  republicId?: string
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  priority: TaskPriority
  dueDate: string
  completed: boolean
  republicId?: string
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  author: string
  important: boolean
  republicId?: string
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'financeiro' | 'tarefa' | 'aviso' | 'despesa'
  createdAt: string | any
  read: boolean
  republicId?: string
}

export interface SocialItem {
  id: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  participants: string[]
  attachments?: ReceiptAttachment[]
}

export interface SocialParticipant {
  id: string
  name: string
}

export interface SocialEvent {
  id: string
  name: string
  date: string
  location: string
  description: string
  participants?: SocialParticipant[]
  items: SocialItem[]
  approvalStatus?: 'pendente' | 'aprovado' | 'rejeitado'
  approvalReason?: string
  history?: HistoryEntry[]
  republicId?: string
  createdAt: string | any
  updatedAt: string | any
  createdBy?: string
}

export interface AppState {
  currentUserId: string | null
  users: UserProfile[]
  house: House
  republics: Republic[]
  expenses: Expense[]
  payments: Payment[]
  tasks: Task[]
  announcements: Announcement[]
  socialEvents: SocialEvent[]
  notifications: NotificationItem[]
}

export interface House {
  id: string
  name: string
  address: string
  monthlyBudget: number
  members: string[]
  createdAt: string
  updatedAt: string
}
