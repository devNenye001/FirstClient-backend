import OpenAI from 'openai'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { HttpError } from '../../utils/http.js'
import { AnalyticsService } from '../analytics/analytics.service.js'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

export class RecommendationService {
  static async recommend(userId: string, businessId: string) {
    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) throw new HttpError(404, 'Business not found')
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_RECOMMENDATION_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return JSON only with service, reason, opportunityScore. Recommend digital solutions only. Never write outreach messages.' },
        { role: 'user', content: JSON.stringify({ category: business.category, websiteExists: business.websiteExists, name: business.name }) }
      ]
    })
    const parsed = JSON.parse(completion.choices[0]?.message.content ?? '{}') as { service: string; reason: string; opportunityScore: number }
    const recommendation = await prisma.recommendation.create({
      data: { userId, businessId, service: parsed.service, reason: parsed.reason, opportunityScore: parsed.opportunityScore, model: env.OPENAI_RECOMMENDATION_MODEL }
    })
    await AnalyticsService.activity(userId, 'RECOMMENDATION', { businessId })
    return recommendation
  }
}
