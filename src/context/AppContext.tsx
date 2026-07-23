import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildDemoState } from '../data/demoData'
import { auth, isFirebaseConfigured } from '../firebase/config'
import { createAnnouncement, createExpense, createPayment, createSocialEvent, createTask, deleteAnnouncement, deleteExpense, deleteSocialEvent, deleteTask, fetchAnnouncements, fetchExpenses, fetchPayments, fetchSocialEvents, fetchTasks, fetchUsers, logoutUser, resetPassword, signInWithEmail, signUpWithEmail, updateExpense, updateSocialEvent, updateTask, updateUserProfile, uploadReceipt } from '../firebase/services'
import type { Announcement, AppState, Expense, House, NotificationItem, Payment, Republic, SocialEvent, Task, UserProfile } from '../types'

interface AppContextValue {
  state: AppState
  currentUser: UserProfile | null
  firebaseUser: FirebaseUser | null
  republic: Republic | null
  users: UserProfile[]
  expenses: Expense[]
  payments: Payment[]
  tasks: Task[]
  announcements: Announcement[]
  notifications: NotificationItem[]
  unreadNotifications: NotificationItem[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  feedback: { type: 'success' | 'info' | 'error'; message: string } | null
  notify: (message: string, type?: 'success' | 'info' | 'error') => void
  isAdmin: boolean
  canManage: boolean
  requireAdmin: (action?: string) => boolean
  authReady: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; email: string; password: string; phone: string; course: string; role: 'Administrador' | 'Morador'; republicId?: string }) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, file?: File) => Promise<void>
  updateExpense: (expense: Expense) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  approveExpense: (expenseId: string, approved: boolean, reason?: string) => Promise<void>
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, file?: File) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>
  deleteAnnouncement: (id: string) => Promise<void>
  socialEvents: SocialEvent[]
  addSocialEvent: (event: Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>
  updateSocialEvent: (event: SocialEvent) => Promise<void>
  deleteSocialEvent: (id: string) => Promise<void>
  markNotificationsRead: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const daysUntil = (date: string) => {
  const today = new Date()
  const target = new Date(`${date}T00:00:00`)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000)
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const demoState = useMemo(() => buildDemoState(), [])
  const demoRepublic = useMemo<Republic>(() => ({
    id: demoState.house.id,
    name: demoState.house.name,
    address: demoState.house.address,
    monthlyBudget: demoState.house.monthlyBudget,
    createdAt: demoState.house.createdAt,
    updatedAt: demoState.house.updatedAt,
    createdBy: demoState.currentUserId ?? 'demo',
  }), [demoState])
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(isFirebaseConfigured ? null : demoState.users[0])
  const [republic, setRepublic] = useState<Republic | null>(isFirebaseConfigured ? null : demoRepublic)
  const [users, setUsers] = useState<UserProfile[]>(isFirebaseConfigured ? [] : demoState.users)
  const [expenses, setExpenses] = useState<Expense[]>(isFirebaseConfigured ? [] : demoState.expenses)
  const [payments, setPayments] = useState<Payment[]>(isFirebaseConfigured ? [] : demoState.payments)
  const [tasks, setTasks] = useState<Task[]>(isFirebaseConfigured ? [] : demoState.tasks)
  const [announcements, setAnnouncements] = useState<Announcement[]>(isFirebaseConfigured ? [] : demoState.announcements)
  const [socialEvents, setSocialEvents] = useState<SocialEvent[]>(isFirebaseConfigured ? [] : demoState.socialEvents ?? [])
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState<AppContextValue['feedback']>(null)
  const [manualNotifications, setManualNotifications] = useState<NotificationItem[]>(isFirebaseConfigured ? [] : demoState.notifications ?? [])
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([])
  const sentReminderKey = useRef('')
  const isAdmin = currentUser?.role === 'Administrador'
  const canManage = isAdmin

  const createNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const item: NotificationItem = {
      id: `notification-${Date.now()}`,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    }
    setManualNotifications((prev) => [item, ...prev])
  }

  const notify = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ message, type })
    window.setTimeout(() => setFeedback(null), 3200)
  }

  const requireAdmin = (action = 'alterar dados') => {
    if (canManage) {
      return true
    }
    notify(`Apenas administradores podem ${action}.`, 'info')
    return false
  }

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!currentUser) return manualNotifications

    const expenseReminders = expenses
      .filter((expense) => expense.status !== 'pago' && daysUntil(expense.dueDate) === 2)
      .filter((expense) => {
        if (isAdmin) return true
        const splitBetween = expense.splitBetween ?? []
        return splitBetween.includes(currentUser.id)
      })
      .map((expense) => ({
        id: `expense-reminder-${expense.id}`,
        title: 'Despesa vence em 2 dias',
        message: `${expense.description} vence em ${expense.dueDate}. Valor total: R$ ${expense.amount.toFixed(2)}.`,
        type: 'despesa' as const,
        createdAt: new Date().toISOString(),
        read: readNotificationIds.includes(`expense-reminder-${expense.id}`),
        republicId: expense.republicId,
      }))

    const taskReminders = tasks
      .filter((task) => !task.completed && daysUntil(task.dueDate) === 2)
      .filter((task) => isAdmin || task.assignee === currentUser.name)
      .map((task) => ({
        id: `task-reminder-${task.id}`,
        title: 'Tarefa vence em 2 dias',
        message: `${task.title} precisa ser concluida ate ${task.dueDate}.`,
        type: 'tarefa' as const,
        createdAt: new Date().toISOString(),
        read: readNotificationIds.includes(`task-reminder-${task.id}`),
        republicId: task.republicId,
      }))

    return [...manualNotifications, ...expenseReminders, ...taskReminders]
  }, [currentUser, expenses, isAdmin, readNotificationIds, tasks, manualNotifications])

  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.read), [notifications])

  useEffect(() => {
    const key = unreadNotifications.map((notification) => notification.id).sort().join('|')
    if (!key || key === sentReminderKey.current) return

    sentReminderKey.current = key
    notify(`${unreadNotifications.length} lembrete(s) enviados para prazos em 2 dias.`, 'info')
  }, [unreadNotifications])

  const state = useMemo<AppState>(() => ({
    currentUserId: currentUser?.id ?? null,
    users,
    republics: republic ? [republic] : [],
    house: {
      id: republic?.id ?? 'demo-republic',
      name: republic?.name ?? 'República Fácil',
      address: republic?.address ?? '',
      monthlyBudget: republic?.monthlyBudget ?? 0,
      members: users.map((user) => user.name),
      createdAt: republic?.createdAt ?? '',
      updatedAt: republic?.updatedAt ?? '',
    } as House,
    expenses,
    payments,
    tasks,
    announcements,
    socialEvents,
    notifications,
  }), [announcements, currentUser, expenses, notifications, payments, republic, socialEvents, tasks, users])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    if (!firebaseUser) {
      setCurrentUser(null)
      setRepublic(null)
      setUsers([])
      setExpenses([])
      setPayments([])
      setTasks([])
      setAnnouncements([])
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const userDocs = await fetchUsers()
        const profile = userDocs.find((user) => user.email === firebaseUser.email)
        if (profile) {
          setCurrentUser(profile)
          const republicId = profile.republicId || 'demo-republic'
          const republicData = { id: republicId, name: 'República Fácil', address: 'Rua das Flores', monthlyBudget: 4200, createdAt: '', updatedAt: '', createdBy: profile.createdBy } as Republic
          setRepublic(republicData)
          const [expenseData, paymentData, taskData, announcementData, socialEventData] = await Promise.all([
            fetchExpenses(republicId),
            fetchPayments(republicId),
            fetchTasks(republicId),
            fetchAnnouncements(republicId),
            fetchSocialEvents(republicId),
          ])
          setUsers(userDocs)
          setExpenses(expenseData)
          setPayments(paymentData)
          setTasks(taskData)
          setAnnouncements(announcementData)
          setSocialEvents(socialEventData)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [firebaseUser])

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      const demoUser = demoState.users.find((user) => user.email === email && user.password === password)
      if (!demoUser) {
        throw new Error('Use zecam@republicafacil.com / 123456 para entrar como administrador no modo demo.')
      }
      setCurrentUser(demoUser)
      setRepublic(demoRepublic)
      notify(`Entrada realizada como ${demoUser.role}.`)
      return
    }
    await signInWithEmail(email, password)
    notify('Login realizado com sucesso.')
  }

  const signup = async (data: { name: string; email: string; password: string; phone: string; course: string; role: 'Administrador' | 'Morador'; republicId?: string }) => {
    if (!isFirebaseConfigured) {
      const newUser: UserProfile = {
        id: `demo-user-${Date.now()}`,
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        course: data.course,
        role: data.role,
        republicId: data.republicId ?? demoRepublic.id,
        isApproved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id ?? 'demo',
      }
      setUsers((prev) => [...prev, newUser])
      setCurrentUser(newUser)
      setRepublic(demoRepublic)
      notify('Cadastro criado no modo demo.')
      return
    }

    await signUpWithEmail(data.email, data.password, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      course: data.course,
      role: data.role,
      republicId: data.republicId ?? '',
      isApproved: true,
    })
  }

  const resetPasswordHandler = async (email: string) => {
    if (!isFirebaseConfigured) {
      return
    }
    await resetPassword(email)
  }

  const logout = async () => {
    if (!isFirebaseConfigured) {
      setCurrentUser(null)
      notify('Sessao encerrada.', 'info')
      return
    }
    await logoutUser()
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return
    if (!isFirebaseConfigured) {
      setCurrentUser((prev) => prev ? { ...prev, ...data } : prev)
      setUsers((prev) => prev.map((user) => user.id === currentUser.id ? { ...user, ...data } : user))
      notify('Perfil atualizado.')
      return
    }
    await updateUserProfile(currentUser.id, data)
    setCurrentUser((prev) => prev ? { ...prev, ...data } : prev)
    notify('Perfil atualizado.')
  }

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, file?: File) => {
    if (!requireAdmin('criar despesas')) return
    let receiptUrl = expense.receiptUrl ?? ''
    const payload = { ...expense, republicId: expense.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic' }
    if (file && isFirebaseConfigured) {
      const receiptPath = `receipts/${firebaseUser?.uid ?? currentUser?.id ?? 'anonymous'}/${payload.republicId}/${Date.now()}-${file.name}`
      receiptUrl = await uploadReceipt(file, receiptPath)
    }

const attachmentType: import('../types').ReceiptAttachment['type'] =
        file?.type?.includes('pdf')
          ? 'pdf'
          : file?.type?.includes('image')
            ? 'nota'
            : 'recibo'

      const historyEntry = {
      id: `history-${Date.now()}`,
      action: 'Despesa cadastrada',
      user: currentUser?.name ?? 'Sistema',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      changes: `Despesa cadastrada: ${expense.description} - R$ ${expense.amount.toFixed(2)}`,
      attachments: receiptUrl
        ? [{
            id: `attachment-${Date.now()}`,
            name: file?.name ?? 'Comprovante',
            url: receiptUrl,
            type: attachmentType,
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser?.id ?? 'sistema',
          }]
        : undefined,
    }

    const finalPayload = { ...payload, receiptUrl, history: [historyEntry] }

    if (!isFirebaseConfigured) {
      const now = new Date().toISOString()
      setExpenses((prev) => [...prev, { ...finalPayload, id: `demo-expense-${Date.now()}`, createdAt: now, updatedAt: now, createdBy: currentUser?.id }])
      createNotification({
        title: 'Nova despesa cadastrada',
        message: `${currentUser?.name ?? 'Um morador'} cadastrou ${expense.description} por R$ ${expense.amount.toFixed(2)}.`,
        type: 'despesa',
        republicId: payload.republicId,
      })
      notify('Despesa salva.')
      return
    }

    await createExpense(finalPayload)
    const updated = await fetchExpenses(finalPayload.republicId)
    setExpenses(updated)
    createNotification({
      title: 'Nova despesa cadastrada',
      message: `${currentUser?.name ?? 'Um morador'} cadastrou ${expense.description} por R$ ${expense.amount.toFixed(2)}.`,
      type: 'despesa',
      republicId: payload.republicId,
    })
    notify('Despesa salva.')
  }

  const updateExpenseHandler = async (expense: Expense) => {
    if (!requireAdmin('editar despesas')) return
    const existingExpense = state.expenses.find((item) => item.id === expense.id)
    const historyEntry = {
      id: `history-${Date.now()}`,
      action: 'Despesa atualizada',
      user: currentUser?.name ?? 'Sistema',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      changes: `Despesa atualizada: ${expense.description} - R$ ${expense.amount.toFixed(2)}`,
    }
    const updatedExpense = {
      ...expense,
      updatedAt: new Date().toISOString(),
      history: [...(existingExpense?.history ?? []), historyEntry],
    }

    if (!isFirebaseConfigured) {
      setExpenses((prev) => prev.map((item) => item.id === expense.id ? updatedExpense : item))
      notify('Despesa atualizada.')
      return
    }
    await updateExpense(expense.id, updatedExpense)
    const updated = await fetchExpenses(expense.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic')
    setExpenses(updated)
    notify('Despesa atualizada.')
  }

  const deleteExpenseHandler = async (id: string) => {
    if (!requireAdmin('excluir despesas')) return
    if (!isFirebaseConfigured) {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id))
      notify('Despesa excluida.')
      return
    }
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    notify('Despesa excluida.')
  }

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, file?: File) => {
    if (!requireAdmin('registrar pagamentos')) return
    let receiptUrl = ''
    if (!isFirebaseConfigured) {
      const now = new Date().toISOString()
      setPayments((prev) => [...prev, { ...payment, id: `demo-payment-${Date.now()}`, receiptUrl, republicId: payment.republicId ?? currentUser?.republicId ?? republic?.id, createdAt: now, updatedAt: now, createdBy: currentUser?.id }])
      notify('Pagamento registrado.')
      return
    }
    if (file) {
      const receiptPath = `receipts/${firebaseUser?.uid ?? currentUser?.id ?? 'anonymous'}/${payment.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic'}/${Date.now()}-${file.name}`
      receiptUrl = await uploadReceipt(file, receiptPath)
    }
    const payload = { ...payment, receiptUrl, republicId: payment.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic' }
    await createPayment(payload)
    const updated = await fetchPayments(payload.republicId)
    setPayments(updated)
    notify('Pagamento registrado.')
  }

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!requireAdmin('criar tarefas')) return
    const payload = { ...task, republicId: task.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic' }
    if (!isFirebaseConfigured) {
      const now = new Date().toISOString()
      setTasks((prev) => [...prev, { ...payload, id: `demo-task-${Date.now()}`, createdAt: now, updatedAt: now, createdBy: currentUser?.id }])
      notify('Tarefa criada.')
      return
    }
    await createTask(payload)
    const updated = await fetchTasks(payload.republicId)
    setTasks(updated)
    notify('Tarefa criada.')
  }

  const updateTaskHandler = async (task: Task) => {
    if (!requireAdmin('alterar tarefas')) return
    if (!isFirebaseConfigured) {
      setTasks((prev) => prev.map((item) => item.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : item))
      notify('Tarefa atualizada.')
      return
    }
    await updateTask(task.id, task)
    const updated = await fetchTasks(task.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic')
    setTasks(updated)
    notify('Tarefa atualizada.')
  }

  const deleteTaskHandler = async (id: string) => {
    if (!requireAdmin('excluir tarefas')) return
    if (!isFirebaseConfigured) {
      setTasks((prev) => prev.filter((task) => task.id !== id))
      notify('Tarefa excluida.')
      return
    }
    await deleteTask(id)
    setTasks((prev) => prev.filter((task) => task.id !== id))
    notify('Tarefa excluida.')
  }

  const deleteAnnouncementHandler = async (id: string) => {
    if (!requireAdmin('excluir avisos')) return
    if (!isFirebaseConfigured) {
      setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id))
      notify('Aviso excluido.')
      return
    }
    await deleteAnnouncement(id)
    setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id))
    notify('Aviso excluido.')
  }

  const approveExpense = async (expenseId: string, approved: boolean, reason?: string) => {
    if (!requireAdmin('aprovar despesas')) return
    const approvalStatus = approved ? 'aprovado' : 'rejeitado'
    const expenseToUpdate = state.expenses.find((expense) => expense.id === expenseId)
    const historyEntry = {
      id: `history-${Date.now()}`,
      action: approved ? 'Despesa aprovada' : 'Despesa rejeitada',
      user: currentUser?.name ?? 'Sistema',
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      changes: reason ? `Motivo: ${reason}` : `${approved ? 'Aprovada' : 'Rejeitada'} sem motivo informado`,
    }
    const updatedHistory = [...(expenseToUpdate?.history ?? []), historyEntry]

    if (!isFirebaseConfigured) {
      setExpenses((prev) => prev.map((expense) =>
        expense.id === expenseId ? { ...expense, approvalStatus, approvalReason: reason, updatedAt: new Date().toISOString(), history: updatedHistory } : expense
      ))
      notify(`Despesa ${approved ? 'aprovada' : 'rejeitada'}.`)
      return
    }
    await updateExpense(expenseId, { approvalStatus, approvalReason: reason, history: updatedHistory })
    const updated = await fetchExpenses(currentUser?.republicId ?? republic?.id ?? 'demo-republic')
    setExpenses(updated)
    notify(`Despesa ${approved ? 'aprovada' : 'rejeitada'}.`)
  }

  const addSocialEvent = async (event: Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!requireAdmin('criar eventos sociais')) return
    const payload = { ...event, republicId: event.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic' }
    if (!isFirebaseConfigured) {
      const now = new Date().toISOString()
      setSocialEvents((prev) => [...prev, { ...payload, id: `demo-social-${Date.now()}`, createdAt: now, updatedAt: now, createdBy: currentUser?.id }])
      notify('Evento social salvo.')
      return
    }
    await createSocialEvent(payload)
    const updated = await fetchSocialEvents(payload.republicId)
    setSocialEvents(updated)
    notify('Evento social salvo.')
  }

  const updateSocialEventHandler = async (event: SocialEvent) => {
    if (!requireAdmin('editar eventos sociais')) return
    if (!isFirebaseConfigured) {
      setSocialEvents((prev) => prev.map((item) => item.id === event.id ? { ...event, updatedAt: new Date().toISOString() } : item))
      notify('Evento social atualizado.')
      return
    }
    await updateSocialEvent(event.id, event)
    const updated = await fetchSocialEvents(event.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic')
    setSocialEvents(updated)
    notify('Evento social atualizado.')
  }

  const deleteSocialEventHandler = async (id: string) => {
    if (!requireAdmin('excluir eventos sociais')) return
    if (!isFirebaseConfigured) {
      setSocialEvents((prev) => prev.filter((event) => event.id !== id))
      notify('Evento social excluido.')
      return
    }
    await deleteSocialEvent(id)
    setSocialEvents((prev) => prev.filter((event) => event.id !== id))
    notify('Evento social excluido.')
  }

  const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!requireAdmin('criar avisos')) return
    const payload = { ...announcement, republicId: announcement.republicId ?? currentUser?.republicId ?? republic?.id ?? 'demo-republic' }
    if (!isFirebaseConfigured) {
      const now = new Date().toISOString()
      setAnnouncements((prev) => [...prev, { ...payload, id: `demo-announcement-${Date.now()}`, createdAt: now, updatedAt: now, createdBy: currentUser?.id }])
      notify('Aviso publicado.')
      return
    }
    await createAnnouncement(payload)
    const updated = await fetchAnnouncements(payload.republicId)
    setAnnouncements(updated)
    notify('Aviso publicado.')
  }

  const markNotificationsRead = () => {
    setReadNotificationIds((prev) => Array.from(new Set([...prev, ...notifications.map((notification) => notification.id)])))
  }

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      currentUser,
      firebaseUser,
      republic,
      users,
      expenses,
      payments,
      tasks,
      announcements,
      notifications,
      unreadNotifications,
      searchTerm,
      setSearchTerm,
      feedback,
      notify,
      isAdmin,
      canManage,
      requireAdmin,
      authReady,
      loading,
      login,
      signup,
      resetPassword: resetPasswordHandler,
      logout,
      updateProfile,
      addExpense,
      updateExpense: updateExpenseHandler,
      deleteExpense: deleteExpenseHandler,
      addPayment,
      addTask,
      updateTask: updateTaskHandler,
      deleteTask: deleteTaskHandler,
      addAnnouncement,
      deleteAnnouncement: deleteAnnouncementHandler,
      socialEvents,
      addSocialEvent,
      updateSocialEvent: updateSocialEventHandler,
      deleteSocialEvent: deleteSocialEventHandler,
      approveExpense,
      markNotificationsRead,
    }),
    [state, currentUser, firebaseUser, republic, users, expenses, payments, tasks, announcements, notifications, unreadNotifications, searchTerm, feedback, isAdmin, canManage, authReady, loading],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
