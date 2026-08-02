import { prisma } from '../../config/prisma.js'
import { AnalyticsService } from '../analytics/analytics.service.js'

export class SavedService {
  static async list(userId: string) {
    return prisma.savedBusiness.findMany({ where: { userId }, include: { business: true }, orderBy: { createdAt: 'desc' } })
  }

  static async save(userId: string, businessId: string) {
    const saved = await prisma.savedBusiness.upsert({
      where: { userId_businessId: { userId, businessId } },
      update: {},
      create: { userId, businessId },
      include: { business: true }
    })
    await AnalyticsService.activity(userId, 'BUSINESS_SAVE', { businessId })
    return saved
  }

  static async remove(userId: string, businessId: string) {
    await prisma.savedBusiness.delete({ where: { userId_businessId: { userId, businessId } } })
    await AnalyticsService.activity(userId, 'BUSINESS_UNSAVE', { businessId })
  }
}
