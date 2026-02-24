import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconCrown, IconShieldCheck, IconSparkles } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { CenteredPage } from '../components/CenteredPage'

export function LandingPage() {
  return (
    <CenteredPage>
    <Stack gap="xl">
      <Group justify="space-between">
        <Group gap="sm">
          <IconCrown color="#391354" size={28} />
          <Title order={2} c="crown.9">
            Campus Crown
          </Title>
        </Group>
        <Badge color="crown" variant="light" size="lg">
          UNC MVP
        </Badge>
      </Group>

      <Card withBorder radius="xl" padding="xl" bg="white">
        <Stack gap="md">
          <Title order={1} c="crown.9" size="2.25rem" style={{ lineHeight: 1.2 }}>
            Styles-first booking for braids — without DMs.
          </Title>
          <Text size="lg" c="dimmed">
            Browse real portfolios, see transparent prices, and request appointments with vetted stylists near UNC.
          </Text>
          <Group grow>
            <Button component={Link} to="/signup/client" color="crown" radius="xl" size="md">
              Find a stylist
            </Button>
            <Button component={Link} to="/signup/stylist" variant="light" color="crown" radius="xl" size="md">
              Become a stylist
            </Button>
          </Group>
        </Stack>
      </Card>

      <Group grow align="stretch">
        <Card withBorder radius="lg" padding="lg" bg="white">
          <Group gap="md" align="flex-start">
            <IconShieldCheck color="#391354" size={28} />
            <Stack gap={4}>
              <Text fw={700} size="lg">Vetted stylists</Text>
              <Text size="sm" c="dimmed">
                Approval-based onboarding for trust.
              </Text>
            </Stack>
          </Group>
        </Card>
        <Card withBorder radius="lg" padding="lg" bg="white">
          <Group gap="md" align="flex-start">
            <IconSparkles color="#391354" size={28} />
            <Stack gap={4}>
              <Text fw={700} size="lg">Clear pricing</Text>
              <Text size="sm" c="dimmed">
                Services list one upfront price.
              </Text>
            </Stack>
          </Group>
        </Card>
      </Group>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Text size="md" c="dimmed" ta="center">
          Read our policies before booking: <Text component={Link} to="/policies" c="crown.7" fw={600}>Policies</Text>
        </Text>
      </Card>
    </Stack>
    </CenteredPage>
  )
}

