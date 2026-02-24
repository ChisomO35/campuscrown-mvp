import { Avatar, Card, Group, Stack, Text, Image, AspectRatio, Grid, ActionIcon, Box } from '@mantine/core'
import { IconStar, IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import type { Stylist } from '../services/types'

interface StylistProfileCardProps {
    stylist: Stylist
    isLiked?: boolean
    onToggleLike?: () => void
    style?: React.CSSProperties
}

export function StylistProfileCard({ stylist, isLiked, onToggleLike, style }: StylistProfileCardProps) {
    // Get up to 4 portfolio images from services
    const portfolioImages = stylist.services
        ?.flatMap(s => s.imageUrls || [])
        .slice(0, 4) || []

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
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                ...style,
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
            <Stack gap="sm" style={{ flex: 1 }}>
                {/* Header with profile pic and name/rating */}
                <Group wrap="nowrap" gap="sm" align="center">
                    <Avatar
                        src={stylist.profileImageUrl}
                        size={40}
                        radius="xl"
                        style={{ flexShrink: 0 }}
                    />
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="sm" lineClamp={1} c="dark.9">
                            {stylist.name || 'Stylist'}
                        </Text>
                        <Group gap={4}>
                            <IconStar size={14} fill="gold" color="gold" />
                            <Text size="sm" fw={600}>
                                {stylist.ratingAvg > 0 ? stylist.ratingAvg.toFixed(1) : 'New'}
                            </Text>
                            {stylist.ratingCount > 0 && (
                                <>
                                    <Text size="sm" c="dimmed">•</Text>
                                    <Text size="sm" c="dimmed">
                                        {stylist.ratingCount}
                                    </Text>
                                </>
                            )}
                        </Group>
                    </Stack>
                    {onToggleLike && (
                        <ActionIcon
                            variant="subtle"
                            color={isLiked ? 'red' : 'gray'}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onToggleLike()
                            }}
                        >
                            {isLiked ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                        </ActionIcon>
                    )}
                </Group>

                {/* Portfolio images - 2x2 grid */}
                {portfolioImages.length > 0 ? (
                    <Grid gutter={6}>
                        {portfolioImages.map((url, idx) => (
                            <Grid.Col span={6} key={idx}>
                                <AspectRatio ratio={1}>
                                    <Image
                                        src={url}
                                        radius="sm"
                                        fit="cover"
                                    />
                                </AspectRatio>
                            </Grid.Col>
                        ))}
                        {/* Fill empty slots if less than 4 images */}
                        {Array.from({ length: Math.max(0, 4 - portfolioImages.length) }).map((_, idx) => (
                            <Grid.Col span={6} key={`empty-${idx}`}>
                                <AspectRatio ratio={1}>
                                    <div style={{ background: '#f5f5f5', borderRadius: 4 }} />
                                </AspectRatio>
                            </Grid.Col>
                        ))}
                    </Grid>
                ) : (
                    <Box style={{ flex: 1, minHeight: 120, background: '#f9f9f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text size="xs" c="dimmed">No images</Text>
                    </Box>
                )}
            </Stack>
        </Card>
    )
}
