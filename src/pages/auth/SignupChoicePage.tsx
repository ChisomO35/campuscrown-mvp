import { Card, Stack, Text, Title } from '@mantine/core'
import { IconScissors, IconUserCircle } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { CenteredPage } from '../../components/CenteredPage'

export function SignupChoicePage() {
  const nav = useNavigate()

  return (
    <CenteredPage>
    <Stack gap="lg">
      <Title order={1} c="crown.8" size="2rem" ta="center">
        Join Campus Crown
      </Title>
      <Text size="lg" c="dimmed" ta="center">
        How do you want to use Campus Crown?
      </Text>

      <Card
        withBorder
        radius="lg"
        padding="xl"
        bg="white"
        component="button"
        type="button"
        onClick={() => nav('/signup/client')}
        style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <Stack gap="sm">
          <IconUserCircle size={40} color="#391354" />
          <Title order={3} c="crown.9">
            I'm looking for a stylist
          </Title>
          <Text size="md" c="dimmed">
            Book appointments, browse styles, and get your hair done by vetted braiders near UNC.
          </Text>
          <Text size="md" fw={600} c="crown.7">
            Create account →
          </Text>
        </Stack>
      </Card>

      <Card
        withBorder
        radius="lg"
        padding="xl"
        bg="white"
        component="button"
        type="button"
        onClick={() => nav('/signup/stylist')}
        style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <Stack gap="sm">
          <IconScissors size={40} color="#391354" />
          <Title order={3} c="crown.9">
            I'm a stylist
          </Title>
          <Text size="md" c="dimmed">
            List your services, set your schedule, and get booked by clients on campus.
          </Text>
          <Text size="md" fw={600} c="crown.7">
            Create account →
          </Text>
        </Stack>
      </Card>

      <Text size="md" c="dimmed" ta="center">
        Already have an account? <Text component={Link} to="/login" c="crown.7" fw={600}>Log in</Text>
      </Text>
    </Stack>
    </CenteredPage>
  )
}
