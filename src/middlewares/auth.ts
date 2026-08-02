import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string }
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const mockUserId = 'default-user-id'
  const mockEmail = 'user@example.com'

  try {
    await prisma.user.upsert({
      where: { id: mockUserId },
      update: {},
      create: {
        id: mockUserId,
        email: mockEmail,
        name: 'Rosemary',
        passwordHash: 'mock-password-hash'
      }
    })
    req.user = { userId: mockUserId, email: mockEmail }
    next()
  } catch (error) {
    next(error)
  }
}
