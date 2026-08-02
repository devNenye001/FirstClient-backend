import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { getCurrentUser } from './user.controller.js'

export const userRoutes = Router()

userRoutes.get('/me', requireAuth, getCurrentUser)
