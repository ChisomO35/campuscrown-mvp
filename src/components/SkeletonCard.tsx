import { Card, Group, Skeleton } from '@mantine/core'

export function SkeletonStyleCard() {
  return (
    <Card withBorder radius="lg" padding="xs" bg="white">
      <Card.Section>
        <Skeleton height={140} radius={0} />
      </Card.Section>
      <Skeleton height={14} mt="xs" width="80%" radius="sm" />
      <Skeleton height={12} mt={6} width="60%" radius="sm" />
      <Group mt="xs" gap="xs">
        <Skeleton height={24} width={56} radius="xl" />
        <Skeleton height={24} width={72} radius="xl" />
      </Group>
    </Card>
  )
}

export function SkeletonRow() {
  return (
    <Card withBorder radius="lg" padding="md" bg="white">
      <Group justify="space-between">
        <Skeleton height={18} width="60%" radius="sm" />
        <Skeleton height={24} width={72} radius="xl" />
      </Group>
      <Skeleton height={12} mt="xs" width="40%" radius="sm" />
    </Card>
  )
}
