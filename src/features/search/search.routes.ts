import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { searchBusinesses } from './search.controller.js'
import { searchSchema } from './search.validators.js'

export const searchRoutes = Router()
searchRoutes.get('/', requireAuth, validate(searchSchema), searchBusinesses)
