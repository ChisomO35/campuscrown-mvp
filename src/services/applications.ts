import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import type { StylistApplication, StylistApplicationStatus } from './types'

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

export async function submitStylistApplication(input: Omit<StylistApplication, 'applicationId' | 'status' | 'submittedAt'>) {
  const nowIso = new Date().toISOString()
  const data = omitUndefined({
    ...input,
    status: 'pending',
    submittedAt: nowIso,
    createdAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, 'stylistApplications'), data)
  return ref.id
}

export async function getMyApplication(uid: string): Promise<StylistApplication | null> {
  const q = query(collection(db, 'stylistApplications'), where('userId', '==', uid))
  const snaps = await getDocs(q)
  const first = snaps.docs[0]
  if (!first) return null
  return { ...(first.data() as any), applicationId: first.id } as StylistApplication
}

export async function listPendingApplications(): Promise<StylistApplication[]> {
  const q = query(collection(db, 'stylistApplications'), where('status', '==', 'pending'))
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ ...(d.data() as any), applicationId: d.id } as StylistApplication))
}

export async function getApplication(applicationId: string): Promise<StylistApplication | null> {
  const snap = await getDoc(doc(db, 'stylistApplications', applicationId))
  if (!snap.exists()) return null
  return { ...(snap.data() as any), applicationId: snap.id } as StylistApplication
}

export async function setApplicationStatus(
  applicationId: string,
  status: StylistApplicationStatus,
  reviewedBy: string,
  rejectionReason?: string,
) {
  const base: Record<string, unknown> = {
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }

  if (status === 'rejected') {
    base.rejectionReason = rejectionReason ?? 'Not approved.'
  } else {
    // Clear any previous rejection reason when moving out of rejected state
    base.rejectionReason = null
  }

  await updateDoc(doc(db, 'stylistApplications', applicationId), base)
}

