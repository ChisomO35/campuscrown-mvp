import { useEffect, useMemo, useState } from 'react'
import { Avatar, Badge, Box, Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { listBookingsForUser, listenForConversations } from '../../services/bookings'
import { formatFullDateTime, formatShortDate } from '../../utils/date'
import type { Booking, Conversation } from '../../services/types'

function statusColor(s: Booking['status']) {
  if (s === 'requested') return 'yellow'
  if (s === 'confirmed') return 'crown'
  if (s === 'service_complete') return 'blue'
  if (s === 'completed') return 'green'
  if (s === 'declined') return 'red'
  if (s === 'cancelled') return 'gray'
  return 'gray'
}

function statusText(s: Booking['status']) {
  if (s === 'requested') return 'Requested'
  if (s === 'confirmed') return 'Confirmed'
  if (s === 'service_complete') return 'Awaiting Payment'
  if (s === 'completed') return 'Completed'
  if (s === 'declined') return 'Declined'
  if (s === 'cancelled') return 'Cancelled'
  return s
}

export function ClientBookingsPage() {
  const { appUser } = useAuth()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const isMessages = tab === 'messages'
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  async function refresh() {
    if (!appUser?.uid) return
    setLoading(true)
    if (!isMessages) {
      const res = await listBookingsForUser(appUser.uid)
      setBookings(res)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!appUser?.uid) return

    if (isMessages) {
      setLoading(true)
      const unsub = listenForConversations(appUser.uid, (res) => {
        setConversations(res)
        setLoading(false)
      })
      return () => {
        if (typeof unsub === 'function') unsub()
      }
    } else {
      refresh()
    }
  }, [appUser?.uid, isMessages])

  const activeBookings = useMemo(() =>
    bookings.filter(b => b.status === 'requested' || b.status === 'confirmed' || b.status === 'service_complete'),
    [bookings]
  )

  const pastBookings = useMemo(() =>
    bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'declined'),
    [bookings]
  )

  function renderBookingList(list: Booking[]) {
    if (list.length === 0) {
      return (
        <Card withBorder radius="lg" bg="white" mt="md">
          <Text c="dimmed">No bookings found in this category.</Text>
        </Card>
      )
    }

    return (
      <Stack gap="sm" mt="md">
        {list.map((b) => (
          <Card key={b.bookingId} withBorder radius="lg" bg="white" component={Link} to={`/booking/${b.bookingId}`} style={{ textDecoration: 'none' }}>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Group gap="xs">
                  <Text fw={700} c="dark">
                    {formatFullDateTime(b.startAt)}
                  </Text>
                  {b.clientHasNotification && (
                    <Badge size="xs" color="red" variant="dot">New</Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  Stylist: {b.stylistName ?? 'Unknown'}
                </Text>
                <Text size="xs" c="dimmed">
                  Location: {b.locationType === 'home_studio' ? 'Home studio' : 'Mobile'}
                </Text>
              </Stack>
              <Badge radius="xl" color={statusColor(b.status)} variant="light">
                {statusText(b.status)}
              </Badge>
            </Group>
          </Card>
        ))}
      </Stack>
    )
  }

  function renderConversationList() {
    if (conversations.length === 0) {
      return (
        <Card withBorder radius="lg" bg="white">
          <Text c="dimmed">No messages yet. Book a stylist to start chatting.</Text>
          <Button component={Link} to="/home" mt="sm" color="crown" radius="xl">
            Find a stylist
          </Button>
        </Card>
      )
    }

    if (!appUser) return null

    return (
      <Stack gap="sm">
        {conversations.map((c) => (
          <Card key={c.conversationId} withBorder radius="lg" bg="white" component={Link} to={`/chat/${c.conversationId}`} style={{ textDecoration: 'none' }}>
            <Group wrap="nowrap">
              <Avatar src={c.otherParticipantPhoto} radius="xl" size="md" />
              <Box style={{ flex: 1 }}>
                <Group justify="space-between" mb={2}>
                  <Group gap="xs">
                    <Text fw={700} size="sm">{c.otherParticipantName}</Text>
                    {(c.unreadCount?.[appUser.uid] || 0) > 0 && (
                      <Badge color="red" size="xs" variant="filled" circle>
                        {c.unreadCount![appUser.uid]}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {c.lastMessageAt ? formatShortDate(c.lastMessageAt) : ''}
                  </Text>
                </Group>
                <Text size="xs" c={(c.unreadCount?.[appUser.uid] || 0) > 0 ? 'dark' : 'dimmed'} fw={(c.unreadCount?.[appUser.uid] || 0) > 0 ? 700 : 400} lineClamp={1}>
                  {c.lastMessageSenderId === appUser.uid ? 'You: ' : ''}
                  {c.lastMessage || 'No messages yet'}
                </Text>
              </Box>
            </Group>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} c="crown.9">
          {isMessages ? 'Messages' : 'Bookings'}
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
      ) : isMessages ? (
        renderConversationList()
      ) : bookings.length === 0 ? (
        <Card withBorder radius="lg" bg="white">
          <Text c="dimmed">No bookings yet.</Text>
          <Button component={Link} to="/home" mt="sm" color="crown" radius="xl">
            Browse styles
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="active" color="crown" variant="outline" radius="xl">
          <Tabs.List>
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="past">Past</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active">
            {renderBookingList(activeBookings)}
          </Tabs.Panel>

          <Tabs.Panel value="past">
            {renderBookingList(pastBookings)}
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  )
}

