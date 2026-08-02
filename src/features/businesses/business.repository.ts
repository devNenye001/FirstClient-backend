import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'

export type BusinessInput = {
  googlePlaceId: string
  name: string
  category: string
  address: string
  phone?: string
  email?: string
  website?: string
  websiteExists: boolean
  googleRating?: number
  reviewCount?: number
  openingHours?: Prisma.InputJsonValue
  photos: string[]
  googleMapsUrl: string
  latitude: number
  longitude: number
}

export class BusinessRepository {
  static upsert(data: BusinessInput) {
    return prisma.business.upsert({
      where: { googlePlaceId: data.googlePlaceId },
      update: data,
      create: data
    })
  }

  static findById(id: string) {
    return prisma.business.findUnique({ where: { id } })
  }

  static list() {
    return prisma.business.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 })
  }
}
