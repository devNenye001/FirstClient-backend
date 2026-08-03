import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { HttpError, SearchError } from '../utils/http.js'

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`))
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Validation failed', issues: error.issues })
  }
  if (error instanceof SearchError) {
    return res.status(error.statusCode).json({
      success: false,
      step: error.step,
      message: error.message,
      details: error.details ?? ''
    })
  }
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }
  console.error(error)
  const errorMessage = error instanceof Error ? error.message : 'Internal server error'
  const errorStack = error instanceof Error ? error.stack : ''
  return res.status(500).json({
    success: false,
    message: errorMessage,
    stack: errorStack
  })
}
