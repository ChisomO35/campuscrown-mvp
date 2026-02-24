import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useParams, useNavigate } from 'react-router-dom'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { getBooking, getOrCreateConversation, proposeReschedule, respondToReschedule, setBookingStatus, markBookingAsRead } from '../../services/bookings'
import { db } from '../../services/firebase'
import { getStylist } from '../../services/stylists'
import { getUser } from '../../services/user'
import type { Booking, Stylist } from '../../services/types'
import { RescheduleModal } from '../../components/RescheduleModal'
import { ReviewModal } from '../../components/ReviewModal'
import { IconMessageCircle, IconCreditCard, IconStar } from '@tabler/icons-react'
import { formatFullDateTime } from '../../utils/date'

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

export function BookingDetailPage() {
  const { bookingId } = useParams()
  const { appUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rescheduleOpened, setRescheduleOpened] = useState(false)
  const [reviewOpened, setReviewOpened] = useState(false)

  const isStylistParty = useMemo(() => !!(appUser && booking && booking.stylistId === appUser.uid), [appUser, booking])
  const isClientParty = useMemo(() => !!(appUser && booking && booking.clientId === appUser.uid), [appUser, booking])
  const actorRole = isStylistParty ? 'stylist' : isClientParty ? 'client' : undefined

  useEffect(() => {
    if (bookingId && actorRole) {
      if (actorRole === 'stylist' && booking?.stylistHasNotification) {
        markBookingAsRead(bookingId, 'stylist')
      } else if (actorRole === 'client' && booking?.clientHasNotification) {
        markBookingAsRead(bookingId, 'client')
      }
    }
  }, [bookingId, actorRole, booking?.stylistHasNotification, booking?.clientHasNotification])

  const service = useMemo(() => {
    if (!stylist || !booking) return null
    return (stylist.services ?? []).find((s) => s.serviceId === booking.serviceId) ?? null
  }, [stylist, booking])

  async function handleProposeReschedule(startAt: string, endAt: string) {
    if (!bookingId || !appUser) return
    try {
      await proposeReschedule(bookingId, {
        proposedStartAt: startAt,
        proposedEndAt: endAt,
        proposedBy: appUser.uid,
      }, actorRole)
      notifications.show({ color: 'crown', title: 'Reschedule requested', message: 'The other party has been notified.' })
      await refreshBooking()
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Could not request reschedule', message: e?.message ?? 'Try again.' })
    }
  }

  async function handleRespondToReschedule(accept: boolean) {
    if (!bookingId) return
    try {
      setActionLoading(true)
      await respondToReschedule(bookingId, accept, actorRole)
      notifications.show({
        color: accept ? 'green' : 'red',
        title: accept ? 'Reschedule accepted' : 'Reschedule declined',
        message: accept ? 'Appointment time updated.' : 'Reschedule request removed.',
      })
      await refreshBooking()
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Action failed', message: e?.message ?? 'Try again.' })
    } finally {
      setActionLoading(false)
    }
  }

  async function refreshBooking() {
    if (!bookingId) return
    setLoading(true)
    try {
      const b = await getBooking(bookingId)
      if (b) {
        setBooking(b)

        const [s, u] = await Promise.all([
          getStylist(b.stylistId),
          getUser(b.clientId)
        ])

        if (s) {
          setStylist(s)
          if (!b.stylistName && s.name) b.stylistName = s.name
        }
        if (u) {
          if (!b.clientName && u.displayName) b.clientName = u.displayName
        }
      } else {
        setBooking(null)
      }
    } catch (e: any) {
      console.error('Failed to load booking details:', e)
      notifications.show({ color: 'red', title: 'Error', message: 'Could not load booking details.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleMessage() {
    if (!appUser || !booking) return
    setActionLoading(true)
    try {
      const stylistUserId = stylist?.userId || booking.stylistId

      const convId = await getOrCreateConversation(
        booking.clientId,
        stylistUserId,
        booking.clientName || 'Anonymous',
        booking.stylistName || 'Stylist'
      )

      navigate(`/chat/${convId}`)
    } catch (e: any) {
      console.error('Failed to start conversation:', e)
      notifications.show({ color: 'red', title: 'Error', message: 'Could not open chat.' })
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    refreshBooking()
  }, [bookingId])


  if (loading) {
    return (
      <Stack gap="md">
        <Skeleton height={24} width="40%" radius="sm" />
        <SkeletonRow />
        <SkeletonRow />
      </Stack>
    )
  }

  if (!booking) {
    return (
      <Card withBorder radius="lg" bg="white">
        <Stack align="center" py="xl">
          <Text c="dimmed">Booking not found.</Text>
          <Button variant="light" color="crown" radius="xl" mt="md" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} c="crown.9">
          Booking
        </Title>
        <Badge radius="xl" color={statusColor(booking.status)} variant="light">
          {statusText(booking.status)}
        </Badge>
      </Group>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Stack gap={6}>
          <Text fw={800} size="lg">{formatFullDateTime(booking.startAt)}</Text>
          <Text size="sm" c="dimmed">
            Stylist: {booking.stylistName ?? stylist?.name ?? 'Unknown'} • UNC
          </Text>
          <Text size="sm" c="dimmed">
            Client: {booking.clientName ?? 'Anonymous'}
          </Text>
          <Text size="sm" c="dimmed">
            Location: {booking.locationType === 'home_studio' ? 'Home studio' : 'Mobile'}
          </Text>
          {booking.locationType === 'mobile' && booking.mobileLocationNote ? (
            <Text size="sm" c="dimmed">
              Mobile note: {booking.mobileLocationNote}
            </Text>
          ) : null}
          <Group justify="space-between" mt="md">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Price</Text>
              <Text fw={800} size="xl" c="crown.9">${booking.totalAmount}</Text>
            </Stack>
            <Divider orientation="vertical" />
            <Stack gap={0} align="flex-end">
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Balance Due</Text>
              <Text fw={800} size="xl" c={booking.balancePaid ? 'green' : 'crown.9'}>
                ${booking.totalAmount - (booking.depositPaid ? booking.depositAmount : 0)}
              </Text>
            </Stack>
          </Group>

          <Card withBorder radius="md" padding="sm" bg="gray.0" mt="sm">
            <Stack gap="xs">
              {booking.depositAmount > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Deposit (${booking.depositAmount})</Text>
                  <Badge color={booking.depositPaid ? 'green' : (booking.status === 'requested' ? 'gray' : 'orange')} variant="filled" size="sm">
                    {booking.depositPaid ? 'Paid' : (booking.status === 'requested' ? 'Payable after acceptance' : 'Unpaid')}
                  </Badge>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="sm">Remaining Balance</Text>
                <Badge color={booking.balancePaid ? 'green' : (booking.status === 'service_complete' || booking.status === 'completed' ? 'orange' : 'gray')} variant="filled" size="sm">
                  {booking.balancePaid ? 'Paid' : (booking.status === 'service_complete' ? 'Pending' : booking.status === 'completed' ? 'Pending' : 'Due after job')}
                </Badge>
              </Group>
            </Stack>
          </Card>

          {booking.rescheduleProposal ? (
            <Card withBorder radius="md" padding="md" bg="#fff9db" mt="md">
              <Stack gap="xs">
                <Text fw={700} size="sm">
                  {booking.rescheduleProposal.proposedBy === appUser?.uid
                    ? 'You proposed a new time:'
                    : 'New time proposed:'}
                </Text>
                <Text size="sm">
                  {formatFullDateTime(booking.rescheduleProposal.proposedStartAt)}
                </Text>
                {booking.rescheduleProposal.proposedBy !== appUser?.uid && (
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="green"
                      radius="xl"
                      loading={actionLoading}
                      onClick={() => handleRespondToReschedule(true)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      radius="xl"
                      loading={actionLoading}
                      onClick={() => handleRespondToReschedule(false)}
                    >
                      Decline
                    </Button>
                  </Group>
                )}
                {booking.rescheduleProposal.proposedBy === appUser?.uid && (
                  <Text size="xs" c="dimmed">
                    Waiting for the other party to accept.
                  </Text>
                )}
              </Stack>
            </Card>
          ) : (
            (booking.status === 'confirmed' || booking.status === 'requested') && (
              <Button
                variant="light"
                color="crown"
                size="xs"
                radius="xl"
                mt="md"
                w="fit-content"
                onClick={() => setRescheduleOpened(true)}
              >
                Reschedule appointment
              </Button>
            )
          )}
        </Stack>

        <Divider my="xl" />

        <Stack gap="md">
          <Button
            leftSection={<IconMessageCircle size={18} />}
            variant="filled"
            color="crown"
            radius="xl"
            fullWidth
            loading={actionLoading}
            onClick={handleMessage}
          >
            Message {isClientParty ? 'Stylist' : 'Client'}
          </Button>

          <Group justify="space-between">
            <Button variant="subtle" color="gray" radius="xl" size="sm" onClick={refreshBooking}>
              Refresh details
            </Button>

            <Group gap="xs">
              {isClientParty && booking.status === 'confirmed' && !booking.depositPaid && booking.depositAmount > 0 && (
                <Button
                  color="orange"
                  radius="xl"
                  leftSection={<IconCreditCard size={18} />}
                  loading={actionLoading}
                  onClick={async () => {
                    if (!bookingId) return
                    try {
                      setActionLoading(true)
                      await updateDoc(doc(db, 'bookings', bookingId), {
                        depositPaid: true,
                        updatedAt: serverTimestamp(),
                      })
                      notifications.show({ color: 'green', title: 'Deposit paid!', message: 'Thank you for your payment.' })
                      await refreshBooking()
                    } catch (e: any) {
                      notifications.show({ color: 'red', title: 'Payment failed', message: e?.message ?? 'Try again.' })
                    } finally {
                      setActionLoading(false)
                    }
                  }}
                >
                  Pay Deposit (${booking.depositAmount})
                </Button>
              )}
              {isStylistParty && booking.status === 'requested' ? (
                <>
                  <Button
                    color="crown"
                    radius="xl"
                    loading={actionLoading}
                    onClick={async () => {
                      if (!bookingId) return
                      try {
                        setActionLoading(true)
                        await setBookingStatus(bookingId, 'confirmed', 'stylist')
                        notifications.show({ color: 'crown', title: 'Accepted', message: 'Booking confirmed.' })
                        await refreshBooking()
                      } catch (e: any) {
                        notifications.show({ color: 'red', title: 'Could not accept', message: e?.message ?? 'Try again.' })
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    radius="xl"
                    loading={actionLoading}
                    onClick={async () => {
                      if (!bookingId) return
                      try {
                        setActionLoading(true)
                        await setBookingStatus(bookingId, 'declined', 'stylist')
                        notifications.show({ color: 'red', title: 'Declined', message: 'Booking request declined.' })
                        await refreshBooking()
                      } catch (e: any) {
                        notifications.show({ color: 'red', title: 'Could not decline', message: e?.message ?? 'Try again.' })
                      } finally {
                        setActionLoading(false)
                      }
                    }}
                  >
                    Decline
                  </Button>
                </>
              ) : null}

              {isClientParty && booking.status === 'service_complete' && !booking.balancePaid && (
                <Button
                  color="green"
                  size="lg"
                  radius="xl"
                  fullWidth
                  leftSection={<IconCreditCard size={20} />}
                  loading={actionLoading}
                  onClick={async () => {
                    if (!bookingId) return
                    try {
                      setActionLoading(true)
                      await updateDoc(doc(db, 'bookings', bookingId), {
                        balancePaid: true,
                        status: 'completed',
                        updatedAt: serverTimestamp(),
                      })
                      notifications.show({ color: 'green', title: 'Payment successful!', message: 'The balance has been paid.' })
                      await refreshBooking()
                    } catch (e: any) {
                      notifications.show({ color: 'red', title: 'Payment failed', message: e?.message ?? 'Try again.' })
                    } finally {
                      setActionLoading(false)
                    }
                  }}
                >
                  Pay Final Balance (${booking.totalAmount - (booking.depositPaid ? booking.depositAmount : 0)})
                </Button>
              )}

              {isClientParty && booking.status === 'completed' && booking.balancePaid && !booking.reviewId && (
                <Button
                  color="yellow"
                  radius="xl"
                  fullWidth
                  leftSection={<IconStar size={18} />}
                  onClick={() => setReviewOpened(true)}
                >
                  Leave a Review
                </Button>
              )}

              {isStylistParty && booking.status === 'confirmed' ? (
                <Button
                  color="green"
                  radius="xl"
                  loading={actionLoading}
                  onClick={() => {
                    modals.openConfirmModal({
                      title: 'Mark Job as Completed',
                      children: (
                        <Text size="sm">
                          Are you sure the service has been completed? Once confirmed, the client will be able to pay the remaining balance.
                        </Text>
                      ),
                      labels: { confirm: 'Yes, Mark Complete', cancel: 'Cancel' },
                      confirmProps: { color: 'green' },
                      onConfirm: async () => {
                        if (!bookingId) return
                        try {
                          setActionLoading(true)
                          await setBookingStatus(bookingId, 'service_complete', 'stylist')
                          notifications.show({ color: 'green', title: 'Service Complete', message: 'The appointment has ended. Client can now pay the balance.' })
                          await refreshBooking()
                        } catch (e: any) {
                          notifications.show({ color: 'red', title: 'Could not complete', message: e?.message ?? 'Try again.' })
                        } finally {
                          setActionLoading(false)
                        }
                      },
                    })
                  }}
                >
                  Mark job completed
                </Button>
              ) : null}
            </Group>
          </Group>
        </Stack>
      </Card>

      <RescheduleModal
        opened={rescheduleOpened}
        onClose={() => setRescheduleOpened(false)}
        stylistId={booking.stylistId}
        serviceDurationMins={service?.durationMins ?? 60}
        onConfirm={handleProposeReschedule}
      />
      <ReviewModal
        opened={reviewOpened}
        onClose={() => setReviewOpened(false)}
        bookingId={bookingId!}
        clientId={booking.clientId}
        clientName={booking.clientName || 'Anonymous'}
        stylistId={booking.stylistId}
        onSuccess={refreshBooking}
      />
    </Stack>
  )
}
