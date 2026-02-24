import { useEffect, useState } from 'react'
import { Button, Card, Group, Stack, Text, Title, Avatar, Box, Badge } from '@mantine/core'
import { Link } from 'react-router-dom'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { listenForConversations } from '../../services/bookings'
import { formatShortDate } from '../../utils/date'
import type { Conversation } from '../../services/types'

export function StylistMessagesPage() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (!appUser?.uid) return

    setLoading(true)
    const unsub = listenForConversations(appUser.uid, (res) => {
      setConversations(res)
      setLoading(false)
    })

    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [appUser?.uid])

  async function refresh() {
    // Manual trigger if needed, but the listener should handle it
    if (!appUser?.uid) return
  }

  if (!appUser) return null

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} c="crown.9">
          Messages
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
      ) : conversations.length === 0 ? (
        <Card withBorder radius="lg" bg="white">
          <Text c="dimmed">
            No conversations yet. Once clients message you or book an appointment, they will appear here.
          </Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {conversations.map((c) => (
            <Card
              key={c.conversationId}
              withBorder
              radius="lg"
              bg="white"
              component={Link}
              to={`/chat/${c.conversationId}`}
              style={{ textDecoration: 'none' }}
            >
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
                    {c.lastMessageSenderId === appUser?.uid ? 'You: ' : ''}
                    {c.lastMessage || 'No messages yet'}
                  </Text>
                </Box>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

