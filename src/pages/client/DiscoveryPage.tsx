import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Stack,
  Text,
  Title,
  ScrollArea,
  Group,
  TextInput,
  SegmentedControl,
  Button,
  ActionIcon,
  Box,
} from '@mantine/core'
import { IconSearch, IconStarFilled, IconChevronLeft, IconChevronRight, IconMap, IconList } from '@tabler/icons-react'
import { DiscoveryMap } from '../../components/DiscoveryMap'
import { listVerifiedStylistsUNC } from '../../services/stylists'
import { StylistProfileCard } from '../../components/StylistProfileCard'
import { ServiceCard } from '../../components/ServiceCard'
import type { Stylist, Service } from '../../services/types'

function startingPrice(s: Stylist) {
  const prices = (s.services ?? []).map((x) => x.price)
  if (!prices.length) return null
  return Math.min(...prices)
}

// Helper to determine categories for a stylist based on their services
function getStylistCategories(stylist: Stylist): Set<string> {
  const categories = new Set<string>()
  const text = (stylist.services ?? []).map(s => s.name.toLowerCase()).join(' ')

  if (text.includes('braid') || text.includes('box') || text.includes('cornrow')) categories.add('Braids')
  if (text.includes('twist') || text.includes('passion')) categories.add('Twists')
  if (text.includes('loc') || text.includes('dread') || text.includes('retwist')) categories.add('Locs')
  if (text.includes('knotless')) {
    categories.add('Knotless')
    categories.add('Braids') // Knotless is usually braids
  }

  return categories
}

export function DiscoveryPage() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [query, setQuery] = useState('')
  const [styleTab, setStyleTab] = useState('All')
  const [priceSort, setPriceSort] = useState<'asc' | null>(null)
  const [ratingFilter, setRatingFilter] = useState(false)

  const stylistViewport = useRef<HTMLDivElement>(null)
  const serviceViewport = useRef<HTMLDivElement>(null)

  const handleScroll = (viewport: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (viewport.current) {
      const scrollAmount = 300
      viewport.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  async function loadStylists() {
    setLoading(true)
    try {
      const res = await listVerifiedStylistsUNC()
      setStylists(res)
    } catch (e) {
      setStylists([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStylists()
  }, [])

  const filtered = useMemo(() => {
    let result = [...stylists]

    // Text search
    if (query.trim()) {
      const lowerQ = query.toLowerCase()
      result = result.filter((s) => {
        const nameMatch = s.name?.toLowerCase().includes(lowerQ)
        const serviceMatch = (s.services ?? []).some((svc) => svc.name.toLowerCase().includes(lowerQ))
        return nameMatch || serviceMatch
      })
    }

    // Category filter
    if (styleTab !== 'All') {
      result = result.filter((s) => {
        const cats = getStylistCategories(s)
        return cats.has(styleTab)
      })
    }

    // Rating filter
    if (ratingFilter) {
      result = result.filter((s) => s.ratingAvg >= 4.5)
    }

    // Price sort
    if (priceSort === 'asc') {
      result.sort((a, b) => {
        const priceA = startingPrice(a) ?? Infinity
        const priceB = startingPrice(b) ?? Infinity
        return priceA - priceB
      })
    }

    return result
  }, [stylists, query, styleTab, priceSort, ratingFilter])

  // Get all services with their stylist info (filtered)
  const allServices: Array<{ service: Service; stylist: Stylist }> = filtered.flatMap(stylist =>
    (stylist.services || []).map(service => ({ service, stylist }))
  )

  const ScrollControls = ({ viewport }: { viewport: React.RefObject<HTMLDivElement | null> }) => (
    <>
      <ActionIcon
        variant="default"
        radius="xl"
        size="lg"
        onClick={() => handleScroll(viewport, 'left')}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #eee',
        }}
      >
        <IconChevronLeft size={20} />
      </ActionIcon>
      <ActionIcon
        variant="default"
        radius="xl"
        size="lg"
        onClick={() => handleScroll(viewport, 'right')}
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #eee',
        }}
      >
        <IconChevronRight size={20} />
      </ActionIcon>
    </>
  )

  return (
    <Stack gap="lg">
      {/* Search Bar */}
      <TextInput
        leftSection={<IconSearch size={18} />}
        radius="xl"
        placeholder="Search styles, braids, twists…"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        styles={{
          input: {
            background: 'white',
            borderColor: 'transparent',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          },
        }}
        size="md"
      />

      {/* Filters */}
      <ScrollArea type="never" scrollbarSize={0} mx={-16} px={16}>
        <Group wrap="nowrap" gap="xs">
          <SegmentedControl
            value={styleTab}
            onChange={setStyleTab}
            data={['All', 'Braids', 'Twists', 'Locs', 'Knotless']}
            radius="xl"
            color="crown"
            bg="white"
            styles={{ root: { border: '1px solid #eee' } }}
          />

          <Button
            radius="xl"
            variant={priceSort === 'asc' ? 'filled' : 'default'}
            color="crown"
            size="xs"
            px="xs"
            onClick={() => setPriceSort(current => current === 'asc' ? null : 'asc')}
            style={{ border: priceSort === 'asc' ? undefined : '1px solid #eee' }}
          >
            Price ⬆
          </Button>

          <Button
            radius="xl"
            variant={ratingFilter ? 'filled' : 'default'}
            color="yellow"
            size="xs"
            px="xs"
            onClick={() => setRatingFilter(current => !current)}
            style={{ border: ratingFilter ? undefined : '1px solid #eee' }}
          >
            <Group gap={4} wrap="nowrap">
              <IconStarFilled size={14} />
              4.5+
            </Group>
          </Button>

          <SegmentedControl
            value={viewMode}
            onChange={(v) => setViewMode(v as 'list' | 'map')}
            size="xs"
            data={[
              { value: 'list', label: <Group gap={4} wrap="nowrap"><IconList size={14} /> List</Group> },
              { value: 'map', label: <Group gap={4} wrap="nowrap"><IconMap size={14} /> Map</Group> }
            ]}
            radius="xl"
            color="crown"
            bg="white"
            styles={{ root: { border: '1px solid #eee' } }}
          />
        </Group>
      </ScrollArea>

      {viewMode === 'map' ? (
        <Box mt="md">
          <DiscoveryMap stylists={filtered} />
        </Box>
      ) : (
        <>
          {/* Browse Stylists Section */}
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3} c="crown.9">Browse Stylists</Title>
              <Text size="sm" c="dimmed">
                {filtered.length} {filtered.length === 1 ? 'stylist' : 'stylists'}
              </Text>
            </Group>

            <Box pos="relative" mx={-16} px={16}>
              {filtered.length > 0 && <ScrollControls viewport={stylistViewport} />}
              <ScrollArea type="never" offsetScrollbars viewportRef={stylistViewport}>
                <Group wrap="nowrap" gap="md" py="xs" align="flex-start">
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ minWidth: 280, height: 280, background: '#f5f5f5', borderRadius: 16 }} />
                    ))
                  ) : filtered.length === 0 ? (
                    <Text c="dimmed">No stylists found</Text>
                  ) : (
                    filtered.map((stylist) => (
                      <div key={stylist.stylistId} style={{ minWidth: 280 }}>
                        <StylistProfileCard stylist={stylist} style={{ width: 280 }} />
                      </div>
                    ))
                  )}
                </Group>
              </ScrollArea>
            </Box>
          </Stack>

          {/* Browse Services Section */}
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3} c="crown.9">Browse Services</Title>
              <Text size="sm" c="dimmed">
                {allServices.length} {allServices.length === 1 ? 'service' : 'services'}
              </Text>
            </Group>

            <Box pos="relative" mx={-16} px={16}>
              {allServices.length > 0 && <ScrollControls viewport={serviceViewport} />}
              <ScrollArea type="never" offsetScrollbars viewportRef={serviceViewport}>
                <Group wrap="nowrap" gap="md" py="xs" align="flex-start">
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ minWidth: 280, height: 280, background: '#f5f5f5', borderRadius: 16 }} />
                    ))
                  ) : allServices.length === 0 ? (
                    <Text c="dimmed">No services found</Text>
                  ) : (
                    allServices.map(({ service, stylist }, idx) => (
                      <div key={`${stylist.stylistId}-${service.serviceId}-${idx}`} style={{ minWidth: 280 }}>
                        <ServiceCard service={service} stylist={stylist} />
                      </div>
                    ))
                  )}
                </Group>
              </ScrollArea>
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  )
}
