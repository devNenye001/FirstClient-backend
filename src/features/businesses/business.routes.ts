import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { businessIdSchema, copySchema } from './business.validators.js'
import { copyBusinessField, getBusiness, listBusinesses } from './business.controller.js'

export const businessRoutes = Router()
businessRoutes.get('/businesses', requireAuth, listBusinesses)
businessRoutes.get('/business/:id', requireAuth, validate(businessIdSchema), getBusiness)
businessRoutes.post('/business/:id/copy', requireAuth, validate(copySchema), copyBusinessField)
