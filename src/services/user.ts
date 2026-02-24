import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    if (code === 'auth/email-already-in-use') return 'This email is already registered. Try logging in.'
    if (code === 'auth/operation-not-allowed') return 'Email/password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.'
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.'
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.'
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string') return o.message
  }
  return 'Sign up failed. Please try again.'
}

export async function signupWithEmail({
  email,
  password,
  displayName,
  stylistIntent,
}: {
  email: string
  password: string
  displayName: string
  stylistIntent?: boolean
}) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    // Create/update the Firestore user profile. We *await* this so that
    // if Firestore is not configured or rules block writes, you see a
    // clear error instead of a silent failure and missing `users` docs.
    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        uid: cred.user.uid,
        email,
        displayName,
        role: 'client',
        campus: 'UNC',
        wantsStylist: stylistIntent ?? false,
        hasStylistApplication: false,
        createdAt: serverTimestamp(),
      } as Record<string, unknown>,
      { merge: true },
    )
    return cred.user
  } catch (err) {
    throw new Error(getAuthErrorMessage(err))
  }
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}

export async function sendReset(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export async function toggleFavoriteStylist(userId: string, stylistId: string, currentFavorites: string[]) {
  const isFavorite = currentFavorites.includes(stylistId)
  const newList = isFavorite
    ? currentFavorites.filter(id => id !== stylistId)
    : [...currentFavorites, stylistId]

  await setDoc(doc(db, 'users', userId), { favoriteStylistIds: newList }, { merge: true })
}

export async function getUser(uid: string) {
  const { getDoc, doc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data()
}

