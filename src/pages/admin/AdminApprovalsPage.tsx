import { useEffect, useState } from 'react'
import { Badge, Button, Card, Group, Image, PasswordInput, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { SkeletonRow } from '../../components/SkeletonCard'
import { useAuth } from '../../providers/AuthProvider'
import { listPendingApplications, setApplicationStatus } from '../../services/applications'
import { db } from '../../services/firebase'
import type { StylistApplication } from '../../services/types'

export function AdminApprovalsPage() {
  const { appUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<StylistApplication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? 'dev-admin'

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await listPendingApplications()
      setApps(res)
    } catch (e: any) {
      console.error('Failed to list applications:', e)
      setError(e?.message ?? 'Could not load applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (!unlocked) {
    return (
      <Stack gap="md">
        <Title order={3} c="crown.9">
          Admin access
        </Title>
        <Card withBorder radius="lg" padding="lg" bg="white">
          <Stack>
            <PasswordInput
              label="Admin password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Button
              color="crown"
              radius="xl"
              onClick={() => {
                if (password === adminPassword) {
                  setUnlocked(true)
                } else {
                  // Light feedback without using notifications to keep it simple
                  // (the user can always refresh and try again)
                }
              }}
            >
              Enter
            </Button>
            <Text size="xs" c="dimmed">
              For internal use only.
            </Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3} c="crown.9">
          Admin approvals
        </Title>
        <Button variant="light" color="crown" radius="xl" onClick={refresh}>
          Refresh
        </Button>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Stack>
      ) : error ? (
        <Card withBorder radius="lg" bg="red.0" padding="lg">
          <Stack gap="xs">
            <Text fw={700} c="red.9">
              Error Loading Applications
            </Text>
            <Text size="sm" c="red.8">
              {error}
            </Text>
          </Stack>
        </Card>
      ) : apps.length === 0 ? (
        <Card withBorder radius="lg" bg="white" padding="lg">
          <Text c="dimmed">No pending applications.</Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {apps.map((a) => (
            <Card key={a.applicationId} withBorder radius="lg" bg="white" padding="lg">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap="xs" maw="70%">
                  <Text fw={800}>{a.fullName}</Text>
                  {a.phone && (
                    <Text size="sm" c="dimmed">
                      Phone: {a.phone}
                    </Text>
                  )}
                  <Text size="sm" c="dimmed">
                    Location options:{' '}
                    {(a.locationOptions ?? [])
                      .map((x) => (x === 'home_studio' ? 'Home studio' : 'Mobile'))
                      .join(', ') || '—'}
                  </Text>
                  {a.homeStudioPublicArea && (
                    <Text size="sm" c="dimmed">
                      Home studio area: {a.homeStudioPublicArea}
                    </Text>
                  )}
                  {a.mobileServiceAreaPublic && (
                    <Text size="sm" c="dimmed">
                      Mobile area: {a.mobileServiceAreaPublic}
                    </Text>
                  )}

                  {a.governmentIdUrl && (
                    <Stack gap={4} mt="xs">
                      <Text size="xs" fw={700} c="crown.7">
                        GOVERNMENT ID (VERIFICATION ONLY):
                      </Text>
                      <Card
                        withBorder
                        radius="md"
                        padding={4}
                        component="a"
                        href={a.governmentIdUrl}
                        target="_blank"
                      >
                        <div
                          style={{
                            width: 200,
                            height: 120,
                            borderRadius: 8,
                            overflow: 'hidden',
                          }}
                        >
                          <Image src={a.governmentIdUrl} fit="cover" width="100%" height="100%" />
                        </div>
                        <Text size="xs" ta="center" mt={4} c="dimmed">
                          Click to view full ID
                        </Text>
                      </Card>
                    </Stack>
                  )}

                  {(a.portfolioImageUrls?.length ?? 0) > 0 && (
                    <Stack gap={4} mt="xs">
                      <Text size="xs" fw={700}>PORTFOLIO:</Text>
                      <Group gap={8}>
                        {(a.portfolioImageUrls ?? []).slice(0, 3).map((url) => (
                          <div
                            key={url}
                            style={{
                              width: 140,
                              height: 140,
                              borderRadius: 16,
                              overflow: 'hidden',
                            }}
                          >
                            <Image src={url} fit="cover" width="100%" height="100%" />
                          </div>
                        ))}
                        {a.portfolioImageUrls && a.portfolioImageUrls.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{a.portfolioImageUrls.length - 3} more
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  )}
                </Stack>

                <Group gap="xs">
                  <Button
                    color="crown"
                    radius="xl"
                    loading={actionId === a.applicationId}
                    onClick={async () => {
                      try {
                        setActionId(a.applicationId)
                        const reviewerId = appUser?.uid ?? 'manual'
                        // 1) Approve application
                        await setApplicationStatus(a.applicationId, 'approved', reviewerId)

                        // 2) Promote user role to stylist
                        await updateDoc(doc(db, 'users', a.userId), {
                          role: 'stylist',
                          updatedAt: serverTimestamp(),
                        })

                        // 3) Create stylist profile doc (id == userId for simplicity)
                        await setDoc(
                          doc(db, 'stylists', a.userId),
                          {
                            userId: a.userId,
                            name: a.fullName,
                            campus: 'UNC',
                            verified: true,
                            portfolioImageUrls: a.portfolioImageUrls ?? [],
                            locationOptions: a.locationOptions ?? ['home_studio'],
                            publicLocationLabel: a.homeStudioPublicArea ?? null,
                            mobileServiceAreaPublic: a.mobileServiceAreaPublic ?? null,
                            ratingAvg: 0,
                            ratingCount: 0,
                            profileImageUrl: a.profileImageUrl ?? null,
                            services: [
                              {
                                serviceId: 'svc_box_braids',
                                name: 'Box braids',
                                price: 150,
                                hairIncluded: false,
                                durationMins: 240,
                                requiresDeposit: false,
                                depositAmount: 0,
                              },
                            ],
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                            setupComplete: false,
                          },
                          { merge: true },
                        )

                        notifications.show({
                          color: 'crown',
                          title: 'Approved',
                          message: `${a.fullName} is now a verified stylist.`,
                        })
                        await refresh()
                      } catch (e: any) {
                        notifications.show({ color: 'red', title: 'Could not approve', message: e?.message ?? 'Try again.' })
                      } finally {
                        setActionId(null)
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    radius="xl"
                    loading={actionId === a.applicationId}
                    onClick={async () => {
                      try {
                        setActionId(a.applicationId)
                        const reviewerId = appUser?.uid ?? 'manual'
                        const reason = window.prompt(
                          `Why are you rejecting ${a.fullName}?`,
                          'Portfolio does not yet meet Campus Crown standards.',
                        )

                        if (reason == null || reason.trim() === '') {
                          setActionId(null)
                          return
                        }

                        await setApplicationStatus(a.applicationId, 'rejected', reviewerId, reason.trim())
                        notifications.show({ color: 'red', title: 'Rejected', message: `${a.fullName} rejected.` })
                        await refresh()
                      } catch (e: any) {
                        notifications.show({ color: 'red', title: 'Could not reject', message: e?.message ?? 'Try again.' })
                      } finally {
                        setActionId(null)
                      }
                    }}
                  >
                    Reject
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Group justify="space-between" mt="xl">
        <Title order={3} c="crown.9">
          Setup pending
        </Title>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <SkeletonRow />
        </Stack>
      ) : apps.filter(a => a.status === 'approved').length === 0 ? (
        <Card withBorder radius="lg" bg="white" padding="lg">
          <Text size="sm" c="dimmed">No approved stylists currently setting up.</Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {apps.filter(a => a.status === 'approved').map((a) => (
            <Card key={a.applicationId} withBorder radius="lg" bg="white" padding="lg">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text fw={700}>{a.fullName}</Text>
                  <Text size="xs" c="dimmed">Waiting for profile update & photos</Text>
                </Stack>
                <Badge variant="dot" color="yellow">Setup Pending</Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

