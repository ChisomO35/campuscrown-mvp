import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Group,
  NumberInput,
  RangeSlider,
  Image,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  ActionIcon,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPhotoPlus, IconTrash } from '@tabler/icons-react'
import { doc, updateDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import { db } from '../../services/firebase'
import { uploadImage } from '../../services/cloudinary'
import { getStylist } from '../../services/stylists'
import type { Availability, Service, Stylist } from '../../services/types'
import { getAvailability, saveAvailability } from '../../services/availability'
import { decimalToLabel, decimalToTime, timeToDecimal } from '../../utils/time'
import { geocodeLocation, fuzzCoordinates } from '../../utils/geocoding'

const days: { key: keyof Availability['weeklyRules']; label: string }[] = [
  { key: 'sun', label: 'Sunday' },
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
]

type TimeBlock = {
  id: string
  start: string
  end: string
}

type DayState = {
  enabled: boolean
  blocks: TimeBlock[]
}

type FormValues = {
  name: string
  homeStudio: boolean
  mobile: boolean
  homeStudioAddress: string // Private
  publicLocationLabel: string // Public
  mobileServiceAreaPublic: string
  services: Service[]
  bio: string
  profileImageUrl: string
}

export function StylistProfileEditPage() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [_stylist, setStylist] = useState<Stylist | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [dayState, setDayState] = useState<Record<string, DayState>>({
    sun: { enabled: false, blocks: [] },
    mon: { enabled: false, blocks: [] },
    tue: { enabled: false, blocks: [] },
    wed: { enabled: false, blocks: [] },
    thu: { enabled: false, blocks: [] },
    fri: { enabled: false, blocks: [] },
    sat: { enabled: true, blocks: [{ id: 'init_sat', start: '09:00', end: '17:00' }] },
  })

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      homeStudio: true,
      mobile: false,
      homeStudioAddress: '',
      publicLocationLabel: '',
      mobileServiceAreaPublic: '',
      services: [],
      bio: '',
      profileImageUrl: '',
    },
  })

  const [uploadingSvcId, setUploadingSvcId] = useState<string | null>(null)
  const [pendingSvcId, setPendingSvcId] = useState<string | null>(null)
  const svcFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!appUser) return
        try {
          const s = await getStylist(appUser.uid)
          if (!mounted) return
          setStylist(s)
          if (s) {
            form.setValues({
              name: s.name,
              homeStudio: (s.locationOptions ?? []).includes('home_studio'),
              mobile: (s.locationOptions ?? []).includes('mobile'),
              homeStudioAddress: s.homeStudioAddress ?? '',
              publicLocationLabel: s.publicLocationLabel ?? (s as any).homeStudioPublicArea ?? '',
              mobileServiceAreaPublic: s.mobileServiceAreaPublic ?? '',
              services: (s.services ?? []).map((svc) => ({
                ...svc,
                requiresDeposit: svc.requiresDeposit ?? (svc.depositAmount ?? 0) > 0,
              })),
              bio: s.bio ?? '',
              profileImageUrl: s.profileImageUrl ?? '',
            })
          } else {
            form.setValues({
              name: appUser.displayName ?? '',
              homeStudio: true,
              mobile: false,
              homeStudioAddress: '',
              publicLocationLabel: '',
              mobileServiceAreaPublic: '',
              services: [],
              bio: '',
            })
          }
        } catch (err) {
          console.error('Error loading stylist info:', err)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid])

  // Load availability for this stylist so it can be edited inline.
  useEffect(() => {
    let mounted = true
      ; (async () => {
        if (!appUser) return
        setAvailabilityLoading(true)
        try {
          const av = await getAvailability(appUser.uid)
          if (!mounted) return
          const next: Record<string, DayState> = { ...dayState }
          for (const d of days) {
            const rules = av.weeklyRules[d.key] ?? []
            if (rules.length > 0) {
              next[d.key] = {
                enabled: true,
                blocks: rules.map((r, i) => ({
                  id: `${d.key}_${i}_${Date.now()}`,
                  start: r.start,
                  end: r.end,
                })),
              }
            } else {
              next[d.key] = { enabled: false, blocks: [] }
            }
          }
          setDayState(next)
        } catch (err) {
          console.error('Error loading availability:', err)
        } finally {
          if (mounted) {
            setAvailabilityLoading(false)
          }
        }
      })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid])

  if (!appUser) return null

  async function handleServiceFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    const targetId = pendingSvcId
    if (!files?.length || !targetId) {
      setPendingSvcId(null)
      return
    }

    setUploadingSvcId(targetId)
    try {
      if (targetId === 'profile_photo') {
        const { secure_url } = await uploadImage(files[0])
        form.setFieldValue('profileImageUrl', secure_url)
        return
      }

      const index = form.values.services.findIndex((s) => s.serviceId === targetId)
      if (index === -1) return

      const existingUrls = form.values.services[index].imageUrls ?? []
      const remaining = 10 - existingUrls.length
      if (remaining <= 0) {
        notifications.show({ color: 'yellow', message: 'Max 10 photos per service.' })
        e.target.value = ''
        return
      }

      const toUpload = Array.from(files).slice(0, remaining)
      const newUrls = [...existingUrls]
      for (const file of toUpload) {
        const { secure_url } = await uploadImage(file)
        newUrls.push(secure_url)
      }
      form.setFieldValue(`services.${index}.imageUrls`, newUrls)
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Upload failed',
        message: err.message || 'Could not upload images.',
      })
    } finally {
      setUploadingSvcId(null)
      setPendingSvcId(null)
      e.target.value = ''
    }
  }

  function removeServiceImage(svcIndex: number, imgIndex: number) {
    const current = [...(form.values.services[svcIndex].imageUrls ?? [])]
    current.splice(imgIndex, 1)
    form.setFieldValue(`services.${svcIndex}.imageUrls`, current)
  }

  function addService() {
    form.insertListItem('services', {
      serviceId: `svc_${Date.now()}`,
      name: '',
      price: 0,
      hairIncluded: false,
      durationMins: 120,
      requiresDeposit: false,
      depositAmount: 0,
      imageUrls: [],
    })
  }

  function removeService(index: number) {
    form.removeListItem('services', index)
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={3} c="crown.9">
          Edit Stylist Profile
        </Title>
        <Button
          component={Link}
          to={`/s/${appUser.uid}`}
          variant="light"
          color="crown"
          radius="xl"
        >
          View Public Profile
        </Button>
      </Group>

      {loading ? (
        <Text c="dimmed">Loading profile…</Text>
      ) : (
        <>
          {_stylist && !_stylist.setupComplete && (
            <Card withBorder radius="lg" bg="blue.0" c="blue.9" padding="lg" mb="lg">
              <Stack gap="xs">
                <Text fw={700}>Complete your profile setup</Text>
                <Text size="sm">
                  Your account is approved, but your profile isn't public yet. Add your details, photos, and a profile picture below to go live on the UNC discovery page.
                </Text>
              </Stack>
            </Card>
          )}
          <Card withBorder radius="40px" bg="white" padding="xl">
            <Stack gap="md">
              <input
                ref={svcFileRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleServiceFileSelect}
              />

              <Stack gap="xs" align="center" mb="md">
                <Text fw={600} size="sm">Profile Photo</Text>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#eee',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setPendingSvcId('profile_photo')
                    svcFileRef.current?.click()
                  }}
                >
                  {form.values.profileImageUrl ? (
                    <Image src={form.values.profileImageUrl} fit="cover" width="100%" height="100%" />
                  ) : (
                    <Stack gap={4} align="center" justify="center" h="100%">
                      <IconPhotoPlus size={32} color="#999" />
                      <Text size="xs" c="dimmed">Upload</Text>
                    </Stack>
                  )}
                  {uploadingSvcId === 'profile_photo' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text size="xs">Uploading…</Text>
                    </div>
                  )}
                </div>
              </Stack>
              <TextInput
                label="Display name"
                description="How clients see your name on Campus Crown."
                {...form.getInputProps('name')}
              />

              <Text fw={600} size="sm">
                Location Options
              </Text>
              <Group gap="md">
                <Checkbox
                  label="Home Studio"
                  checked={form.values.homeStudio}
                  onChange={(e) => form.setFieldValue('homeStudio', e.currentTarget.checked)}
                />
                <Checkbox
                  label="Mobile (Travels to Client)"
                  checked={form.values.mobile}
                  onChange={(e) => form.setFieldValue('mobile', e.currentTarget.checked)}
                />
              </Group>

              {form.values.homeStudio && (
                <>
                  <TextInput
                    label="Exact Home Studio Address (Private)"
                    description="Only shared with clients after a confirmed booking."
                    placeholder="123 Franklin St, Chapel Hill, NC"
                    mb="xs"
                    {...form.getInputProps('homeStudioAddress')}
                  />
                  <TextInput
                    label="Public Area Label"
                    placeholder="Near Student Union"
                    description="Shown on your public map profile."
                    mb="md"
                    {...form.getInputProps('publicLocationLabel')}
                  />
                </>
              )}
              <TextInput
                label="Mobile Service Area (Optional)"
                placeholder="UNC + nearby"
                {...form.getInputProps('mobileServiceAreaPublic')}
              />

              <Textarea
                label="Bio"
                description="Tell clients about yourself, your style, and any specific policies."
                placeholder="Hi, I'm... and I specialize in..."
                minRows={3}
                autosize
                {...form.getInputProps('bio')}
              />
            </Stack>
          </Card>

          <Card withBorder radius="40px" bg="white" padding="xl">
            <Group justify="space-between" mb="lg">
              <Stack gap={0}>
                <Text fw={700}>Services</Text>
                <Text size="sm" c="dimmed">
                  List the main services you offer with clear pricing.
                </Text>
              </Stack>
              <Button variant="light" color="crown" radius="xl" onClick={addService}>
                Add Service
              </Button>
            </Group>

            <Stack gap="lg">
              {form.values.services.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No services yet. Add at least one so clients know what you offer.
                </Text>
              ) : (
                form.values.services.map((svc, index) => (
                  <Card key={svc.serviceId || index} withBorder radius="md" padding="lg" bg="#faf7fd">
                    <Group justify="space-between" mb="md">
                      <Text fw={600}>Service {index + 1}</Text>
                      <Button
                        variant="subtle"
                        color="red"
                        radius="xl"
                        size="xs"
                        onClick={() => removeService(index)}
                      >
                        Remove
                      </Button>
                    </Group>
                    <Stack gap="md">
                      <TextInput
                        label="Name"
                        placeholder="Box braids"
                        value={svc.name}
                        onChange={(e) =>
                          form.setFieldValue(`services.${index}.name`, e.currentTarget.value)
                        }
                      />
                      <Group grow>
                        <NumberInput
                          label="Price ($)"
                          value={svc.price}
                          min={0}
                          step={5}
                          onChange={(v) =>
                            form.setFieldValue(`services.${index}.price`, Number(v) || 0)
                          }
                        />
                        <NumberInput
                          label="Duration (minutes)"
                          value={svc.durationMins}
                          min={30}
                          max={600}
                          step={15}
                          onChange={(v) =>
                            form.setFieldValue(
                              `services.${index}.durationMins`,
                              Number(v) || 60,
                            )
                          }
                        />
                      </Group>

                      <Group gap="xl">
                        <Checkbox
                          label="Requires deposit"
                          checked={svc.requiresDeposit}
                          onChange={(e) => {
                            const checked = e.currentTarget.checked
                            form.setFieldValue(`services.${index}.requiresDeposit`, checked)
                            if (!checked) {
                              form.setFieldValue(`services.${index}.depositAmount`, 0)
                            }
                          }}
                        />
                        {svc.requiresDeposit && (
                          <NumberInput
                            label="Deposit Amount ($)"
                            value={svc.depositAmount ?? 0}
                            min={0}
                            step={5}
                            onChange={(v) =>
                              form.setFieldValue(`services.${index}.depositAmount`, Number(v) || 0)
                            }
                            w={150}
                          />
                        )}
                      </Group>
                      <Checkbox
                        label="Hair included"
                        checked={svc.hairIncluded}
                        onChange={(e) =>
                          form.setFieldValue(
                            `services.${index}.hairIncluded`,
                            e.currentTarget.checked,
                          )
                        }
                      />

                      <Stack gap="xs">
                        <Text fw={600} size="sm">
                          Service Photos (Max 10)
                        </Text>
                        <Group gap="xs">
                          {(svc.imageUrls ?? []).map((url, imgIdx) => (
                            <div
                              key={url + imgIdx}
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 8,
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <Image src={url} fit="cover" width="100%" height="100%" />
                              <ActionIcon
                                variant="filled"
                                color="red"
                                size="xs"
                                style={{ position: 'absolute', top: 4, right: 4 }}
                                onClick={() => removeServiceImage(index, imgIdx)}
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </div>
                          ))}
                          {(svc.imageUrls ?? []).length < 10 && (
                            <Button
                              variant="light"
                              color="crown"
                              size="xs"
                              radius="md"
                              h={80}
                              w={80}
                              onClick={() => {
                                setPendingSvcId(svc.serviceId)
                                svcFileRef.current?.click()
                              }}
                              loading={uploadingSvcId === svc.serviceId}
                            >
                              <Stack gap={4} align="center">
                                <IconPhotoPlus size={18} />
                                <Text size="10px">Add</Text>
                              </Stack>
                            </Button>
                          )}
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          </Card>

          <Card withBorder radius="40px" bg="white" padding="xl">
            <Title order={4} c="crown.9" mb="sm">
              Availability
            </Title>
            <Text c="dimmed" size="sm" mb="sm">
              Set weekly days and one time block per day.
            </Text>

            {availabilityLoading ? (
              <Stack gap="sm" mt="md">
                <Text size="sm" c="dimmed">
                  Loading availability…
                </Text>
              </Stack>
            ) : (
              <Stack gap="sm" mt="lg">
                {days.map((d) => {
                  const s = dayState[d.key]
                  return (
                    <Card key={d.key} withBorder radius="md" bg="#faf7fd" padding="lg">
                      <Group justify="space-between" align="center" mb="xs">
                        <Checkbox
                          label={d.label}
                          checked={s.enabled}
                          onChange={(e) => {
                            const checked = e.currentTarget.checked
                            setDayState((prev) => {
                              const existingBlocks = prev[d.key].blocks
                              // If enabling and no blocks exist, add a default one
                              let newBlocks = existingBlocks
                              if (checked && existingBlocks.length === 0) {
                                newBlocks = [{ id: `${d.key}_init_${Date.now()}`, start: '09:00', end: '17:00' }]
                              }
                              return {
                                ...prev,
                                [d.key]: {
                                  ...prev[d.key],
                                  enabled: checked,
                                  blocks: newBlocks,
                                },
                              }
                            })
                          }}
                        />
                        {s.enabled && (
                          <Button
                            variant="subtle"
                            size="xs"
                            color="crown"
                            onClick={() => {
                              setDayState((prev) => ({
                                ...prev,
                                [d.key]: {
                                  ...prev[d.key],
                                  blocks: [
                                    ...prev[d.key].blocks,
                                    {
                                      id: `${d.key}_${Date.now()}`,
                                      start: '09:00',
                                      end: '17:00',
                                    },
                                  ],
                                },
                              }))
                            }}
                          >
                            + Add block
                          </Button>
                        )}
                      </Group>

                      {s.enabled && (
                        <Stack gap="xs">
                          {s.blocks.map((block, index) => (
                            <Group key={block.id} align="center">
                              <Stack gap={0} flex={1}>
                                <Text size="xs" c="dimmed" mb={4}>
                                  {decimalToLabel(timeToDecimal(block.start))} –{' '}
                                  {decimalToLabel(timeToDecimal(block.end))}
                                </Text>
                                <RangeSlider
                                  min={0}
                                  max={24}
                                  step={0.5}
                                  minRange={1}
                                  label={null}
                                  value={[timeToDecimal(block.start), timeToDecimal(block.end)]}
                                  onChange={(val) => {
                                    const [start, end] = val
                                    setDayState((prev) => {
                                      const newBlocks = [...prev[d.key].blocks]
                                      newBlocks[index] = {
                                        ...newBlocks[index],
                                        start: decimalToTime(start),
                                        end: decimalToTime(end),
                                      }
                                      return {
                                        ...prev,
                                        [d.key]: {
                                          ...prev[d.key],
                                          blocks: newBlocks,
                                        },
                                      }
                                    })
                                  }}
                                  color="crown"
                                />
                              </Stack>
                              <Button
                                variant="action"
                                color="red"
                                size="xs"
                                radius="xl"
                                onClick={() => {
                                  setDayState((prev) => {
                                    const newBlocks = prev[d.key].blocks.filter((b) => b.id !== block.id)
                                    return {
                                      ...prev,
                                      [d.key]: {
                                        ...prev[d.key],
                                        blocks: newBlocks,
                                        // If last block removed, optional: disable day or keep enabled with empty blocks?
                                        // Keeping enabled allows adding new blocks easily.
                                      },
                                    }
                                  })
                                }}
                              >
                                X
                              </Button>
                            </Group>
                          ))}
                          {s.blocks.length === 0 && (
                            <Text size="sm" c="dimmed" fs="italic">
                              No time blocks set.
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Card>

          <Group justify="flex-end">
            <Button
              color="crown"
              radius="xl"
              loading={saving}
              onClick={async () => {
                try {
                  setSaving(true)
                  const values = form.values
                  const locationOptions: ('home_studio' | 'mobile')[] = []
                  if (values.homeStudio) locationOptions.push('home_studio')
                  if (values.mobile) locationOptions.push('mobile')

                  let exactCoordinates = null
                  let publicCoordinates = null

                  if (values.homeStudio && values.homeStudioAddress) {
                    exactCoordinates = await geocodeLocation(values.homeStudioAddress)
                    if (exactCoordinates) {
                      publicCoordinates = fuzzCoordinates(exactCoordinates)
                    }
                  } else if (values.mobile && values.mobileServiceAreaPublic) {
                    const areaCoords = await geocodeLocation(values.mobileServiceAreaPublic)
                    if (areaCoords) {
                      publicCoordinates = fuzzCoordinates(areaCoords)
                    }
                  }

                  await updateDoc(doc(db, 'stylists', appUser.uid), {
                    userId: appUser.uid,
                    name: values.name || appUser.displayName || 'Stylist',
                    campus: 'UNC',
                    locationOptions,
                    homeStudioAddress: values.homeStudioAddress || null,
                    publicLocationLabel: values.publicLocationLabel || null,
                    exactCoordinates: exactCoordinates || null,
                    publicCoordinates: publicCoordinates || null,
                    mobileServiceAreaPublic: values.mobileServiceAreaPublic || null,
                    homeStudioPublicArea: null,
                    services: values.services,
                    bio: values.bio,
                    profileImageUrl: values.profileImageUrl || null,
                    setupComplete: true,
                  } as Record<string, unknown>)

                  // Save availability alongside profile.
                  const weeklyRules: Availability['weeklyRules'] = {
                    sun: [],
                    mon: [],
                    tue: [],
                    wed: [],
                    thu: [],
                    fri: [],
                    sat: [],
                  }
                  for (const d of days) {
                    const s = dayState[d.key]
                    weeklyRules[d.key] = s.enabled
                      ? s.blocks.map((b) => ({ start: b.start, end: b.end }))
                      : []
                  }
                  await saveAvailability({
                    stylistId: appUser.uid,
                    weeklyRules,
                  })

                  notifications.show({
                    color: 'crown',
                    title: 'Profile saved',
                    message: 'Your stylist profile and availability have been updated.',
                  })
                } catch (e: any) {
                  notifications.show({
                    color: 'red',
                    title: 'Could not save',
                    message: e?.message ?? 'Please try again.',
                  })
                } finally {
                  setSaving(false)
                }
              }}
            >
              Save Profile
            </Button>
          </Group>
        </>
      )
      }
    </Stack >
  )
}

