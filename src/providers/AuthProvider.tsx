import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { getMyApplication } from '../services/applications'

export type AppRole = 'client' | 'stylist' | 'admin'

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
  role: AppRole
  campus: 'UNC'
  wantsStylist?: boolean
  favoriteStylistIds?: string[]
  profileImageUrl?: string | null
}

type AuthCtx = {
  loading: boolean
  firebaseUser: User | null
  appUser: AppUser | null
  hasStylistApplication: boolean | null
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasStylistApplication, setHasStylistApplication] = useState<boolean | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u)
      setLoading(false)
    })
    // If Firebase Auth doesn't respond within 8s (e.g. slow network), stop blocking the UI
    const timeout = setTimeout(() => setLoading(false), 8000)
    return () => {
      unsub()
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!firebaseUser) {
      setAppUser(null)
      setHasStylistApplication(null)
      return
    }

    // Set appUser immediately so the UI never blocks on Firestore (avoids long "Loading…")
    setAppUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: 'client',
      campus: 'UNC',
      wantsStylist: false,
      favoriteStylistIds: [],
      profileImageUrl: null,
    })

    const ref = doc(db, 'users', firebaseUser.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as (Partial<AppUser> & { wantsStylist?: boolean; favoriteStylistIds?: string[] }) | undefined
        const role: AppRole = (data?.role as AppRole) ?? 'client'
        const wantsStylist = !!data?.wantsStylist
        const favoriteStylistIds = data?.favoriteStylistIds ?? []

        setAppUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role,
          campus: 'UNC',
          wantsStylist,
          favoriteStylistIds,
          profileImageUrl: data?.profileImageUrl ?? null,
        })
      },
      () => {
        // Doc read failed; keep the default appUser we already set
      },
    )
    return () => unsub()
  }, [firebaseUser])

  useEffect(() => {
    if (!firebaseUser || !appUser) {
      setHasStylistApplication(null)
      return
    }

    // Only check for applications when the user is stylist-oriented
    if (!appUser.wantsStylist && appUser.role !== 'stylist') {
      setHasStylistApplication(null)
      return
    }

    let cancelled = false
      ; (async () => {
        try {
          const app = await getMyApplication(firebaseUser.uid)
          if (!cancelled) setHasStylistApplication(!!app)
        } catch {
          if (!cancelled) setHasStylistApplication(null)
        }
      })()

    return () => {
      cancelled = true
    }
  }, [firebaseUser?.uid, appUser?.wantsStylist, appUser?.role])

  const value = useMemo<AuthCtx>(
    () => ({
      loading,
      firebaseUser,
      appUser,
      hasStylistApplication,
    }),
    [loading, firebaseUser, appUser, hasStylistApplication],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

