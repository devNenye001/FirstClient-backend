import { env } from '../../config/env.js'
import type { BusinessInput } from '../businesses/business.repository.js'

type PlaceSearchItem = { place_id: string }
type Details = {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  opening_hours?: unknown
  photos?: { photo_reference: string }[]
  url?: string
  geometry: { location: { lat: number; lng: number } }
  types?: string[]
}

export class GooglePlacesService {
  static async search(input: { country: string; state?: string; city: string; category: string }) {
    const location = [input.city, input.state, input.country].filter(Boolean).join(', ')
    const textUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    textUrl.searchParams.set('query', `${input.category} in ${location}`)
    textUrl.searchParams.set('key', env.GOOGLE_PLACES_API_KEY)
    const search = await fetch(textUrl)
    const searchJson = (await search.json()) as { results?: PlaceSearchItem[]; error_message?: string }
    if (!search.ok || searchJson.error_message) throw new Error(searchJson.error_message ?? 'Google Places search failed')
    const places = await Promise.all((searchJson.results ?? []).slice(0, 20).map((place) => this.details(place.place_id, input.category)))
    return places
  }

  private static async details(placeId: string, fallbackCategory: string): Promise<BusinessInput> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,url,geometry,types')
    url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY)
    const response = await fetch(url)
    const json = (await response.json()) as { result: Details; error_message?: string }
    if (!response.ok || json.error_message) throw new Error(json.error_message ?? 'Google Places details failed')
    const result = json.result
    return {
      googlePlaceId: result.place_id,
      name: result.name,
      category: result.types?.[0]?.replaceAll('_', ' ') ?? fallbackCategory,
      address: result.formatted_address ?? '',
      phone: result.formatted_phone_number,
      website: result.website,
      websiteExists: Boolean(result.website),
      googleRating: result.rating,
      reviewCount: result.user_ratings_total,
      openingHours: result.opening_hours,
      photos: (result.photos ?? []).slice(0, 5).map((photo) => {
        const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo')
        photoUrl.searchParams.set('maxwidth', '800')
        photoUrl.searchParams.set('photo_reference', photo.photo_reference)
        photoUrl.searchParams.set('key', env.GOOGLE_PLACES_API_KEY)
        return photoUrl.toString()
      }),
      googleMapsUrl: result.url ?? `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng
    }
  }
}
