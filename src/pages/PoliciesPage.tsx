import { Card, List, Stack, Text, Title } from '@mantine/core'

export function PoliciesPage() {
  return (
    <Stack gap="md">
      <Title order={2} c="crown.8">
        Policies
      </Title>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Title order={4}>Cancellation</Title>
        <List mt="sm" spacing="xs">
          <List.Item>
            <Text size="sm" c="dimmed">
              Please cancel as early as possible. Stylists may enforce their own cancellation windows.
            </Text>
          </List.Item>
          <List.Item>
            <Text size="sm" c="dimmed">
              Repeated late cancellations can lead to limited booking access.
            </Text>
          </List.Item>
        </List>
      </Card>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Title order={4}>No-shows</Title>
        <List mt="sm" spacing="xs">
          <List.Item>
            <Text size="sm" c="dimmed">
              No-shows hurt stylists. Please message in-app if you’re running late.
            </Text>
          </List.Item>
        </List>
      </Card>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Title order={4}>Safety & conduct</Title>
        <List mt="sm" spacing="xs">
          <List.Item>
            <Text size="sm" c="dimmed">
              Respectful communication is required. Harassment results in removal.
            </Text>
          </List.Item>
          <List.Item>
            <Text size="sm" c="dimmed">
              Do not share sensitive personal details in public areas.
            </Text>
          </List.Item>
        </List>
      </Card>
    </Stack>
  )
}

