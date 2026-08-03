import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middlewares/error.js'
import { analyticsRoutes } from './features/analytics/analytics.routes.js'
import { authRoutes } from './features/auth/auth.routes.js'
import { businessRoutes } from './features/businesses/business.routes.js'
import { dashboardRoutes } from './features/dashboard/dashboard.routes.js'
import { recommendationRoutes } from './features/recommendations/recommendation.routes.js'
import { savedRoutes } from './features/saved/saved.routes.js'
import { searchRoutes } from './features/search/search.routes.js'
import { userRoutes } from './features/users/user.routes.js'

export const app = express()

app.use(helmet())
const allowedOrigins = env.CORS_ORIGIN.split(',')
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(compression())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(rateLimit({ windowMs: 60_000, limit: 120 }))

app.get('/health', (_req, res) => res.json({ success: true, message: 'FirstClient API is healthy' }))
app.use('/auth', authRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/search', searchRoutes)
app.use('/users', userRoutes)
app.use(businessRoutes)
app.use('/saved', savedRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/recommendations', recommendationRoutes)
app.use(notFound)
app.use(errorHandler)
