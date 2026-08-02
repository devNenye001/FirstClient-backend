import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { forgotPassword, login, logout, refresh, register, resetPassword } from './auth.controller.js'
import { forgotSchema, loginSchema, refreshSchema, registerSchema, resetSchema } from './auth.validators.js'

export const authRoutes = Router()
authRoutes.post('/register', validate(registerSchema), register)
authRoutes.post('/login', validate(loginSchema), login)
authRoutes.post('/refresh', validate(refreshSchema), refresh)
authRoutes.post('/logout', requireAuth, logout)
authRoutes.post('/forgot-password', validate(forgotSchema), forgotPassword)
authRoutes.post('/reset-password', validate(resetSchema), resetPassword)
