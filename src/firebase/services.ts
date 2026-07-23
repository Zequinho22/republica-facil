import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db, storage } from './config'
import type { Announcement, Expense, Payment, Republic, SocialEvent, Task, UserProfile } from '../types'

const toDoc = <T extends { id: string }>(docRef: any, data: any): T => ({ id: docRef.id, ...data } as T)

export async function signUpWithEmail(email: string, password: string, profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { republicId?: string }) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const payload: Omit<UserProfile, 'id'> = {
    ...profile,
    email,
    authUid: result.user.uid,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: result.user.uid,
    republicId: profile.republicId ?? '',
  }

  await setDoc(doc(db, 'users', result.user.uid), payload)
  return result.user
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export async function logoutUser() {
  return signOut(auth)
}

export async function createRepublic(data: Omit<Republic, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<Republic, 'id'> = {
    ...data,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'republics'), payload)
  return refDoc.id
}

export async function getRepublicById(id: string) {
  const snapshot = await getDoc(doc(db, 'republics', id))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Republic) : null
}

export async function fetchUsers(republicId?: string) {
  const q = republicId ? query(collection(db, 'users'), where('republicId', '==', republicId)) : query(collection(db, 'users'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<UserProfile>(docSnap, docSnap.data()))
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<Expense, 'id'> = {
    ...expense,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'expenses'), payload)
  return refDoc.id
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  const { id: _, ...rest } = data as Expense
  await updateDoc(doc(db, 'expenses', id), { ...rest, updatedAt: serverTimestamp() })
}

export async function deleteExpense(id: string) {
  await deleteDoc(doc(db, 'expenses', id))
}

export async function fetchExpenses(republicId: string) {
  const q = query(collection(db, 'expenses'), where('republicId', '==', republicId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<Expense>(docSnap, docSnap.data()))
}

export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<Payment, 'id'> = {
    ...payment,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'payments'), payload)
  return refDoc.id
}

export async function fetchPayments(republicId: string) {
  const q = query(collection(db, 'payments'), where('republicId', '==', republicId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<Payment>(docSnap, docSnap.data()))
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<Task, 'id'> = {
    ...task,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'tasks'), payload)
  return refDoc.id
}

export async function fetchTasks(republicId: string) {
  const q = query(collection(db, 'tasks'), where('republicId', '==', republicId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<Task>(docSnap, docSnap.data()))
}

export async function updateTask(id: string, data: Partial<Task>) {
  const { id: _, ...rest } = data as Task
  await updateDoc(doc(db, 'tasks', id), { ...rest, updatedAt: serverTimestamp() })
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, 'tasks', id))
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<Announcement, 'id'> = {
    ...announcement,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'announcements'), payload)
  return refDoc.id
}

export async function fetchAnnouncements(republicId: string) {
  const q = query(collection(db, 'announcements'), where('republicId', '==', republicId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<Announcement>(docSnap, docSnap.data()))
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>) {
  const { id: _, ...rest } = data as Announcement
  await updateDoc(doc(db, 'announcements', id), { ...rest, updatedAt: serverTimestamp() })
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, 'announcements', id))
}

export async function createSocialEvent(event: Omit<SocialEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const payload: Omit<SocialEvent, 'id'> = {
    ...event,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    createdBy: auth.currentUser?.uid ?? '',
  }
  const refDoc = await addDoc(collection(db, 'socialEvents'), payload)
  return refDoc.id
}

export async function updateSocialEvent(id: string, data: Partial<SocialEvent>) {
  const { id: _, ...rest } = data as SocialEvent
  await updateDoc(doc(db, 'socialEvents', id), { ...rest, updatedAt: serverTimestamp() })
}

export async function deleteSocialEvent(id: string) {
  await deleteDoc(doc(db, 'socialEvents', id))
}

export async function fetchSocialEvents(republicId: string) {
  const q = query(collection(db, 'socialEvents'), where('republicId', '==', republicId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => toDoc<SocialEvent>(docSnap, docSnap.data()))
}

export async function updateUserProfile(id: string, data: Partial<UserProfile>) {
  const { id: _, ...rest } = data as UserProfile
  await updateDoc(doc(db, 'users', id), { ...rest, updatedAt: serverTimestamp() })
}

export async function uploadReceipt(file: File, path: string) {
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
