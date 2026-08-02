import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/http.js'
import { verifyAccessToken } from '../utils/tokens.js'

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string }
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing access token')
  req.user = verifyAccessToken(header.slice(7))
  next()
}
