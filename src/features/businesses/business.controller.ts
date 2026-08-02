import type { Request, Response } from 'express'
import { AnalyticsService } from '../analytics/analytics.service.js'
import { BusinessRepository } from './business.repository.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { HttpError, ok } from '../../utils/http.js'

export const listBusinesses = asyncHandler(async (_req: Request, res: Response) => res.json(ok(await BusinessRepository.list())))

export const getBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await BusinessRepository.findById(String(req.params.id))
  if (!business) throw new HttpError(404, 'Business not found')
  await AnalyticsService.viewed(req.user!.userId, business.id)
  res.json(ok({ ...business, marker: { lat: business.latitude, lng: business.longitude } }))
})

export const copyBusinessField = asyncHandler(async (req: Request, res: Response) => {
  const business = await BusinessRepository.findById(String(req.params.id))
  if (!business) throw new HttpError(404, 'Business not found')
  res.status(201).json(ok(await AnalyticsService.copied(req.user!.userId, business.id, req.body.copiedField), 'Copy tracked'))
})
