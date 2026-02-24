import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Review } from './types'

export async function submitReview({
    bookingId,
    clientId,
    clientName,
    stylistId,
    rating,
    comment,
}: {
    bookingId: string
    clientId: string
    clientName: string
    stylistId: string
    rating: number
    comment: string
}) {
    const nowIso = new Date().toISOString()

    // 1. Create review doc
    const reviewRef = await addDoc(collection(db, 'reviews'), {
        bookingId,
        clientId,
        clientName,
        stylistId,
        rating,
        comment,
        createdAt: nowIso,
        updatedAt: serverTimestamp(),
    })

    // 2. Update booking with reviewId
    await updateDoc(doc(db, 'bookings', bookingId), {
        reviewId: reviewRef.id,
        updatedAt: serverTimestamp(),
    })

    // 3. Update stylist stats with proper average calculation
    const stylistRef = doc(db, 'stylists', stylistId)
    const stylistSnap = await getDoc(stylistRef)

    if (stylistSnap.exists()) {
        const currentData = stylistSnap.data()
        const currentCount = currentData.ratingCount || 0
        const currentAvg = currentData.ratingAvg || 0

        // Calculate new average: ((old_avg * old_count) + new_rating) / (old_count + 1)
        const newCount = currentCount + 1
        const newAvg = ((currentAvg * currentCount) + rating) / newCount

        console.log('Updating stylist rating:', {
            stylistId,
            currentCount,
            currentAvg,
            newRating: rating,
            newCount,
            newAvg: Math.round(newAvg * 10) / 10
        })

        await updateDoc(stylistRef, {
            ratingCount: newCount,
            ratingAvg: Math.round(newAvg * 10) / 10, // Round to 1 decimal
            updatedAt: serverTimestamp(),
        })

        console.log('Stylist rating updated successfully')
    } else {
        console.error('Stylist document not found:', stylistId)
    }

    return reviewRef.id
}

export async function getReviewsForStylist(stylistId: string): Promise<Review[]> {
    const q = query(
        collection(db, 'reviews'),
        where('stylistId', '==', stylistId)
    )

    const snaps = await getDocs(q)
    const reviews = snaps.docs.map(d => ({
        reviewId: d.id,
        ...d.data(),
    } as Review))

    // Sort client-side by createdAt descending
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
