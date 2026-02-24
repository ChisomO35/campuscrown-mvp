import { ActionIcon, AspectRatio, Badge, Card, Group, Image, Stack, Text } from '@mantine/core'
import { IconHeart, IconHeartFilled, IconStarFilled } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import type { Stylist } from '../services/types'
import { useAuth } from '../providers/AuthProvider'
import { toggleFavoriteStylist } from '../services/user'
import { useState } from 'react'

interface StylistCardProps {
    stylist: Stylist
}

function startingPrice(s: Stylist) {
    const prices = (s.services ?? []).map((x) => x.price)
    if (!prices.length) return null
    return Math.min(...prices)
}

export function StylistCard({ stylist }: StylistCardProps) {
    const { appUser } = useAuth()
    const [favoriting, setFavoriting] = useState(false)
    const price = startingPrice(stylist)
    const img =
        stylist.profileImageUrl ||
        stylist.portfolioImageUrls?.[0] ||
        stylist.services?.[0]?.imageUrls?.[0]

    const isFavorited = appUser?.favoriteStylistIds?.includes(stylist.stylistId)

    async function handleToggleFavorite(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        if (!appUser?.uid) return
        setFavoriting(true)
        try {
            await toggleFavoriteStylist(appUser.uid, stylist.stylistId, appUser.favoriteStylistIds ?? [])
        } catch (e) {
            console.error('Failed to toggle favorite', e)
        } finally {
            setFavoriting(false)
        }
    }

    return (
        <Card
            component={Link}
            to={`/s/${stylist.stylistId}`}
            padding="xs"
            radius="lg"
            withBorder
            bg="white"
            style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative'
            }}
        >
            <Card.Section style={{ position: 'relative' }}>
                <AspectRatio ratio={1}>
                    <Image
                        src={img || undefined}
                        fallbackSrc="https://placehold.co/600x600?text=Style"
                        fit="cover"
                    />
                </AspectRatio>
                {appUser && (
                    <ActionIcon
                        variant="filled"
                        color="white"
                        radius="xl"
                        size="md"
                        loading={favoriting}
                        onClick={handleToggleFavorite}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 10,
                        }}
                    >
                        {isFavorited ? (
                            <IconHeartFilled size={16} color="red" />
                        ) : (
                            <IconHeart size={16} color="gray" />
                        )}
                    </ActionIcon>
                )}
            </Card.Section>

            <Stack gap="xs" mt="sm" px={4} mb={4}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Text fw={700} size="md" lineClamp={1} c="dark" style={{ lineHeight: 1.2 }}>
                        {stylist.services?.[0]?.name ?? stylist.name}
                    </Text>
                    {stylist.ratingCount > 0 ? (
                        <Group gap={4} align="center">
                            <IconStarFilled size={14} color="#fcc419" />
                            <Text size="sm" fw={500}>
                                {stylist.ratingAvg.toFixed(1)}
                            </Text>
                        </Group>
                    ) : null}
                </Group>

                <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed" lineClamp={1}>
                        {stylist.name}
                    </Text>
                    {price != null && (
                        <Text size="sm" fw={700} c="crown.8">
                            from ${price}
                        </Text>
                    )}
                </Group>

                <Group gap={6}>
                    <Badge size="sm" color="crown" variant="light" radius="xl">
                        UNC
                    </Badge>
                    {(stylist.locationOptions ?? []).slice(0, 1).map((opt) => (
                        <Badge key={opt} size="sm" color="gray" variant="light" radius="xl">
                            {opt === 'home_studio' ? 'Home' : 'Mobile'}
                        </Badge>
                    ))}
                </Group>
            </Stack>
        </Card>
    )
}
