import { Router } from 'express'
import { prisma } from '../../config/prisma.js'
import { requireAuth } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'

export const dashboardRoutes = Router()

dashboardRoutes.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId
  const [totalSearches, businessesViewed, businessesSaved, copyEvents, recentSearches] = await Promise.all([
    prisma.searchHistory.count({ where: { userId } }),
    prisma.businessView.count({ where: { userId } }),
    prisma.savedBusiness.count({ where: { userId } }),
    prisma.copyEvent.count({ where: { userId } }),
    prisma.searchHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 })
  ])
  res.json(ok({ totalSearches, businessesViewed, businessesSaved, businessesContacted: copyEvents, recentSearches }))
}))
