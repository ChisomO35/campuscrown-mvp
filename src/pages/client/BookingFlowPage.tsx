import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Badge,
  Button,
  Card,
  Group,
  Radio,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Title,
  Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate, useParams } from 'react-router-dom'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { buildSlots, getAvailability } from '../../services/availability'
import { createBookingRequest } from '../../services/bookings'
import { getStylist } from '../../services/stylists'
import { formatFullDate } from '../../utils/date'
import type { Availability, LocationType, Stylist } from '../../services/types'

export function BookingFlowPage() {
  const { stylistId, serviceId } = useParams()
  const nav = useNavigate()
  const { appUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [availability, setAvailability] = useState<Availability | null>(null)

  const [locationType, setLocationType] = useState<LocationType | null>(null)
  const [mobileNote, setMobileNote] = useState('')
  const [slotStartAt, setSlotStartAt] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!stylistId) return
        setLoading(true)
        try {
          const [s, av] = await Promise.all([getStylist(stylistId), getAvailability(stylistId)])
          if (mounted) {
            setStylist(s)
            setAvailability(av)
          }
        } catch (err) {
          console.error('Error loading booking data:', err)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      })()
    return () => {
      mounted = false
    }
  }, [stylistId])

  const service = useMemo(() => {
    if (!stylist || !serviceId) return null
    return (stylist.services ?? []).find((x) => x.serviceId === serviceId) ?? null
  }, [stylist, serviceId])

  const slots = useMemo(() => {
    if (!availability || !service) return []
    return buildSlots({
      availability,
      serviceDurationMins: service.durationMins,
      daysForward: 14
    })
  }, [availability, service])

  const groupedSlots = useMemo(() => {
    const groups: Record<string, typeof slots> = {}
    slots.forEach((s) => {
      const dateKey = dayjs(s.startAt).format('YYYY-MM-DD')
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(s)
    })
    return groups
  }, [slots])

  const availableDates = useMemo(() => Object.keys(groupedSlots).sort(), [groupedSlots])
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null)

  // Auto-select first date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDateIso) {
      setSelectedDateIso(availableDates[0])
    }
  }, [availableDates, selectedDateIso])

  const selectedSlot = useMemo(() => slots.find((s) => s.startAt === slotStartAt) ?? null, [slots, slotStartAt])
  const slotsForDate = useMemo(() => (selectedDateIso ? groupedSlots[selectedDateIso] : []), [selectedDateIso, groupedSlots])

  if (loading) {
    return (
      <Stack gap="md">
        <Skeleton height={24} width="60%" radius="sm" />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </Stack>
    )
  }

  if (!stylist || !service) {
    return (
      <Card withBorder radius="lg" bg="white">
        <Text c="dimmed">Booking info not found.</Text>
      </Card>
    )
  }

  const locationOptions = stylist.locationOptions ?? []

  return (
    <Stack gap="xl">
      <Title order={3} c="crown.9">
        Request booking
      </Title>

      <Card withBorder radius="lg" padding="xl" bg="white">
        <Stack gap="md">
          <Text fw={800}>{service.name}</Text>
          <Group gap="xs">
            <Badge radius="xl" color="crown" variant="light">
              ${service.price}
            </Badge>
            <Badge radius="xl" color="gray" variant="light">
              {service.durationMins} min
            </Badge>
            <Badge radius="xl" color="gray" variant="light">
              Hair included: {service.hairIncluded ? 'Yes' : 'No'}
            </Badge>
            {service.depositAmount ? (
              <Badge radius="xl" color="orange" variant="light">
                Deposit: ${service.depositAmount}
              </Badge>
            ) : null}
          </Group>
          <Text size="sm" c="dimmed">
            Stylist: {stylist.name} • UNC
          </Text>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" bg="white">
        <Title order={5} mb="xs">
          Where do you want the appointment?
        </Title>
        <Radio.Group value={locationType ?? ''} onChange={(v) => setLocationType(v as LocationType)}>
          <Stack gap="xs">
            {locationOptions.includes('home_studio') ? (
              <Radio value="home_studio" label={`Home studio${stylist.publicLocationLabel ? ` • ${stylist.publicLocationLabel}` : (stylist as any).homeStudioPublicArea ? ` • ${(stylist as any).homeStudioPublicArea}` : ''}`} />
            ) : null}
            {locationOptions.includes('mobile') ? (
              <Radio value="mobile" label={`Mobile${stylist.mobileServiceAreaPublic ? ` • ${stylist.mobileServiceAreaPublic}` : ''}`} />
            ) : null}
          </Stack>
        </Radio.Group>
        {locationType === 'mobile' ? (
          <Textarea
            mt="sm"
            label="Location note (MVP)"
            placeholder="On-campus / dorm name / cross-streets"
            value={mobileNote}
            onChange={(e) => setMobileNote(e.currentTarget.value)}
          />
        ) : null}
      </Card>

      <Card withBorder radius="lg" padding="xl" bg="white">
        <Title order={5} mb="lg">Pick a time</Title>

        {availableDates.length === 0 ? (
          <Text size="sm" c="dimmed">
            No availability set yet.
          </Text>
        ) : (
          <Stack gap="md">
            <ScrollArea pb="sm">
              <Group gap="xs" wrap="nowrap">
                {availableDates.map((dateIso) => {
                  const d = dayjs(dateIso)
                  const isActive = selectedDateIso === dateIso
                  return (
                    <Button
                      key={dateIso}
                      variant={isActive ? 'filled' : 'light'}
                      color="crown"
                      radius="md"
                      px="md"
                      onClick={() => {
                        setSelectedDateIso(dateIso)
                        setSlotStartAt(null) // Reset slot when date changes
                      }}
                      styles={{
                        root: {
                          height: 'auto',
                          paddingTop: 8,
                          paddingBottom: 8,
                        },
                        label: {
                          flexDirection: 'column',
                          gap: 2,
                        }
                      }}
                    >
                      <Text size="xs" fw={isActive ? 700 : 500} style={{ opacity: 0.8 }}>
                        {d.format('ddd')}
                      </Text>
                      <Text size="sm" fw={800}>
                        {d.format('MMM D')}
                      </Text>
                    </Button>
                  )
                })}
              </Group>
            </ScrollArea>

            {selectedDateIso && (
              <Box mt="md">
                <Text size="sm" fw={700} mb="md" c="dimmed">
                  Available times for {selectedDateIso ? formatFullDate(selectedDateIso) : ''}
                </Text>
                <SimpleGrid cols={3} spacing="xs">
                  {slotsForDate.map((s) => (
                    <Button
                      key={s.startAt}
                      variant={slotStartAt === s.startAt ? 'filled' : 'outline'}
                      color="crown"
                      radius="md"
                      size="sm"
                      onClick={() => setSlotStartAt(s.startAt)}
                    >
                      {dayjs(s.startAt).format('h:mm A')}
                    </Button>
                  ))}
                </SimpleGrid>
                {slotsForDate.length === 0 && (
                  <Text size="sm" c="dimmed" py="xl" ta="center">
                    No slots available for this day.
                  </Text>
                )}
              </Box>
            )}
          </Stack>
        )}
      </Card>

      <Button
        color="crown"
        radius="xl"
        disabled={!locationType || !selectedSlot || submitting}
        loading={submitting}
        onClick={async () => {
          if (!appUser) return
          if (!locationType) return
          if (!selectedSlot) return

          try {
            setSubmitting(true)
            const bookingId = await createBookingRequest({
              clientId: appUser.uid,
              clientName: appUser.displayName || 'Anonymous',
              stylistId: stylist.stylistId,
              stylistName: stylist.name,
              serviceId: service.serviceId,
              startAt: selectedSlot.startAt,
              endAt: selectedSlot.endAt,
              locationType,
              mobileLocationNote: locationType === 'mobile' ? mobileNote.trim() || undefined : undefined,
              depositAmount: service.depositAmount || 0,
              totalAmount: service.price,
            })
            notifications.show({
              color: 'crown',
              title: 'Request sent',
              message: 'You can message the stylist in the booking chat.',
            })
            nav(`/booking/${bookingId}`)
          } catch (e: any) {
            notifications.show({
              color: 'red',
              title: 'Could not request booking',
              message: e?.message ?? 'Please try again.',
            })
          } finally {
            setSubmitting(false)
          }
        }}
      >
        Send booking request
      </Button>
    </Stack>
  )
}

