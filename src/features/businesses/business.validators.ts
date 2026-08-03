import { z } from 'zod'

export const businessIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) })
export const copySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ copiedField: z.enum(['PHONE', 'EMAIL', 'WEBSITE']) })
})
