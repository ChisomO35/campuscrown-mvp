import { Center, Text } from '@mantine/core'
import { Navigate, useLocation } from 'react-router-dom'
import type { AppRole } from './AuthProvider'
import { useAuth } from './AuthProvider'

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode
  role?: AppRole
}) {
  const { loading, firebaseUser, appUser, hasStylistApplication } = useAuth()
  const location = useLocation()
  const isStylistApplyRoute = location.pathname === '/stylist/apply'

  // Show page (with its own skeletons) immediately; no full-page auth spinner
  if (loading) return <>{children}</>

  if (!firebaseUser) return <Navigate to="/login" replace />

  // If this user is trying to become a stylist but hasn't submitted
  // an application yet, always force them into the apply flow until
  // they have an application on file.
  if (appUser?.wantsStylist && hasStylistApplication === false && !isStylistApplyRoute) {
    return <Navigate to="/stylist/apply" replace />
  }

  if (role && appUser?.role !== role) {
    return (
      <Center h={240}>
        <Text c="dimmed">You don’t have access to this page.</Text>
      </Center>
    )
  }

  return <>{children}</>
}

