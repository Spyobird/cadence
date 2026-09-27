import { describe, it, expect } from 'vitest'

describe('Environment Check', () => {
  it('should have document defined', () => {
    expect(typeof document).toBe('object')
  })
})
