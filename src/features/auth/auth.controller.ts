import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../utils/http.js'
import { AuthService } from './auth.service.js'

export const register = asyncHandler(async (req: Request, res: Response) => res.status(201).json(ok(await AuthService.register(req.body), 'Registered')))
export const login = asyncHandler(async (req: Request, res: Response) => res.json(ok(await AuthService.login(req.body), 'Logged in')))
export const refresh = asyncHandler(async (req: Request, res: Response) => res.json(ok(await AuthService.refresh(req.body.refreshToken), 'Token refreshed')))
export const logout = asyncHandler(async (req: Request, res: Response) => { await AuthService.logout(req.user!.userId); res.json(ok(null, 'Logged out')) })
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => res.json(ok(await AuthService.forgotPassword(req.body.email), 'Reset instructions sent')))
export const resetPassword = asyncHandler(async (req: Request, res: Response) => { await AuthService.resetPassword(req.body.token, req.body.password); res.json(ok(null, 'Password reset')) })
