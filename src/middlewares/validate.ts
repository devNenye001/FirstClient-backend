import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params })
    req.body = parsed.body ?? req.body
    if (parsed.query) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true
      })
    }
    if (parsed.params) {
      Object.defineProperty(req, 'params', {
        value: parsed.params,
        writable: true,
        configurable: true,
        enumerable: true
      })
    }
    next()
  }
