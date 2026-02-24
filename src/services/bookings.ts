import { addDoc, collection, deleteField, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'
import type { Booking, BookingStatus, Conversation, LocationType, Message } from './types'

export async function createBookingRequest({
  clientId,
  stylistId,
  serviceId,
  startAt,
  endAt,
  locationType,
  mobileLocationNote,
  depositAmount,
  clientName,
  stylistName,
  totalAmount,
}: {
  clientId: string
  clientName: string
  stylistId: string
  stylistName: string
  serviceId: string
  startAt: string
  endAt: string
  locationType: LocationType
  mobileLocationNote?: string
  depositAmount: number
  totalAmount: number
}) {
  const nowIso = new Date().toISOString()
  const ref = await addDoc(collection(db, 'bookings'), {
    clientId,
    clientName,
    stylistId,
    stylistName,
    serviceId,
    campus: 'UNC',
    startAt,
    endAt,
    status: 'requested',
    requestedAt: nowIso,
    locationType,
    mobileLocationNote: mobileLocationNote ?? null,
    lastMessageAt: null,
    depositAmount,
    depositPaid: false,
    totalAmount,
    balancePaid: false,
    stylistHasNotification: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, 'bookings', bookingId))
  if (!snap.exists()) return null
  return { ...(snap.data() as any), bookingId: snap.id } as Booking
}

export async function listBookingsForUser(uid: string): Promise<Booking[]> {
  const q1 = query(collection(db, 'bookings'), where('clientId', '==', uid))
  const q2 = query(collection(db, 'bookings'), where('stylistId', '==', uid))
  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])
  const all = [...s1.docs, ...s2.docs].map((d) => ({ ...(d.data() as any), bookingId: d.id } as Booking))
  // simple dedupe
  const byId = new Map(all.map((b) => [b.bookingId, b]))
  return Array.from(byId.values()).sort((a, b) => (a.startAt > b.startAt ? 1 : -1))
}

export async function setBookingStatus(bookingId: string, status: BookingStatus, actorRole?: 'client' | 'stylist') {
  const patch: any = {
    status,
    updatedAt: serverTimestamp(),
  }
  if (status === 'confirmed' || status === 'declined') {
    patch.respondedAt = new Date().toISOString()
  }

  // Notification Logic
  if (actorRole === 'stylist') {
    patch.clientHasNotification = true
  } else if (actorRole === 'client') {
    patch.stylistHasNotification = true
  }

  await updateDoc(doc(db, 'bookings', bookingId), patch)
}

export async function listMessages(bookingId: string): Promise<Message[]> {
  const q = query(collection(db, 'bookings', bookingId, 'messages'), orderBy('createdAt', 'asc'))
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ ...(d.data() as any), messageId: d.id } as Message))
}

export async function sendMessage({
  bookingId,
  senderId,
  text,
}: {
  bookingId: string
  senderId: string
  text: string
}) {
  const nowIso = new Date().toISOString()
  await addDoc(collection(db, 'bookings', bookingId, 'messages'), {
    senderId,
    text,
    createdAt: nowIso,
  })
  await updateDoc(doc(db, 'bookings', bookingId), {
    lastMessageAt: nowIso,
    updatedAt: serverTimestamp(),
  })
}

export async function proposeReschedule(
  bookingId: string,
  proposal: { proposedStartAt: string; proposedEndAt: string; proposedBy: string },
  actorRole?: 'client' | 'stylist'
) {
  const updates: any = {
    rescheduleProposal: {
      ...proposal,
      createdAt: new Date().toISOString(),
    },
    updatedAt: serverTimestamp(),
  }

  if (actorRole === 'stylist') {
    updates.clientHasNotification = true
  } else if (actorRole === 'client') {
    updates.stylistHasNotification = true
  }

  await updateDoc(doc(db, 'bookings', bookingId), updates)
}

export async function respondToReschedule(bookingId: string, accept: boolean, actorRole?: 'client' | 'stylist') {
  const updates: any = {
    updatedAt: serverTimestamp(),
  }

  if (actorRole === 'stylist') {
    updates.clientHasNotification = true
  } else if (actorRole === 'client') {
    updates.stylistHasNotification = true
  }

  if (accept) {
    const snap = await getDoc(doc(db, 'bookings', bookingId))
    const data = snap.data() as Booking
    if (data.rescheduleProposal) {
      await updateDoc(doc(db, 'bookings', bookingId), {
        ...updates,
        startAt: data.rescheduleProposal.proposedStartAt,
        endAt: data.rescheduleProposal.proposedEndAt,
        rescheduleProposal: deleteField(),
      })
    }
  } else {
    await updateDoc(doc(db, 'bookings', bookingId), {
      ...updates,
      rescheduleProposal: deleteField(),
    })
  }
}

export async function markBookingAsRead(bookingId: string, role: 'client' | 'stylist') {
  const updates: any = {}
  if (role === 'client') {
    updates.clientHasNotification = false
  } else {
    updates.stylistHasNotification = false
  }
  await updateDoc(doc(db, 'bookings', bookingId), updates)
}

// Persistant Conversations (Per Stylist/Client pair)

export function getConversationId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_')
}

export async function getOrCreateConversation(
  clientId: string,
  stylistId: string,
  clientName: string,
  stylistName: string,
) {
  if (!clientId || !stylistId) {
    throw new Error('Invalid participants for conversation')
  }

  const convId = getConversationId(clientId, stylistId)
  const ref = doc(db, 'conversations', convId)

  try {
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        participantIds: [clientId, stylistId],
        participants: {
          [clientId]: { name: clientName },
          [stylistId]: { name: stylistName },
        },
        unreadCount: {
          [clientId]: 0,
          [stylistId]: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    return convId
  } catch (e) {
    console.error('getOrCreateConversation: failed', e)
    throw e
  }
}

export async function listConversationsForUser(uid: string): Promise<Conversation[]> {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid)
  )
  const snaps = await getDocs(q)
  const results = snaps.docs.map(d => {
    const data = d.data() as any
    const otherId = data.participantIds?.find((id: string) => id !== uid) || 'unknown'
    return {
      conversationId: d.id,
      participantIds: data.participantIds || [],
      lastMessage: data.lastMessage,
      lastMessageAt: data.lastMessageAt,
      lastMessageSenderId: data.lastMessageSenderId,
      otherParticipantId: otherId,
      otherParticipantName: data.participants?.[otherId]?.name || 'Unknown',
      unreadCount: data.unreadCount || {},
    } as Conversation
  })

  return results.sort((a, b) => {
    const tA = a.lastMessageAt || '0'
    const tB = b.lastMessageAt || '0'
    return tA > tB ? -1 : 1
  })
}

/**
 * Real-time listener for conversations
 */
export function listenForConversations(uid: string, callback: (convs: Conversation[]) => void) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid)
  )

  return onSnapshot(q, async (snaps) => {
    const results = await Promise.all(snaps.docs.map(async (d) => {
      const data = d.data() as any
      const otherId = data.participantIds?.find((id: string) => id !== uid) || 'unknown'

      // Try to fetch stylist profile for the other participant
      let otherPhoto: string | undefined
      try {
        const { getStylist } = await import('./stylists')
        const stylistProfile = await getStylist(otherId)
        otherPhoto = stylistProfile?.profileImageUrl
      } catch (e) {
        // Not a stylist or profile not found, use default
        otherPhoto = data.participants?.[otherId]?.photo
      }

      return {
        conversationId: d.id,
        participantIds: data.participantIds || [],
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt,
        lastMessageSenderId: data.lastMessageSenderId,
        otherParticipantId: otherId,
        otherParticipantName: data.participants?.[otherId]?.name || 'Unknown',
        otherParticipantPhoto: otherPhoto,
        unreadCount: data.unreadCount || {},
      } as Conversation
    }))

    callback(results.sort((a, b) => {
      const tA = a.lastMessageAt || '0'
      const tB = b.lastMessageAt || '0'
      return tA > tB ? -1 : 1
    }))
  })
}

export async function sendConversationMessage({
  conversationId,
  senderId,
  text,
}: {
  conversationId: string
  senderId: string
  text: string
}) {
  const nowIso = new Date().toISOString()
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    text,
    createdAt: nowIso,
  })

  // Derive receiverId from conversationId
  const parts = conversationId.split('_')
  const receiverId = parts.find(id => id !== senderId)

  const updates: any = {
    lastMessage: text,
    lastMessageAt: nowIso,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
    [`unreadCount.${senderId}`]: 0,
  }

  if (receiverId) {
    updates[`unreadCount.${receiverId}`] = increment(1)
  }

  await updateDoc(doc(db, 'conversations', conversationId), updates)
}

/**
 * Reset unread count for a user in a conversation
 */
export async function markConversationAsRead(conversationId: string, userId: string) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCount.${userId}`]: 0
  })
}

export async function listConversationMessages(conversationId: string): Promise<Message[]> {
  const q = query(collection(db, 'conversations', conversationId, 'messages'))
  const snaps = await getDocs(q)
  const results = snaps.docs.map(d => ({ messageId: d.id, ...d.data() } as Message))
  return results.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
}

export function listenForConversationMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'))
  return onSnapshot(q, (snaps) => {
    const results = snaps.docs.map(d => ({ messageId: d.id, ...d.data() } as Message))
    callback(results.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)))
  })
}

