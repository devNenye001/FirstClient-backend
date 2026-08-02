import { Router } from 'express'
import { prisma } from '../../config/prisma.js'
import { requireAuth } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'

export const analyticsRoutes = Router()

analyticsRoutes.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const [searches, views, saved, phoneCopies, emailCopies, recentActivity] = await Promise.all([
    prisma.searchHistory.count({ where: { userId } }),
    prisma.businessView.count({ where: { userId } }),
    prisma.savedBusiness.count({ where: { userId } }),
    prisma.copyEvent.count({ where: { userId, copiedField: 'PHONE' } }),
    prisma.copyEvent.count({ where: { userId, copiedField: 'EMAIL' } }),
    prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 })
  ])
  res.json(ok({ searches, views, saved, phoneCopies, emailCopies, businessesContacted: phoneCopies + emailCopies, recentActivity }))
}))
