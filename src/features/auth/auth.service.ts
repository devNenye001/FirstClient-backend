import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { prisma } from '../../config/prisma.js'
import { HttpError } from '../../utils/http.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokens.js'

const hash = (value: string) => bcrypt.hash(value, 12)
const compare = (value: string, hashed: string) => bcrypt.compare(value, hashed)

export class AuthService {
  static async register(input: { name?: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new HttpError(409, 'Email is already registered')
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash: await hash(input.password) }
    })
    return this.issueSession(user.id, user.email)
  }

  static async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user || !(await compare(input.password, user.passwordHash))) throw new HttpError(401, 'Invalid credentials')
    return this.issueSession(user.id, user.email)
  }

  static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.refreshTokenHash || !(await compare(refreshToken, user.refreshTokenHash))) {
      throw new HttpError(401, 'Invalid refresh token')
    }
    return this.issueSession(user.id, user.email)
  }

  static async logout(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } })
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    const token = crypto.randomBytes(32).toString('hex')
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: await hash(token), resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 30) }
      })
    }
    return { resetToken: process.env.NODE_ENV === 'production' ? undefined : token }
  }

  static async resetPassword(token: string, password: string) {
    const users = await prisma.user.findMany({ where: { resetTokenExpiresAt: { gt: new Date() } } })
    let user = null
    for (const candidate of users) {
      if (candidate.resetTokenHash && (await compare(token, candidate.resetTokenHash))) {
        user = candidate
        break
      }
    }
    if (!user) throw new HttpError(400, 'Invalid or expired reset token')
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(password), resetTokenHash: null, resetTokenExpiresAt: null, refreshTokenHash: null }
    })
  }

  private static async issueSession(userId: string, email: string) {
    const accessToken = signAccessToken({ userId, email })
    const refreshToken = signRefreshToken({ userId, email })
    await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: await hash(refreshToken) } })
    return { user: { id: userId, email }, accessToken, refreshToken }
  }
}
