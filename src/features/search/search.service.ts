import { prisma } from '../../config/prisma.js'
import { AnalyticsService } from '../analytics/analytics.service.js'
import { BusinessRepository, type BusinessInput } from '../businesses/business.repository.js'
import { OverpassService } from './overpass.service.js'
import { HttpError } from '../../utils/http.js'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

export class SearchService {
  static async search(userId: string, input: { country: string; state?: string; city: string; category: string }) {
    try {
      const { lat, lon, results } = await OverpassService.search(input)
      const businesses = await Promise.all(results.map((business: BusinessInput) => BusinessRepository.upsert(business)))

      await prisma.searchHistory.create({ data: { userId, ...input, resultCount: businesses.length } })
      await AnalyticsService.activity(userId, 'SEARCH', { ...input, resultCount: businesses.length })

      return businesses.map((business) => {
        const dist = calculateDistance(lat, lon, business.latitude, business.longitude)
        return {
          ...business,
          distance: parseFloat(dist.toFixed(2)),
          marker: { lat: business.latitude, lng: business.longitude },
          websiteExists: Boolean(business.website)
        }
      })
    } catch (error: any) {
      if (error.message && error.message.includes('Location not found')) {
        throw new HttpError(400, error.message)
      }
      throw error
    }
  }
}
