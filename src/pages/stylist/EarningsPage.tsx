import { Card, Stack, Text, Title } from '@mantine/core'

export function EarningsPage() {
  return (
    <Stack gap="md">
      <Title order={3} c="crown.9">
        Earnings (MVP)
      </Title>
      <Card withBorder radius="lg" bg="white" padding="lg">
        <Text fw={800}>$0</Text>
        <Text size="sm" c="dimmed">
          MVP tracks bookings without payouts. We can add Stripe Connect later.
        </Text>
      </Card>
    </Stack>
  )
}

