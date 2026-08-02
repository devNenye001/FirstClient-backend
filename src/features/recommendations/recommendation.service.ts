import OpenAI from 'openai'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { HttpError } from '../../utils/http.js'
import { AnalyticsService } from '../analytics/analytics.service.js'

let openai: OpenAI | null = null
if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-key') {
  openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
}

const defaultRecommendations: Record<string, string> = {
  restaurant: 'Restaurant Website',
  hotel: 'Hotel Booking Website',
  salon: 'Appointment Booking Website',
  pharmacy: 'Pharmacy Management System',
  school: 'School Management System',
  gym: 'Membership Management System'
}

type RecommendationPayload = {
  service: string
  reason: string
  opportunityScore: number
}

export class RecommendationService {
  static async recommend(userId: string, businessId: string) {
    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) throw new HttpError(404, 'Business not found')

    let parsed: RecommendationPayload
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: env.OPENAI_RECOMMENDATION_MODEL,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Return JSON only with service, reason, opportunityScore. Recommend digital solutions only. Never write outreach messages.' },
            { role: 'user', content: JSON.stringify({ category: business.category, websiteExists: business.websiteExists, name: business.name }) }
          ]
        })
        parsed = this.parseRecommendation(completion.choices[0]?.message.content, business.category, business.websiteExists)
      } catch (err) {
        console.error('OpenAI API call failed, using heuristic fallback:', err)
        parsed = this.fallbackRecommendation(business.category, business.websiteExists)
      }
    } else {
      parsed = this.fallbackRecommendation(business.category, business.websiteExists)
    }

    const recommendation = await prisma.recommendation.create({
      data: { 
        userId, 
        businessId, 
        service: parsed.service, 
        reason: parsed.reason, 
        opportunityScore: parsed.opportunityScore, 
        model: openai ? env.OPENAI_RECOMMENDATION_MODEL : 'heuristic-fallback' 
      }
    })
    await AnalyticsService.activity(userId, 'RECOMMENDATION', { businessId })
    return recommendation
  }

  private static parseRecommendation(content: string | null | undefined, category: string, websiteExists: boolean): RecommendationPayload {
    try {
      const parsed = JSON.parse(content ?? '{}') as Partial<RecommendationPayload>
      if (typeof parsed.service === 'string' && typeof parsed.reason === 'string' && typeof parsed.opportunityScore === 'number') {
        return { service: parsed.service, reason: parsed.reason, opportunityScore: Math.min(100, Math.max(0, Math.round(parsed.opportunityScore))) }
      }
    } catch {
      return this.fallbackRecommendation(category, websiteExists)
    }
    return this.fallbackRecommendation(category, websiteExists)
  }

  private static fallbackRecommendation(category: string, websiteExists: boolean): RecommendationPayload {
    const normalizedCategory = category.toLowerCase()
    const mappedService = Object.entries(defaultRecommendations).find(([key]) => normalizedCategory.includes(key))?.[1]
    const service = websiteExists ? mappedService?.replace('Website', 'Website Upgrade') ?? 'Digital Conversion Upgrade' : mappedService ?? 'Business Website'
    return {
      service,
      reason: websiteExists ? 'The business already has a web presence and may benefit from a more conversion-focused digital solution.' : 'The business does not list a website, making a basic digital presence the strongest opportunity.',
      opportunityScore: websiteExists ? 68 : 90
    }
  }
}
