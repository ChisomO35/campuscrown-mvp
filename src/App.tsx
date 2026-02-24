import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell, Box, Container } from '@mantine/core'
import { AppHeader } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { RequireAuth } from './providers/RequireAuth'
import { ErrorBoundary } from './components/ErrorBoundary'

import { LandingPage } from './pages/LandingPage'
import { PoliciesPage } from './pages/PoliciesPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupChoicePage } from './pages/auth/SignupChoicePage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { DiscoveryPage } from './pages/client/DiscoveryPage'
import { StylistProfilePage } from './pages/client/StylistProfilePage'
import { BookingFlowPage } from './pages/client/BookingFlowPage'
import { ClientBookingsPage } from './pages/client/ClientBookingsPage'
import { ClientProfilePage } from './pages/client/ClientProfilePage'
import { BookingDetailPage } from './pages/shared/BookingDetailPage'
import { StylistApplyPage } from './pages/stylist/StylistApplyPage'
import { StylistDashboardPage } from './pages/stylist/StylistDashboardPage'
import { EarningsPage } from './pages/stylist/EarningsPage'
import { StylistProfileEditPage } from './pages/stylist/StylistProfileEditPage'
import { StylistMessagesPage } from './pages/stylist/StylistMessagesPage'
import { ConversationPage } from './pages/shared/ConversationPage'
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage'

function AppShellWithAuth() {
  const { firebaseUser } = useAuth()
  const location = useLocation()
  const isStylistApplyRoute = location.pathname === '/stylist/apply'
  const showFooterNav = firebaseUser && !isStylistApplyRoute
  return (
    <AppShell
      padding={0}
      header={{ height: 52 }}
      footer={{ height: showFooterNav ? 64 : 0 }}
      styles={{
        main: {
          background: 'white',
          minHeight: '100vh',
          paddingBottom: showFooterNav ? 72 : 0,
        },
        header: {
          background: 'white',
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        },
      }}
    >
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Container size={600} px="md" py="md">
          <Box>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/policies" element={<PoliciesPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupChoicePage />} />
              <Route path="/signup/client" element={<SignupPage />} />
              <Route path="/signup/stylist" element={<SignupPage />} />
              <Route path="/forgot" element={<ForgotPasswordPage />} />

              <Route
                path="/home"
                element={
                  <RequireAuth>
                    <DiscoveryPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/s/:stylistId"
                element={
                  <RequireAuth>
                    <StylistProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/book/:stylistId/:serviceId"
                element={
                  <RequireAuth>
                    <BookingFlowPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/bookings"
                element={
                  <RequireAuth>
                    <ClientBookingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ClientProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/booking/:bookingId"
                element={
                  <RequireAuth>
                    <BookingDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/chat/:conversationId"
                element={
                  <RequireAuth>
                    <ConversationPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/stylist/apply"
                element={
                  <RequireAuth>
                    <StylistApplyPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/stylist/dashboard"
                element={
                  <RequireAuth role="stylist">
                    <StylistDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/stylist/messages"
                element={
                  <RequireAuth role="stylist">
                    <StylistMessagesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/stylist/earnings"
                element={
                  <RequireAuth role="stylist">
                    <EarningsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/stylist/profile"
                element={
                  <RequireAuth role="stylist">
                    <StylistProfileEditPage />
                  </RequireAuth>
                }
              />

              <Route path="/admin" element={<AdminApprovalsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Container>
      </AppShell.Main>

      {showFooterNav && (
        <AppShell.Footer>
          <BottomNav />
        </AppShell.Footer>
      )}
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppShellWithAuth />
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
