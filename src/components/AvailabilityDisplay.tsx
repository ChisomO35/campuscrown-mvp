import { Card, Group, Stack, Text, Title } from '@mantine/core'
import type { Availability } from '../services/types'
import { decimalToLabel, timeToDecimal } from '../utils/time'

const daysMap: Record<keyof Availability['weeklyRules'], string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
}

const dayOrder: (keyof Availability['weeklyRules'])[] = [
    'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
]

interface AvailabilityDisplayProps {
    availability: Availability
}

export function AvailabilityDisplay({ availability }: AvailabilityDisplayProps) {
    return (
        <Card withBorder radius="lg" padding="lg" bg="white">
            <Title order={5} mb="sm">Weekly Availability</Title>
            <Stack gap="xs">
                {dayOrder.map((dayKey) => {
                    const blocks = availability.weeklyRules[dayKey] ?? []
                    const hasBlocks = blocks.length > 0

                    return (
                        <Group key={dayKey} justify="space-between" align="flex-start">
                            <Text c="dimmed" size="sm" w={100}>{daysMap[dayKey]}</Text>
                            <Stack gap={0} align="flex-end">
                                {hasBlocks ? (
                                    blocks.map((b, i) => (
                                        <Text key={i} size="sm" fw={500}>
                                            {decimalToLabel(timeToDecimal(b.start))} – {decimalToLabel(timeToDecimal(b.end))}
                                        </Text>
                                    ))
                                ) : (
                                    <Text size="sm" c="dimmed">Closed</Text>
                                )}
                            </Stack>
                        </Group>
                    )
                })}
            </Stack>
        </Card>
    )
}
