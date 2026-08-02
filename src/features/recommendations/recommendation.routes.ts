import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'
import { RecommendationService } from './recommendation.service.js'

const schema = z.object({ body: z.object({ businessId: z.string().min(1) }) })
export const recommendationRoutes = Router()
recommendationRoutes.post('/', requireAuth, validate(schema), asyncHandler(async (req, res) => res.status(201).json(ok(await RecommendationService.recommend(req.user!.userId, req.body.businessId)))))
