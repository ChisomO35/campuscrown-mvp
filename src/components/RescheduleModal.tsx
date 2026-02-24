import { useEffect, useMemo, useState } from 'react'
import {
    Modal,
    Button,
    Stack,
    Text,
    Group,
    ScrollArea,
    Box,
    SimpleGrid,
    Loader,
} from '@mantine/core'
import dayjs from 'dayjs'
import { getAvailability, buildSlots } from '../services/availability'
import type { Availability } from '../services/types'

interface RescheduleModalProps {
    opened: boolean
    onClose: () => void
    stylistId: string
    serviceDurationMins: number
    onConfirm: (startAt: string, endAt: string) => Promise<void>
}

export function RescheduleModal({
    opened,
    onClose,
    stylistId,
    serviceDurationMins,
    onConfirm,
}: RescheduleModalProps) {
    const [loading, setLoading] = useState(false)
    const [availability, setAvailability] = useState<Availability | null>(null)
    const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null)
    const [slotStartAt, setSlotStartAt] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (opened && stylistId) {
            setLoading(true)
            getAvailability(stylistId)
                .then(setAvailability)
                .finally(() => setLoading(false))
        }
    }, [opened, stylistId])

    const slots = useMemo(() => {
        if (!availability) return []
        return buildSlots({
            availability,
            serviceDurationMins,
            daysForward: 14,
        })
    }, [availability, serviceDurationMins])

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

    useEffect(() => {
        if (availableDates.length > 0 && !selectedDateIso) {
            setSelectedDateIso(availableDates[0])
        }
    }, [availableDates, selectedDateIso])

    const slotsForDate = useMemo(
        () => (selectedDateIso ? groupedSlots[selectedDateIso] : []),
        [selectedDateIso, groupedSlots],
    )

    const handleConfirm = async () => {
        const slot = slots.find((s) => s.startAt === slotStartAt)
        if (!slot) return
        setSubmitting(true)
        try {
            await onConfirm(slot.startAt, slot.endAt)
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal opened={opened} onClose={onClose} title="Request Reschedule" radius="lg">
            <Stack gap="md">
                {loading ? (
                    <Group justify="center" py="xl">
                        <Loader color="crown" />
                    </Group>
                ) : availableDates.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                        No availability found for this stylist.
                    </Text>
                ) : (
                    <>
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
                                                setSlotStartAt(null)
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
                                                },
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
                            <Box>
                                <Text size="xs" fw={700} mb="xs" c="dimmed">
                                    {dayjs(selectedDateIso).format('dddd, MMMM D')}
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
                            </Box>
                        )}

                        <Button
                            fullWidth
                            color="crown"
                            radius="xl"
                            mt="md"
                            disabled={!slotStartAt || submitting}
                            loading={submitting}
                            onClick={handleConfirm}
                        >
                            Propose New Time
                        </Button>
                    </>
                )}
            </Stack>
        </Modal>
    )
}
