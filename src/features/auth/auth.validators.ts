import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8)
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1)
  })
})

export const refreshSchema = z.object({ body: z.object({ refreshToken: z.string().min(20) }) })
export const forgotSchema = z.object({ body: z.object({ email: z.string().email().toLowerCase() }) })
export const resetSchema = z.object({ body: z.object({ token: z.string().min(20), password: z.string().min(8) }) })
