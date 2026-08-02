export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export const ok = <T>(data: T, message = 'OK') => ({ success: true, message, data })
