import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'
import { SearchService } from './search.service.js'

export const searchBusinesses = asyncHandler(async (req: Request, res: Response) => {
  res.json(ok(await SearchService.search(req.user!.userId, req.query as { country: string; state?: string; city: string; category: string })))
})
