import { Card, Stack, Text, Image, AspectRatio, Group } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import type { Service, Stylist } from '../services/types'

interface ServiceCardProps {
    service: Service
    stylist: Stylist
}

export function ServiceCard({ service, stylist }: ServiceCardProps) {
    const mainImage = service.imageUrls?.[0]

    return (
        <Card
            component={Link}
            to={`/s/${stylist.stylistId}`}
            withBorder
            radius="xl"
            padding="md"
            bg="white"
            style={{
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                maxWidth: 280,
                width: 280,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            <Stack gap="sm">
                {/* Service image */}
                {mainImage && (
                    <AspectRatio ratio={4 / 3}>
                        <Image
                            src={mainImage}
                            radius="lg"
                            fit="cover"
                        />
                    </AspectRatio>
                )}

                {/* Service info */}
                <Stack gap={8}>
                    <Text fw={700} size="md" lineClamp={1} c="dark.9">
                        {service.name}
                    </Text>

                    <Group justify="space-between" align="center">
                        <Group gap={6}>
                            <IconClock size={16} style={{ color: '#868e96' }} />
                            <Text size="sm" c="dimmed">
                                {service.durationMins} min
                            </Text>
                        </Group>
                        <Text fw={800} size="xl" c="crown.8">
                            ${service.price}
                        </Text>
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={1}>
                        by {stylist.name}
                    </Text>
                </Stack>
            </Stack>
        </Card>
    )
}
