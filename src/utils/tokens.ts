import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

export type JwtUser = { userId: string; email: string }

export function signAccessToken(payload: JwtUser) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as SignOptions)
}

export function signRefreshToken(payload: JwtUser) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions)
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUser
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtUser
}
