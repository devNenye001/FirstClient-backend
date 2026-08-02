import { env } from '../../config/env.js'

type SearchInput = { country: string; state?: string; city?: string; category?: string }

function buildOverpassQuery(lat: number, lon: number, radius = 15000, category?: string) {
  // If category is restaurants, target common amenity values
  let clause = ''
  if (category && /restaurant|food|cafe|bar|pub|fast_food/i.test(category)) {
    clause = `node["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:${radius},${lat},${lon});`
  } else if (category && /shop|store|retail/i.test(category)) {
    clause = `node["shop"](around:${radius},${lat},${lon});`
  } else {
    clause = `node["amenity"](around:${radius},${lat},${lon}); node["shop"](around:${radius},${lat},${lon});`
  }

  return `
    [out:json][timeout:25];
    (
      ${clause}
    );
    out center tags;
  `
}

export class OverpassService {
  static async geocode(input: SearchInput) {
    const params = new URLSearchParams()
    params.set('format', 'json')
    params.set('limit', '1')
    if (input.city) params.set('city', input.city)
    if (input.state) params.set('state', input.state)
    if (input.country) params.set('country', input.country)

    const url = `${env.NOMINATIM_URL}?${params.toString()}`
    const res = await fetch(url, { headers: { 'User-Agent': env.NOMINATIM_USER_AGENT } })
    if (!res.ok) throw new Error(`Nominatim geocode failed: ${res.status}`)
    const data = await res.json()
    if (!data || data.length === 0) throw new Error('Location not found')
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) }
  }

  static async queryOverpass(lat: number, lon: number, category?: string) {
    const query = buildOverpassQuery(lat, lon, 15000, category)
    const body = new URLSearchParams({ data: query })
    const res = await fetch(env.OVERPASS_URL, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    if (!res.ok) throw new Error(`Overpass query failed: ${res.status}`)
    const json = await res.json()
    return json.elements || []
  }

  static async search(input: SearchInput) {
    const { lat, lon } = await this.geocode(input)
    const elements = await this.queryOverpass(lat, lon, input.category)

    return elements
      .map((el: any) => {
        const tags = el.tags || {}
        return {
          googlePlaceId: `osm:${el.type}:${el.id}`,
          name: tags.name || 'Unnamed Business',
          category: tags.amenity || tags.shop || 'Unknown',
          address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:postcode']]
            .filter(Boolean)
            .join(' '),
          phone: tags.phone || tags['contact:phone'] || undefined,
          email: tags.email || tags['contact:email'] || undefined,
          website: tags.website || tags['contact:website'] || undefined,
          websiteExists: Boolean(tags.website || tags['contact:website']),
          googleRating: undefined,
          reviewCount: undefined,
          openingHours: tags.opening_hours ? tags.opening_hours : undefined,
          photos: [],
          googleMapsUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          latitude: el.lat ?? (el.center && el.center.lat),
          longitude: el.lon ?? (el.center && el.center.lon),
        }
      })
      .filter((b: any) => b.name && b.latitude && b.longitude)
  }
}
