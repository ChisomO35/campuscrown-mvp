import { Button, Group, UnstyledButton, Text } from '@mantine/core'
import { IconCrown, IconLogout } from '@tabler/icons-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { logout } from '../services/user'

export function AppHeader() {
  const { firebaseUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const homePath = '/'
  const isStylistApplyRoute = location.pathname === '/stylist/apply'

  function handleLogout() {
    navigate('/', { replace: true })
    void logout()
  }

  return (
    <Group justify="space-between" h="100%" px="md" wrap="nowrap">
      {isStylistApplyRoute ? (
        <Group gap="xs" wrap="nowrap">
          <IconCrown size={22} color="#391354" />
          <Text fw={700} size="lg" c="crown.9">
            Campus Crown
          </Text>
        </Group>
      ) : (
        <UnstyledButton component={Link} to={homePath} style={{ textDecoration: 'none' }}>
          <Group gap="xs" wrap="nowrap">
            <IconCrown size={22} color="#391354" />
            <Text fw={700} size="lg" c="crown.9">
              Campus Crown
            </Text>
          </Group>
        </UnstyledButton>
      )}

      {firebaseUser ? (
        <UnstyledButton
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          aria-label="Log out"
        >
          <IconLogout size={18} color="#391354" />
          <Text size="sm" fw={600} c="crown.9">
            Log Out
          </Text>
        </UnstyledButton>
      ) : (
        <Button component={Link} to="/login" variant="light" color="crown" size="sm" radius="xl" mr="xs" aria-label="Log in">
          Log In
        </Button>
      )}
    </Group>
  )
}
