export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export class SearchError extends Error {
  statusCode: number
  constructor(public step: string, message: string, public details?: string) {
    super(message)
    this.statusCode = 400
  }
}

export const ok = <T>(data: T, message = 'OK') => ({ success: true, message, data })
