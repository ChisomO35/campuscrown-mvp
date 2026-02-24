import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  Modal,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconCheck, IconHeart, IconHeartFilled, IconStarFilled, IconMapPin, IconClock } from '@tabler/icons-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { getStylist } from '../../services/stylists'
import { getAvailability } from '../../services/availability'
import { toggleFavoriteStylist } from '../../services/user'
import { getOrCreateConversation } from '../../services/bookings'
import type { Availability, Review, Service, Stylist } from '../../services/types'
import { useAuth } from '../../providers/AuthProvider'
import { AvailabilityDisplay } from '../../components/AvailabilityDisplay'
import { getReviewsForStylist } from '../../services/reviews'
import { IconStar } from '@tabler/icons-react'
import { formatShortDate } from '../../utils/date'

export function StylistProfilePage() {
  const { stylistId } = useParams()
  const { appUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [messagingLoading, setMessagingLoading] = useState(false)
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [favoriting, setFavoriting] = useState(false)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!stylistId) return
        setLoading(true)
        setError(null)
        try {
          const [s, av, revs] = await Promise.all([
            getStylist(stylistId),
            getAvailability(stylistId),
            getReviewsForStylist(stylistId)
          ])
          if (mounted) {
            setStylist(s)
            setAvailability(av)
            setReviews(revs)
          }
        } catch (err: any) {
          console.error('Error loading booking data:', err)
          if (mounted) {
            setError(err.message || 'Failed to load profile')
          }
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

  const services = useMemo(() => (stylist?.services ?? []) as Service[], [stylist])
  const isOwnProfile = appUser?.uid && stylist && stylist.userId === appUser.uid

  const isFavorited = useMemo(() => {
    if (!appUser?.favoriteStylistIds || !stylistId) return false
    return appUser.favoriteStylistIds.includes(stylistId)
  }, [appUser?.favoriteStylistIds, stylistId])

  const allServicePhotos = useMemo(() => {
    if (!stylist) return []
    const photos: string[] = []
    // Start with global portfolio if they still have it (legacy)
    if (stylist.portfolioImageUrls) photos.push(...stylist.portfolioImageUrls)
      // Add all service photos
      ; (stylist.services ?? []).forEach((svc) => {
        if (svc.imageUrls) photos.push(...svc.imageUrls)
      })
    return Array.from(new Set(photos)) // Unique
  }, [stylist])

  async function handleToggleFavorite() {
    if (!appUser?.uid || !stylistId) return
    setFavoriting(true)
    try {
      await toggleFavoriteStylist(appUser.uid, stylistId, appUser.favoriteStylistIds ?? [])
    } catch (e) {
      console.error('Failed to toggle favorite', e)
    } finally {
      setFavoriting(false)
    }
  }

  async function handleMessage() {
    if (!appUser?.uid || !stylist) {
      notifications.show({ color: 'red', title: 'Error', message: 'You must be logged in to send messages.' })
      return
    }

    const targetUserId = stylist.userId || stylistId
    if (!targetUserId) {
      notifications.show({ color: 'red', title: 'Error', message: 'Could not identify stylist.' })
      return
    }

    setMessagingLoading(true)
    try {
      const convId = await getOrCreateConversation(
        appUser.uid,
        targetUserId,
        appUser.displayName || 'Anonymous',
        stylist.name || 'Stylist'
      )
      navigate(`/chat/${convId}`)
    } catch (e: any) {
      console.error('handleMessage: Failed', e)
      notifications.show({
        color: 'red',
        title: 'Could not start chat',
        message: `Permission Error: ${e?.message || 'Check firestore.rules deployment.'}`
      })
    } finally {
      setMessagingLoading(false)
    }
  }

  if (loading) {
    return (
      <Stack gap="xl">
        <Skeleton height={300} radius="lg" />
        <Stack gap="md">
          <Skeleton height={40} width="60%" radius="md" />
          <Skeleton height={20} width="40%" radius="md" />
        </Stack>
        <Grid gutter="md">
          {[1, 2, 3].map(i => (
            <Grid.Col span={4} key={i}>
              <Skeleton height={120} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    )
  }

  if (error) {
    return (
      <Card withBorder radius="lg" bg="white" p="xl">
        <Stack align="center" gap="md">
          <Text c="red" fw={700}>Error: {error}</Text>
          <Button variant="light" color="crown" radius="xl" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Stack>
      </Card>
    )
  }

  if (!stylist) {
    return (
      <Card withBorder radius="lg" bg="white">
        <Text c="dimmed">Stylist not found.</Text>
      </Card>
    )
  }

  return (
    <>
      <Stack gap={0} pb="xl">
        {/* Header Actions */}
        <Container size={600} p="md" w="100%">
          <Group justify="space-between" align="center">
            <Button
              component={Link}
              to="/home"
              variant="subtle"
              color="dark"
              size="sm"
              radius="xl"
              leftSection={<span>←</span>}
            >
              Back
            </Button>
            <Group gap="xs">
              {!isOwnProfile && appUser && (
                <Button
                  variant="light"
                  color="crown"
                  radius="xl"
                  size="xs"
                  loading={messagingLoading}
                  onClick={handleMessage}
                >
                  Message
                </Button>
              )}
              {!isOwnProfile && appUser && (
                <ActionIcon
                  variant="subtle"
                  color={isFavorited ? 'red' : 'gray'}
                  loading={favoriting}
                  onClick={handleToggleFavorite}
                  radius="xl"
                  size="lg"
                >
                  {isFavorited ? <IconHeartFilled size={22} /> : <IconHeart size={22} />}
                </ActionIcon>
              )}
            </Group>
          </Group>
        </Container>

        <Container size={600} w="100%">
          <Stack align="center" gap="sm" mb="xl" pt="md">
            <Box style={{ position: 'relative' }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                <Image
                  src={stylist.profileImageUrl || allServicePhotos[0] || 'https://placehold.co/400x400?text=Profile'}
                  fit="cover"
                  width="100%"
                  height="100%"
                />
              </div>
            </Box>

            <Stack align="center" gap={6}>
              <Group gap="sm" align="center" justify="center">
                <Title order={1} size="1.75rem" c="crown.9" ta="center">
                  {stylist.name}
                </Title>
                {stylist.verified && (
                  <Badge
                    color="crown"
                    variant="filled"
                    size="sm"
                    radius="md"
                    leftSection={<IconCheck size={10} />}
                  >
                    VERIFIED
                  </Badge>
                )}
              </Group>

              <Group gap="md" justify="center">
                <Group gap={6} c="dimmed">
                  <IconMapPin size={16} />
                  <Text size="sm" fw={600}>UNC</Text>
                </Group>
                <Text c="dimmed" size="xs">•</Text>
                <Group gap={6} align="center">
                  <IconStarFilled size={16} color="#fab005" />
                  <Text size="sm" fw={700}>
                    {(stylist.ratingAvg || 0).toFixed(1)}
                  </Text>
                  <Text size="xs" c="dimmed" ml={-2}>({stylist.ratingCount || 0} reviews)</Text>
                </Group>
              </Group>
            </Stack>
          </Stack>

          <Card withBorder={false} radius="40px" padding="xl" bg="white" style={{
            boxShadow: '0 8px 64px rgba(0,0,0,0.06)',
            borderBottomLeftRadius: '40px',
            borderBottomRightRadius: '40px',
            borderTopLeftRadius: '40px',
            borderTopRightRadius: '40px',
          }}>
            <Stack gap={48}>
              {/* About Section */}
              <Stack gap="lg">
                <Title order={3} c="crown.9">About</Title>
                <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
                  {stylist.bio || `${stylist.name} is a verified stylist at UNC offering professional hair services.`}
                </Text>
                <Group gap="sm">
                  {(stylist.locationOptions ?? []).map((opt) => (
                    <Badge
                      key={opt}
                      variant="light"
                      color="crown"
                      size="md"
                      radius="xl"
                      px="md"
                      py="sm"
                      h="auto"
                      leftSection={<Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: 'currentColor' }} />}
                    >
                      {opt === 'home_studio' ? 'Home Studio' : 'Mobile'}
                    </Badge>
                  ))}
                </Group>
              </Stack>

              {/* Services Section */}
              <Stack gap="md">
                <Title order={3} c="crown.9">Services</Title>
                <Stack gap="md">
                  {services.map((svc) => (
                    <Card
                      key={svc.serviceId}
                      withBorder
                      radius="24px"
                      padding="lg"
                      bg="#fbf9ff"
                      style={{
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer',
                        borderColor: '#eee'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Stack gap="md">
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Stack gap={8} flex={1}>
                            <Text fw={700} size="lg" c="dark.8">{svc.name}</Text>
                            <Group gap="md">
                              <Group gap={6} c="dimmed">
                                <IconClock size={16} />
                                <Text size="sm" fw={500}>{svc.durationMins} min</Text>
                              </Group>
                              <Text size="sm" c="dimmed">•</Text>
                              <Badge variant="dot" color={svc.hairIncluded ? 'green' : 'gray'} size="sm">
                                Hair: {svc.hairIncluded ? 'Included' : 'Not Included'}
                              </Badge>
                            </Group>
                          </Stack>
                          <Stack align="flex-end" gap={12}>
                            <Text fw={800} size="1.5rem" c="crown.8" style={{ lineHeight: 1 }}>
                              ${svc.price}
                            </Text>
                            <Button
                              component={Link}
                              to={!!isOwnProfile ? '#' : `/book/${stylist.stylistId}/${svc.serviceId}`}
                              color="crown"
                              radius="xl"
                              size="sm"
                              px="lg"
                              disabled={!!isOwnProfile}
                              style={{
                                boxShadow: '0 4px 12px rgba(var(--mantine-color-crown-rgb), 0.2)'
                              }}
                            >
                              Book
                            </Button>
                          </Stack>
                        </Group>

                        {/* Service Photos */}
                        {svc.imageUrls && svc.imageUrls.length > 0 && (
                          <Grid gutter="xs" mt="md">
                            {svc.imageUrls.map((url, idx) => (
                              <Grid.Col span={4} key={url + idx}>
                                <AspectRatio ratio={1}>
                                  <Image
                                    src={url}
                                    radius="md"
                                    fit="cover"
                                    style={{
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onClick={() => setViewingImage(url)}
                                  />
                                </AspectRatio>
                              </Grid.Col>
                            ))}
                          </Grid>
                        )}
                      </Stack>
                    </Card>
                  ))}
                  {services.length === 0 && (
                    <Text c="dimmed" ta="center" py="xl">No services listed yet.</Text>
                  )}
                </Stack>
              </Stack>

              {/* Availability Preview */}
              {availability && (
                <Stack gap="md">
                  <Title order={3} c="crown.9">Availability</Title>
                  <AvailabilityDisplay availability={availability} />
                </Stack>
              )}

              {/* Reviews Section */}
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={3} c="crown.9">Reviews</Title>
                  {reviews.length > 0 && (
                    <Group gap={4}>
                      <IconStar size={18} fill="gold" color="gold" />
                      <Text fw={700} size="sm">{stylist.ratingAvg.toFixed(1)}</Text>
                      <Text size="sm" c="dimmed">({stylist.ratingCount})</Text>
                    </Group>
                  )}
                </Group>

                {reviews.length === 0 ? (
                  <Card withBorder radius="lg" padding="xl" bg="gray.0">
                    <Stack align="center" gap="xs">
                      <IconStar size={32} color="gray" />
                      <Text c="dimmed" ta="center">No reviews yet</Text>
                    </Stack>
                  </Card>
                ) : (
                  <Stack gap="md">
                    {reviews.map((review) => (
                      <Card key={review.reviewId} withBorder radius="lg" padding="lg" bg="white">
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Text fw={700}>{review.clientName}</Text>
                              <Group gap={4}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <IconStar
                                    key={i}
                                    size={14}
                                    fill={i < review.rating ? 'gold' : 'none'}
                                    color={i < review.rating ? 'gold' : 'gray'}
                                  />
                                ))}
                              </Group>
                            </Stack>
                            <Text size="xs" c="dimmed">
                              {formatShortDate(review.createdAt)}
                            </Text>
                          </Group>
                          {review.comment && (
                            <Text size="sm" style={{ lineHeight: 1.6 }}>
                              {review.comment}
                            </Text>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>

              {/* Policies */}
              <Stack gap="md">
                <Title order={4} c="crown.9">Policies</Title>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  All bookings are subject to stylist approval. Please ensure you are available at the requested time.
                  Cancellations within 24 hours may incur a fee.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Stack>

      {/* Image Modal */}
      {viewingImage && (
        <Modal
          opened={true}
          onClose={() => setViewingImage(null)}
          centered
          size="auto"
          padding={0}
          withCloseButton={false}
          overlayProps={{ backgroundOpacity: 0.8, blur: 5 }}
          transitionProps={{ transition: 'fade', duration: 300 }}
        >
          <Image
            src={viewingImage}
            radius="lg"
            fit="contain"
            style={{ maxHeight: '85vh', maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
          />
        </Modal>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .portfolio-thumb:hover {
            transform: scale(1.04);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            z-index: 10;
          }
          :root {
            --mantine-color-crown-rgb: 87, 24, 137;
          }
        `}} />
    </>
  )
}
