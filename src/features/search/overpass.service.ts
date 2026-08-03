import { env } from '../../config/env.js'
import { SearchError } from '../../utils/http.js'


type SearchInput = { country: string; state?: string; city?: string; category?: string }

function buildOverpassQuery(lat: number, lon: number, radius = 15000, category?: string) {
  let clause = ''
  if (category) {
    const norm = category.toLowerCase().trim()
    switch (norm) {
      case 'restaurants':
      case 'restaurant':
        clause = `nwr["amenity"="restaurant"](around:${radius},${lat},${lon});`
        break
      case 'cafes':
      case 'cafe':
        clause = `nwr["amenity"="cafe"](around:${radius},${lat},${lon});`
        break
      case 'hotels':
      case 'hotel':
        clause = `nwr["tourism"="hotel"](around:${radius},${lat},${lon});`
        break
      case 'salons':
      case 'salon':
        clause = `nwr["shop"="hairdresser"](around:${radius},${lat},${lon});`
        break
      case 'barbershops':
      case 'barbershop':
        clause = `nwr["shop"="barber"](around:${radius},${lat},${lon});`
        break
      case 'bakeries':
      case 'bakery':
        clause = `nwr["shop"="bakery"](around:${radius},${lat},${lon});`
        break
      case 'pharmacies':
      case 'pharmacy':
        clause = `nwr["amenity"="pharmacy"](around:${radius},${lat},${lon});`
        break
      case 'schools':
      case 'school':
        clause = `nwr["amenity"="school"](around:${radius},${lat},${lon});`
        break
      case 'hospitals':
      case 'hospital':
        clause = `nwr["amenity"="hospital"](around:${radius},${lat},${lon});`
        break
      case 'gyms':
      case 'gym':
        clause = `nwr["leisure"="fitness_centre"](around:${radius},${lat},${lon});`
        break
      case 'real estate agencies':
      case 'real estate':
      case 'real-estate':
        clause = `nwr["office"="estate_agent"](around:${radius},${lat},${lon});`
        break
      case 'supermarkets':
      case 'supermarket':
        clause = `nwr["shop"="supermarket"](around:${radius},${lat},${lon});`
        break
      case 'electronics stores':
      case 'electronics':
      case 'electronics-stores':
        clause = `nwr["shop"="electronics"](around:${radius},${lat},${lon});`
        break
      case 'boutiques':
      case 'boutique':
        clause = `nwr["shop"="boutique"](around:${radius},${lat},${lon});`
        break
      case 'auto repair shops':
      case 'auto-repair':
      case 'auto repair':
        clause = `nwr["shop"="car_repair"](around:${radius},${lat},${lon});`
        break
      case 'dentists':
      case 'dentist':
        clause = `nwr["amenity"="dentist"](around:${radius},${lat},${lon});`
        break
      case 'law firms':
      case 'lawyer':
      case 'law-firms':
        clause = `nwr["office"="lawyer"](around:${radius},${lat},${lon});`
        break
      case 'accounting firms':
      case 'accountant':
      case 'accounting-firms':
        clause = `nwr["office"="accountant"](around:${radius},${lat},${lon});`
        break
      case 'beauty spas':
      case 'spa':
      case 'beauty-spas':
        clause = `nwr["amenity"="spa"](around:${radius},${lat},${lon}); nwr["shop"="beauty"](around:${radius},${lat},${lon});`
        break
      case 'pet stores':
      case 'pet-stores':
        clause = `nwr["shop"="pet"](around:${radius},${lat},${lon});`
        break
      default:
        clause = `nwr["amenity"~"${norm}"](around:${radius},${lat},${lon}); nwr["shop"~"${norm}"](around:${radius},${lat},${lon});`
        break
    }
  } else {
    clause = `nwr["amenity"](around:${radius},${lat},${lon}); nwr["shop"](around:${radius},${lat},${lon});`
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
  private static geocodeCache = new Map<string, { lat: number; lon: number }>()

  static async geocode(input: SearchInput) {
    const cacheKey = `${input.country}:${input.state || ''}:${input.city || ''}`.toLowerCase()
    if (this.geocodeCache.has(cacheKey)) {
      console.log('Using cached coordinates for:', cacheKey)
      return this.geocodeCache.get(cacheKey)!
    }

    const params = new URLSearchParams()
    params.set('format', 'json')
    params.set('limit', '1')
    if (input.city) params.set('city', input.city)
    if (input.state) params.set('state', input.state)
    if (input.country) params.set('country', input.country)

    const url = `${env.NOMINATIM_URL}?${params.toString()}`
    
    console.log('\nIncoming Request\n↓\nReceived Query Parameters:', input)
    console.log('↓\nCalling Nominatim')
    console.log('URL:', url)

    try {
      const res = await fetch(url, { headers: { 'User-Agent': env.NOMINATIM_USER_AGENT } })
      console.log('Nominatim Response')
      console.log('Status Code:', res.status)
      
      const bodyText = await res.text()
      console.log('Response Body:', bodyText)

      if (!res.ok) {
        throw new SearchError(
          'Calling Nominatim',
          `Nominatim HTTP error: ${res.status}`,
          bodyText
        )
      }

      let data
      try {
        data = JSON.parse(bodyText)
      } catch (e: any) {
        throw new SearchError(
          'Calling Nominatim',
          'Failed to parse Nominatim response as JSON',
          bodyText
        )
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new SearchError(
          'Calling Nominatim',
          `Location not found: ${input.city}, ${input.country}`,
          bodyText
        )
      }

      const coords = { lat: Number(data[0].lat), lon: Number(data[0].lon) }
      this.geocodeCache.set(cacheKey, coords)
      return coords
    } catch (err: any) {
      if (err instanceof SearchError) throw err
      throw new SearchError('Calling Nominatim', err.message, err.stack)
    }
  }

  static async queryOverpass(lat: number, lon: number, category?: string) {
    const query = buildOverpassQuery(lat, lon, 5000, category)
    console.log('↓\nGenerated Overpass Query:')
    console.log(query)

    const body = new URLSearchParams({ data: query })
    const requestBody = body.toString()
    console.log('↓\nCalling Overpass API')
    console.log('URL:', env.OVERPASS_URL)
    console.log('Request Body:', requestBody)

    try {
      const res = await fetch(env.OVERPASS_URL, {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': env.NOMINATIM_USER_AGENT
        }
      })

      console.log('Overpass Response')
      console.log('Status Code:', res.status)

      const bodyText = await res.text()
      console.log('Response Body Snippet:', bodyText.substring(0, 1000))

      if (!res.ok) {
        throw new SearchError(
          'Calling Overpass API',
          `Overpass query failed with HTTP status ${res.status}`,
          bodyText
        )
      }

      let json
      try {
        json = JSON.parse(bodyText)
      } catch (e: any) {
        throw new SearchError(
          'Calling Overpass API',
          'Failed to parse Overpass response as JSON',
          bodyText
        )
      }

      return json.elements || []
    } catch (err: any) {
      if (err instanceof SearchError) throw err
      throw new SearchError('Calling Overpass API', err.message, err.stack)
    }
  }

  static async search(input: SearchInput) {
    console.log('↓\nValidating parameters')
    if (!input.city || !input.country || !input.category) {
      throw new SearchError(
        'Validation',
        'Missing query parameters: city, country, and category are required'
      )
    }

    const { lat, lon } = await this.geocode(input)
    const elements = await this.queryOverpass(lat, lon, input.category)

    console.log('↓\nNormalizing Data')
    const results = elements
      .map((el: any) => {
        const tags = el.tags || {}
        return {
          googlePlaceId: `osm:${el.type}:${el.id}`,
          name: tags.name || 'Unnamed Business',
          category: tags.amenity || tags.shop || tags.tourism || tags.leisure || tags.office || tags.beauty || 'Unknown',
          address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:postcode']]
            .filter(Boolean)
            .join(' ') || 'Address not listed',
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
      .slice(0, 50)

    console.log(`↓\nNormalized ${results.length} results (capped at 50)`)
    console.log('↓\nReturning Response')
    return { lat, lon, results }
  }
}
