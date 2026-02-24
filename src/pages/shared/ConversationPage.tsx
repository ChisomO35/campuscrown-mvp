import { useEffect, useMemo, useState } from 'react'
import {
    Avatar,
    Box,
    Button,
    Card,
    Group,
    Loader,
    ScrollArea,
    Stack,
    Text,
    Textarea,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { listenForConversationMessages, markConversationAsRead, sendConversationMessage } from '../../services/bookings'
import { getUser } from '../../services/user'
import { getStylist } from '../../services/stylists'
import type { Message, Stylist } from '../../services/types'
import { IconChevronLeft } from '@tabler/icons-react'

export function ConversationPage() {
    const { conversationId } = useParams()
    const { appUser } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState('')
    const [otherUser, setOtherUser] = useState<any>(null)
    const [stylistProfile, setStylistProfile] = useState<Stylist | null>(null)

    // Derive other user ID from conversationId (fmt: uid1_uid2)
    const otherUserId = useMemo(() => {
        if (!conversationId || !appUser) return null
        const parts = conversationId.split('_')
        return parts.find((id) => id !== appUser.uid) || null
    }, [conversationId, appUser])

    async function loadData() {
        if (!conversationId || !appUser) return
        setLoading(true)
        try {
            if (otherUserId) {
                const u = await getUser(otherUserId)
                setOtherUser(u)

                // Try to fetch stylist profile (will fail silently if not a stylist)
                try {
                    const stylistData = await getStylist(otherUserId)
                    if (stylistData) {
                        console.log('Loaded stylist profile:', stylistData.stylistId)
                        setStylistProfile(stylistData)
                    }
                } catch (e) {
                    console.log('Other user is not a stylist')
                }
            }
            if (conversationId && appUser?.uid) {
                await markConversationAsRead(conversationId, appUser.uid)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [conversationId, appUser?.uid])

    useEffect(() => {
        if (!conversationId) return

        const unsub = listenForConversationMessages(conversationId, (m) => {
            setMessages(m)
        })

        return () => {
            if (typeof unsub === 'function') unsub()
        }
    }, [conversationId])

    if (loading) {
        return (
            <Stack align="center" justify="center" h="100vh">
                <Loader color="crown" />
            </Stack>
        )
    }

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Group>
                    <Button variant="subtle" color="gray" radius="xl" px={8} onClick={() => navigate(-1)}>
                        <IconChevronLeft size={20} />
                    </Button>
                    {appUser?.role === 'client' && stylistProfile ? (
                        <Link
                            to={`/s/${stylistProfile.stylistId}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            onClick={() => console.log('Navigating to:', `/s/${stylistProfile.stylistId}`)}
                        >
                            <Group gap="sm" style={{ cursor: 'pointer' }}>
                                <Avatar src={stylistProfile.profileImageUrl} radius="xl" />
                                <Box>
                                    <Text fw={700}>{otherUser?.displayName || 'Chat'}</Text>
                                    <Text size="xs" c="dimmed">View Profile</Text>
                                </Box>
                            </Group>
                        </Link>
                    ) : (
                        <Group gap="sm">
                            <Avatar src={otherUser?.profileImageUrl} radius="xl" />
                            <Box>
                                <Text fw={700}>{otherUser?.displayName || 'Chat'}</Text>
                                <Text size="xs" c="dimmed">Conversation</Text>
                            </Box>
                        </Group>
                    )}
                </Group>
            </Group>

            <Card withBorder radius="lg" padding="lg" bg="white">
                <Stack gap="xs">
                    <ScrollArea h={400} offsetScrollbars>
                        <Stack gap="sm" pr="md">
                            {messages.length === 0 ? (
                                <Stack align="center" justify="center" h={380}>
                                    <Text size="sm" c="dimmed" ta="center">
                                        No messages yet.<br />Ask about styles, availability, or prep.
                                    </Text>
                                </Stack>
                            ) : (
                                messages.map((m) => {
                                    const mine = appUser?.uid === m.senderId
                                    return (
                                        <Group
                                            key={m.messageId}
                                            align="flex-start"
                                            gap="xs"
                                            wrap="nowrap"
                                            style={{ flexDirection: mine ? 'row-reverse' : 'row' }}
                                        >
                                            <Avatar
                                                src={mine ? appUser?.profileImageUrl : (stylistProfile?.profileImageUrl || otherUser?.profileImageUrl)}
                                                radius="xl"
                                                size="sm"
                                            />
                                            <Box style={{ maxWidth: '80%' }}>
                                                <Card
                                                    radius="md"
                                                    padding="sm"
                                                    withBorder
                                                    bg={mine ? '#efe9f7' : '#ffffff'}
                                                >
                                                    <Text size="sm">{m.text}</Text>
                                                </Card>
                                                <Text size="xs" c="dimmed" mt={4} ta={mine ? 'right' : 'left'}>
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </Box>
                                        </Group>
                                    )
                                })
                            )}
                        </Stack>
                    </ScrollArea>

                    <Textarea
                        autosize
                        minRows={2}
                        maxRows={5}
                        placeholder="Type a message…"
                        value={text}
                        onChange={(e) => setText(e.currentTarget.value)}
                    />
                    <Group justify="flex-end">
                        <Button
                            color="crown"
                            radius="xl"
                            disabled={!text.trim()}
                            onClick={async () => {
                                if (!conversationId || !appUser) return
                                try {
                                    await sendConversationMessage({ conversationId, senderId: appUser.uid, text: text.trim() })
                                    setText('')
                                } catch (e: any) {
                                    notifications.show({ color: 'red', title: 'Could not send', message: e?.message ?? 'Try again.' })
                                }
                            }}
                        >
                            Send
                        </Button>
                    </Group>
                </Stack>
            </Card>
        </Stack>
    )
}
