import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'

export type CopyField = 'PHONE' | 'EMAIL' | 'WEBSITE'
export type ActivityType =
  | 'SEARCH'
  | 'BUSINESS_VIEW'
  | 'BUSINESS_SAVE'
  | 'BUSINESS_UNSAVE'
  | 'PHONE_COPY'
  | 'EMAIL_COPY'
  | 'WEBSITE_COPY'
  | 'RECOMMENDATION'

export class AnalyticsService {
  static async activity(userId: string, type: ActivityType, metadata?: Prisma.InputJsonValue) {
    return prisma.activity.create({ data: { userId, type, metadata } })
  }

  static async viewed(userId: string, businessId: string) {
    await prisma.businessView.create({ data: { userId, businessId } })
    await this.activity(userId, 'BUSINESS_VIEW', { businessId })
  }

  static async copied(userId: string, businessId: string, copiedField: CopyField) {
    const event = await prisma.copyEvent.create({ data: { userId, businessId, copiedField } })
    let type: ActivityType = 'PHONE_COPY'
    if (copiedField === 'EMAIL') type = 'EMAIL_COPY'
    else if (copiedField === 'WEBSITE') type = 'WEBSITE_COPY'
    await this.activity(userId, type, { businessId })
    return event
  }
}
