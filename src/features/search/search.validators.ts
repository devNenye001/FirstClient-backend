import { z } from 'zod'

export const searchSchema = z.object({
  query: z.object({
    country: z.string().min(2),
    state: z.string().optional(),
    city: z.string().min(2),
    category: z.string().min(2)
  })
})
