import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { listBookingsForUser } from '../../services/bookings'
import { formatFullDateTime } from '../../utils/date'
import type { Booking } from '../../services/types'

export function StylistDashboardPage() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])

  async function refresh() {
    if (!appUser) return
    setLoading(true)
    const res = await listBookingsForUser(appUser.uid)
    setBookings(res)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid])

  const pending = useMemo(() => bookings.filter((b) => b.status === 'requested'), [bookings])
  const upcoming = useMemo(() => bookings.filter((b) => b.status === 'confirmed' || b.status === 'service_complete'), [bookings])
  const past = useMemo(() => bookings.filter((b) => b.status === 'completed' || b.status === 'declined' || b.status === 'cancelled'), [bookings])

  function renderBookingSet(list: Booking[], title: string, badgeColor: string) {
    return (
      <Card withBorder radius="lg" bg="white" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={800}>{title}</Text>
          <Badge radius="xl" color={badgeColor} variant="light">
            {list.length}
          </Badge>
        </Group>
        {list.length === 0 ? (
          <Text size="sm" c="dimmed">
            No {title.toLowerCase()} yet.
          </Text>
        ) : (
          <Stack gap="sm">
            {list.map((b) => (
              <Card key={b.bookingId} withBorder radius="md" padding="md" component={Link} to={`/booking/${b.bookingId}`} style={{ textDecoration: 'none' }}>
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Group gap="xs">
                      <Text fw={700} c="dark">
                        {formatFullDateTime(b.startAt)}
                      </Text>
                      {b.stylistHasNotification && (
                        <Badge size="xs" color="red" variant="dot">New</Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      Client: {b.clientName ?? 'Anonymous'}
                    </Text>
                  </Stack>
                  <Badge radius="xl" color={badgeColor} variant="light">
                    {b.status}
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Card>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} c="crown.9">
          Stylist bookings
        </Title>
        <Button variant="light" color="crown" radius="xl" onClick={refresh}>
          Refresh
        </Button>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Stack>
      ) : (
        <Tabs defaultValue="active" color="crown" variant="outline" radius="xl">
          <Tabs.List>
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="past">Past</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active">
            <Stack gap="md" mt="md">
              {renderBookingSet(pending, 'Pending requests', 'yellow')}
              {renderBookingSet(upcoming, 'Upcoming', 'crown')}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="past">
            <Stack gap="md" mt="md">
              {renderBookingSet(past, 'Past Bookings', 'gray')}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  )
}

