import { ActionIcon, Avatar, Box, Button, Card, Grid, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { listStylistsByIds } from '../../services/stylists'
import type { Stylist } from '../../services/types'
import { StylistProfileCard } from '../../components/StylistProfileCard'
import { IconCamera, IconCheck, IconPencil, IconX } from '@tabler/icons-react'
import { uploadImage } from '../../services/cloudinary'
import { doc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { notifications } from '@mantine/notifications'

// ... existing code ...


export function ClientProfilePage() {
  const { appUser, hasStylistApplication } = useAuth()
  const [savedStylists, setSavedStylists] = useState<Stylist[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  async function handleToggleLike(stylistId: string) {
    if (!appUser) return
    // Remove from saved list immediately
    setSavedStylists((current) => current.filter((s) => s.stylistId !== stylistId))

    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        favoriteStylistIds: arrayRemove(stylistId),
      })
      notifications.show({ color: 'gray', message: 'Removed from saved stylists' })
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Error', message: 'Could not remove stylist.' })
    }
  }

  const isStylist = appUser?.role === 'stylist'
  const wantsStylist = appUser?.wantsStylist
  const favoriteIds = appUser?.favoriteStylistIds ?? []

  useEffect(() => {
    if (favoriteIds.length > 0) {
      setLoadingSaved(true)
      listStylistsByIds(favoriteIds)
        .then(setSavedStylists)
        .finally(() => setLoadingSaved(false))
    } else {
      setSavedStylists([])
    }
  }, [favoriteIds])

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(appUser?.displayName ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (appUser?.displayName) {
      setEditedName(appUser.displayName)
    }
  }, [appUser?.displayName])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !appUser) return

    setIsUploading(true)
    try {
      const { secure_url } = await uploadImage(file)
      await updateDoc(doc(db, 'users', appUser.uid), {
        profileImageUrl: secure_url,
      })
      notifications.show({
        color: 'green',
        title: 'Success',
        message: 'Profile picture updated!',
      })
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Upload failed',
        message: err.message || 'Could not upload image.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSaveName() {
    if (!appUser || !editedName.trim()) return
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        displayName: editedName.trim(),
      })
      setIsEditing(false)
      notifications.show({
        color: 'green',
        title: 'Success',
        message: 'Name updated!',
      })
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: err.message || 'Could not update name.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={3} c="crown.9">
          Profile
        </Title>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </Group>

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Stack gap="md" align="center">
          <Box style={{ position: 'relative' }}>
            <Avatar
              src={appUser?.profileImageUrl}
              size={120}
              radius={120}
              variant="light"
              color="crown"
            >
              {appUser?.displayName?.[0] ?? 'U'}
            </Avatar>
            <ActionIcon
              variant="filled"
              color="crown"
              radius="xl"
              size="lg"
              style={{ position: 'absolute', bottom: 0, right: 0 }}
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
            >
              <IconCamera size={18} />
            </ActionIcon>
          </Box>

          <Stack gap="xs" align="center" style={{ width: '100%' }}>
            {isEditing ? (
              <Group gap="xs" align="center" style={{ width: '100%' }} wrap="nowrap">
                <TextInput
                  value={editedName}
                  onChange={(v) => setEditedName(v.currentTarget.value)}
                  style={{ flex: 1 }}
                  size="sm"
                  autoFocus
                />
                <ActionIcon color="green" variant="light" onClick={handleSaveName} loading={isSaving}>
                  <IconCheck size={18} />
                </ActionIcon>
                <ActionIcon color="red" variant="light" onClick={() => setIsEditing(false)}>
                  <IconX size={18} />
                </ActionIcon>
              </Group>
            ) : (
              <Group gap="xs" align="center">
                <Text fw={700} size="lg">
                  {appUser?.displayName ?? 'User'}
                </Text>
                <ActionIcon variant="subtle" color="dimmed" size="sm" onClick={() => setIsEditing(true)}>
                  <IconPencil size={14} />
                </ActionIcon>
              </Group>
            )}
            <Text size="sm" c="dimmed">
              {appUser?.email}
            </Text>
            <Text size="sm" c="dimmed">
              Campus: UNC
            </Text>
            {isStylist ? (
              <Text size="sm" c="crown.7" fw={600}>
                Role: Stylist
              </Text>
            ) : wantsStylist && hasStylistApplication ? (
              <Text size="sm" c="crown.7" fw={600}>
                Stylist application submitted
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </Card>

      {favoriteIds.length > 0 && (
        <Stack gap="sm">
          <Title order={4}>Saved stylists</Title>
          <Grid gutter="md">
            {savedStylists.map((s) => (
              <Grid.Col span={6} key={s.stylistId}>
                <StylistProfileCard
                  stylist={s}
                  isLiked={true}
                  onToggleLike={() => handleToggleLike(s.stylistId)}
                />
              </Grid.Col>
            ))}
            {loadingSaved && savedStylists.length === 0 && (
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">
                  Loading saved stylists...
                </Text>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      )}

      <Card withBorder radius="lg" padding="lg" bg="white">
        <Stack gap="sm">
          <Text fw={700}>Quick links</Text>

          <Button
            component={Link}
            to="/bookings"
            variant="light"
            color="crown"
            radius="xl"
            fullWidth
          >
            My bookings
          </Button>

          {isStylist ? (
            <>
              <Button
                component={Link}
                to="/stylist/dashboard"
                variant="light"
                color="crown"
                radius="xl"
                fullWidth
              >
                Stylist bookings
              </Button>
              <Button
                component={Link}
                to="/stylist/messages"
                variant="light"
                color="crown"
                radius="xl"
                fullWidth
              >
                Stylist messages
              </Button>
              <Button
                component={Link}
                to="/stylist/profile"
                variant="light"
                color="crown"
                radius="xl"
                fullWidth
              >
                Edit stylist profile
              </Button>
              <Button
                component={Link}
                to="/stylist/earnings"
                variant="light"
                color="crown"
                radius="xl"
                fullWidth
              >
                Earnings
              </Button>
            </>
          ) : wantsStylist && hasStylistApplication ? (
            <Button
              component={Link}
              to="/stylist/apply"
              variant="light"
              color="crown"
              radius="xl"
              fullWidth
            >
              View stylist application
            </Button>
          ) : (
            <Button
              component={Link}
              to="/stylist/apply"
              variant="light"
              color="crown"
              radius="xl"
              fullWidth
            >
              Become a stylist
            </Button>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
