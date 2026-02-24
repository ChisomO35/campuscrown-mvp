import { useRef } from 'react'
import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPhotoPlus } from '@tabler/icons-react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { uploadImage } from '../../services/cloudinary'
import { getMyApplication, submitStylistApplication } from '../../services/applications'
import { db } from '../../services/firebase'
import type { LocationType, StylistApplication } from '../../services/types'
import { useNavigate } from 'react-router-dom'
import { formatFullDateTime } from '../../utils/date'

const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif'

export function StylistApplyPage() {
  const { appUser } = useAuth()
  const nav = useNavigate()
  const [existing, setExisting] = useState<StylistApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [govIdUploading, setGovIdUploading] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  const [pendingUploadMode, setPendingUploadMode] = useState<'gov_id' | 'profile' | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const govIdRef = useRef<HTMLInputElement>(null)
  const profilePicRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    initialValues: {
      fullName: appUser?.displayName ?? '',
      phone: '',
      homeStudio: true,
      mobile: false,
      homeStudioPublicArea: '',
      mobileServiceAreaPublic: '',
      governmentIdUrl: '',
      profileImageUrl: '',
    },
    validate: {
      fullName: (v) => (v.trim().length >= 2 ? null : 'Enter your name'),
      governmentIdUrl: (v) => (v ? null : 'Government ID is required for verification'),
    },
  })

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!appUser) return
        setLoading(true)
        try {
          const a = await getMyApplication(appUser.uid)
          if (!mounted) return
          setExisting(a)

          if (a) {
            form.setValues({
              fullName: a.fullName,
              phone: a.phone ?? '',
              homeStudio: (a.locationOptions ?? []).includes('home_studio'),
              mobile: (a.locationOptions ?? []).includes('mobile'),
              homeStudioPublicArea: a.homeStudioPublicArea ?? '',
              mobileServiceAreaPublic: a.mobileServiceAreaPublic ?? '',
              governmentIdUrl: a.governmentIdUrl ?? '',
              profileImageUrl: a.profileImageUrl ?? '',
            })
          }

          // Mark this user as stylist-intent if they are viewing the apply page
          // and don't yet have an application. This lets login know to route
          // them back here until they submit.
          if (!a) {
            try {
              await updateDoc(doc(db, 'users', appUser.uid), {
                wantsStylist: true,
                updatedAt: serverTimestamp(),
              })
            } catch {
              // Non-fatal; if this fails, login just won't auto-redirect
            }
          }
        } catch {
          if (!mounted) return
          setExisting(null)
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [appUser?.uid])

  // If the stylist has been approved, redirect this page straight to the dashboard.
  useEffect(() => {
    if (!loading && existing?.status === 'approved') {
      nav('/stylist/dashboard', { replace: true })
    }
  }, [loading, existing?.status, nav])

  async function handleGovIdFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || pendingUploadMode !== 'gov_id') {
      setPendingUploadMode(null)
      return
    }
    setGovIdUploading(true)
    try {
      const { secure_url } = await uploadImage(file)
      form.setFieldValue('governmentIdUrl', secure_url)
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Upload failed',
        message: err instanceof Error ? err.message : 'Could not upload government ID.',
      })
    } finally {
      setGovIdUploading(false)
      setPendingUploadMode(null)
      e.target.value = ''
    }
  }

  async function handleProfilePicSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || pendingUploadMode !== 'profile') {
      setPendingUploadMode(null)
      return
    }
    setProfileUploading(true)
    try {
      const { secure_url } = await uploadImage(file)
      form.setFieldValue('profileImageUrl', secure_url)
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Upload failed',
        message: err instanceof Error ? err.message : 'Could not upload profile photo.',
      })
    } finally {
      setProfileUploading(false)
      setPendingUploadMode(null)
      e.target.value = ''
    }
  }

  if (!appUser) {
    return (
      <Stack gap="md">
        <Skeleton height={28} width="40%" radius="sm" />
        <SkeletonRow />
        <SkeletonRow />
      </Stack>
    )
  }

  if (!loading && existing && mode === 'view') {
    const submittedAt = formatFullDateTime(existing.submittedAt)

    if (existing.status === 'rejected') {
      return (
        <Stack gap="md">
          <Title order={3} c="crown.9">
            Stylist Application
          </Title>
          <Card withBorder radius="lg" bg="white" padding="lg">
            <Group justify="space-between" mb="xs">
              <Text fw={700}>Status</Text>
              <Badge radius="xl" color="red" variant="light">
                Rejected
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Submitted: {submittedAt}
            </Text>
            {existing.rejectionReason && (
              <Text size="sm" c="red" mt="sm">
                Reason: {existing.rejectionReason}
              </Text>
            )}
            <Text size="sm" c="dimmed" mt="sm">
              You can update your photos or details and resubmit your application.
            </Text>
            <Button mt="md" color="crown" radius="xl" onClick={() => setMode('edit')}>
              Edit And Resubmit
            </Button>
          </Card>
        </Stack>
      )
    }

    // Pending or approved – read-only status card
    return (
      <Stack gap="md">
        <Title order={3} c="crown.9">
          Stylist Application
        </Title>
        <Card withBorder radius="lg" bg="white" padding="lg">
          <Group justify="space-between" mb="xs">
            <Text fw={700}>Status</Text>
            <Badge
              radius="xl"
              color={existing.status === 'approved' ? 'green' : 'yellow'}
              variant="light"
            >
              {existing.status}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Submitted: {submittedAt}
          </Text>
          <Text size="sm" c="dimmed" mt="sm">
            {existing.status === 'approved'
              ? 'Your stylist profile has been approved for UNC discovery.'
              : 'We’ll review your application and approve your profile for UNC discovery.'}
          </Text>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Title order={3} c="crown.9">
          Become A Stylist
        </Title>
        <Text c="dimmed">Apply to be listed on Campus Crown (UNC).</Text>
      </Stack>

      {loading ? <Text size="xs" c="dimmed">Checking for existing application…</Text> : null}

      <Card withBorder radius="lg" bg="white" padding="lg">
        <form
          onSubmit={form.onSubmit(async (v) => {
            try {
              setSubmitting(true)
              const locationOptions: LocationType[] = []
              if (v.homeStudio) locationOptions.push('home_studio')
              if (v.mobile) locationOptions.push('mobile')

              if (existing && existing.status === 'rejected') {
                // Resubmit existing application
                await updateDoc(doc(db, 'stylistApplications', existing.applicationId), {
                  fullName: v.fullName.trim(),
                  phone: v.phone.trim() || null,
                  portfolioImageUrls: [],
                  governmentIdUrl: v.governmentIdUrl,
                  profileImageUrl: v.profileImageUrl || null,
                  locationOptions,
                  homeStudioPublicArea: v.homeStudioPublicArea.trim() || null,
                  mobileServiceAreaPublic: v.mobileServiceAreaPublic.trim() || null,
                  status: 'pending',
                  rejectionReason: null,
                  submittedAt: new Date().toISOString(),
                  updatedAt: serverTimestamp(),
                })

                notifications.show({
                  color: 'crown',
                  title: 'Application resubmitted',
                  message: 'We’ll review your updated application.',
                })

                if (appUser) {
                  const a = await getMyApplication(appUser.uid)
                  setExisting(a)
                }
                setMode('view')
              } else if (appUser) {
                await submitStylistApplication({
                  userId: appUser.uid,
                  campus: 'UNC',
                  fullName: v.fullName.trim(),
                  phone: v.phone.trim() || undefined,
                  portfolioImageUrls: [],
                  governmentIdUrl: v.governmentIdUrl,
                  profileImageUrl: v.profileImageUrl || undefined,
                  locationOptions,
                  homeStudioPublicArea: v.homeStudioPublicArea.trim() || undefined,
                  mobileServiceAreaPublic: v.mobileServiceAreaPublic.trim() || undefined,
                })

                // Mark that this user now has a stylist application on file,
                // so future logins can route them to the normal home/dashboard.
                try {
                  await updateDoc(doc(db, 'users', appUser.uid), {
                    hasStylistApplication: true,
                    updatedAt: serverTimestamp(),
                  })
                } catch {
                  // Non-fatal; if this fails, they may still be redirected to apply.
                }

                notifications.show({
                  color: 'crown',
                  title: 'Application submitted',
                  message: 'We’ll review and approve your profile.',
                })

                const a = await getMyApplication(appUser.uid)
                setExisting(a)
                setMode('view')
              }
            } catch (e: unknown) {
              notifications.show({
                color: 'red',
                title: 'Could not submit',
                message: e instanceof Error ? e.message : 'Please try again.',
              })
            } finally {
              setSubmitting(false)
            }
          })}
        >
          <Stack gap="xl">
            <TextInput label="Full Name" {...form.getInputProps('fullName')} />
            <TextInput label="Phone (Optional)" {...form.getInputProps('phone')} />

            <Stack gap="md">
              <Text fw={600} size="sm">
                Government Issued ID
              </Text>
              <Text size="xs" c="dimmed">
                Required for security verification. This will NOT be shown on your public profile.
              </Text>
              <input
                ref={govIdRef}
                type="file"
                accept={ACCEPT_IMAGES}
                style={{ display: 'none' }}
                onChange={handleGovIdFileSelect}
              />
              <Group align="flex-start" gap="md">
                <Button
                  type="button"
                  variant="light"
                  color="crown"
                  leftSection={<IconPhotoPlus size={18} />}
                  loading={govIdUploading}
                  onClick={() => {
                    setPendingUploadMode('gov_id')
                    govIdRef.current?.click()
                  }}
                >
                  {form.values.governmentIdUrl ? 'Change ID Photo' : 'Upload ID Photo'}
                </Button>

                {form.values.governmentIdUrl && (
                  <Card withBorder radius="md" padding={4}>
                    <div style={{ width: 140, height: 90, borderRadius: 8, overflow: 'hidden' }}>
                      <Image src={form.values.governmentIdUrl} fit="cover" width="100%" height="100%" />
                    </div>
                  </Card>
                )}
              </Group>
              {form.errors.governmentIdUrl && (
                <Text size="xs" color="red">
                  {form.errors.governmentIdUrl}
                </Text>
              )}
            </Stack>

            <Stack gap="md">
              <Text fw={600} size="sm">
                Profile Photo (Optional)
              </Text>
              <Text size="xs" c="dimmed">
                A clean, professional photo helps clients trust you.
              </Text>
              <input
                ref={profilePicRef}
                type="file"
                accept={ACCEPT_IMAGES}
                style={{ display: 'none' }}
                onChange={handleProfilePicSelect}
              />
              <Group align="flex-start" gap="md">
                <Button
                  type="button"
                  variant="light"
                  color="crown"
                  leftSection={<IconPhotoPlus size={18} />}
                  loading={profileUploading}
                  onClick={() => {
                    setPendingUploadMode('profile')
                    profilePicRef.current?.click()
                  }}
                >
                  {form.values.profileImageUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
                </Button>

                {form.values.profileImageUrl && (
                  <Card withBorder radius="md" padding={4}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden' }}>
                      <Image src={form.values.profileImageUrl} fit="cover" width="100%" height="100%" />
                    </div>
                  </Card>
                )}
              </Group>
            </Stack>

            <Stack gap="lg">
              <Text fw={700}>Location Options</Text>

              <Stack gap={4}>
                <Checkbox label="Home Studio" {...form.getInputProps('homeStudio', { type: 'checkbox' })} />
                <TextInput
                  label="Home Studio Public Area (Optional)"
                  placeholder="Chapel Hill near UNC"
                  {...form.getInputProps('homeStudioPublicArea')}
                />
              </Stack>

              <Stack gap={4}>
                <Checkbox label="Mobile (Travels to Client)" {...form.getInputProps('mobile', { type: 'checkbox' })} />
                <TextInput
                  label="Mobile Service Area (Optional)"
                  placeholder="UNC + nearby"
                  {...form.getInputProps('mobileServiceAreaPublic')}
                />
              </Stack>
            </Stack>

            <Button type="submit" color="crown" radius="xl" loading={submitting} mt="md" size="md">
              Submit Application
            </Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  )
}

