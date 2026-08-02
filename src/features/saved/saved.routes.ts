import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'
import { SavedService } from './saved.service.js'

const schema = z.object({ params: z.object({ businessId: z.string().min(1) }) })
export const savedRoutes = Router()
savedRoutes.get('/', requireAuth, asyncHandler(async (req, res) => res.json(ok(await SavedService.list(req.user!.userId)))))
savedRoutes.post('/:businessId', requireAuth, validate(schema), asyncHandler(async (req, res) => res.status(201).json(ok(await SavedService.save(req.user!.userId, req.params.businessId), 'Saved'))))
savedRoutes.delete('/:businessId', requireAuth, validate(schema), asyncHandler(async (req, res) => { await SavedService.remove(req.user!.userId, req.params.businessId); res.json(ok(null, 'Removed')) }))
