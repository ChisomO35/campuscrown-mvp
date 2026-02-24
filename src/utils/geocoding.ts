export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
    if (!query.trim()) return null;

    try {
        let q = query
        if (!q.toLowerCase().includes('nc') && !q.toLowerCase().includes('north carolina')) {
            q += ', NC'
        }

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!res.ok) throw new Error('Geocoding service unavailable')

        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            }
        }
        return null
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}

export function fuzzCoordinates(coords: { lat: number; lng: number }): { lat: number; lng: number } {
    // Offset by ~0.002 to 0.006 degrees (approx 200m to 600m)
    // Random direction for lat and lng
    const latOffset = (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.004)
    const lngOffset = (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.004)

    return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset,
    }
}
