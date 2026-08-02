import { describe, expect, it } from 'vitest'
import { HttpError, ok } from './http.js'

describe('http utilities', () => {
  it('wraps successful responses consistently', () => {
    expect(ok({ count: 2 }, 'Done')).toEqual({
      success: true,
      message: 'Done',
      data: { count: 2 }
    })
  })

  it('keeps status code on HttpError', () => {
    const error = new HttpError(404, 'Missing')

    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Missing')
  })
})
