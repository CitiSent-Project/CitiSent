import { describe, expect, it } from 'vitest'
import { buildNextActivityLog } from '../shared/activityController'

describe('activityController', () => {
  it('prepends a new activity entry and caps length', () => {
    const previousActivityLog = Array.from({ length: 3 }, (_, index) => ({ id: `a${index}` }))

    const result = buildNextActivityLog({
      previousActivityLog,
      action: 'Login',
      detail: 'Signed in',
      maxItems: 2,
    })

    expect(result).toHaveLength(2)
    expect(result[0].action).toBe('Login')
    expect(result[0].detail).toBe('Signed in')
  })
})
