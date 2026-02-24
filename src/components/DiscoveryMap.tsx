import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Stylist } from '../services/types'
import { Text, Group, Avatar, Button, Stack, Badge } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconStarFilled } from '@tabler/icons-react'

// Fix for default marker icons in React-Leaflet with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

type DiscoveryMapProps = {
    stylists: Stylist[]
}

const UNC_CENTER: [number, number] = [35.9049, -79.0469] // Approx center of UNC Chapel Hill


export function DiscoveryMap({ stylists }: DiscoveryMapProps) {
    // Filter stylists who have public coordinates
    const markers = stylists.filter(s => s.publicCoordinates)

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', zIndex: 0 }}>
            <MapContainer
                center={UNC_CENTER}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.map((stylist) => (
                    <Marker
                        key={stylist.stylistId}
                        position={[stylist.publicCoordinates!.lat, stylist.publicCoordinates!.lng]}
                    >
                        <Popup>
                            <div style={{ minWidth: 200 }}>
                                <Group wrap="nowrap" align="center" mb="xs">
                                    <Avatar src={stylist.profileImageUrl} size="lg" radius="xl" />
                                    <Stack gap={0}>
                                        <Text fw={700} size="sm">{stylist.name}</Text>
                                        <Group gap={4} wrap="nowrap">
                                            <IconStarFilled size={12} color="#fcc419" />
                                            <Text size="xs" fw={500}>
                                                {stylist.ratingAvg.toFixed(1)} <Text span c="dimmed" size="xs">({stylist.ratingCount})</Text>
                                            </Text>
                                        </Group>
                                        {stylist.publicLocationLabel && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {stylist.publicLocationLabel}
                                            </Text>
                                        )}
                                    </Stack>
                                </Group>

                                <Group gap={4} mb="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
                                    {(stylist.services || []).slice(0, 2).map(s => (
                                        <Badge key={s.serviceId} size="xs" variant="light" color="crown" radius="sm">
                                            {s.name}
                                        </Badge>
                                    ))}
                                    {(stylist.services || []).length > 2 && (
                                        <Badge size="xs" variant="light" color="gray" radius="sm">
                                            +{(stylist.services || []).length - 2}
                                        </Badge>
                                    )}
                                </Group>

                                <Button
                                    component={Link}
                                    to={`/s/${stylist.stylistId}`}
                                    size="xs"
                                    fullWidth
                                    variant="filled"
                                    color="crown"
                                    radius="md"
                                >
                                    View Profile
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
