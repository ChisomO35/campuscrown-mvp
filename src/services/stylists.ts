import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from './firebase'
import type { Stylist } from './types'

export async function listVerifiedStylistsUNC(): Promise<Stylist[]> {
  const q = query(
    collection(db, 'stylists'),
    where('campus', '==', 'UNC'),
    where('verified', '==', true),
    where('setupComplete', '==', true),
    limit(50)
  )
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ ...(d.data() as any), stylistId: d.id } as Stylist))
}

export async function getStylist(stylistId: string): Promise<Stylist | null> {
  const snap = await getDoc(doc(db, 'stylists', stylistId))
  if (!snap.exists()) return null
  return { ...(snap.data() as any), stylistId: snap.id } as Stylist
}

export async function listStylistsByIds(ids: string[]): Promise<Stylist[]> {
  if (ids.length === 0) return []
  // Firestore 'in' query supports up to 10-30 IDs usually, 
  // but let's stick to simple individual fetches or a filtered query if needed.
  // For favorites, many-individual-fetches is fine for MVP.
  const promises = ids.map((id) => getStylist(id))
  const results = await Promise.all(promises)
  return results.filter((s): s is Stylist => s !== null)
}

