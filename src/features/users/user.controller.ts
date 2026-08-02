import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'
import { UserService } from './user.service.js'

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await UserService.profile(req.user!.userId)))
})
