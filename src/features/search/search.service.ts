import { prisma } from '../../config/prisma.js'
import { AnalyticsService } from '../analytics/analytics.service.js'
import { BusinessRepository, type BusinessInput } from '../businesses/business.repository.js'
import { OverpassService } from './overpass.service.js'

export class SearchService {
  static async search(userId: string, input: { country: string; state?: string; city: string; category: string }) {
    const placeResults = await OverpassService.search(input)
    const businesses = await Promise.all(placeResults.map((business: BusinessInput) => BusinessRepository.upsert(business)))
    await prisma.searchHistory.create({ data: { userId, ...input, resultCount: businesses.length } })
    await AnalyticsService.activity(userId, 'SEARCH', { ...input, resultCount: businesses.length })
    return businesses.map((business) => ({ ...business, marker: { lat: business.latitude, lng: business.longitude }, websiteExists: Boolean(business.website) }))
  }
}
