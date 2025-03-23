import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateAdapter } from '../DateAdapter.js'

describe('DateAdapter', () => {
  const adapter = new DateAdapter()

  beforeEach(() => {
    // Reset the adapter before each test
    adapter.dispose()
  })

  it('should match exact date when not recurring', async () => {
    // Mock current date to 2024-03-15
    const mockDate = new Date('2024-03-15T12:00:00.000Z')
    vi.setSystemTime(mockDate)

    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2024-03-15T00:00:00.000Z',
      recurringYearly: false,
    })

    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    // Test with different date
    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2024-03-16T00:00:00.000Z',
      recurringYearly: false,
    })

    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)
  })

  it('should match month and day when recurring yearly', async () => {
    // Mock current date to 2024-03-15
    const mockDate = new Date('2024-03-15T12:00:00.000Z')
    vi.setSystemTime(mockDate)

    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2023-03-15T00:00:00.000Z', // Different year, same month/day
      recurringYearly: true,
    })

    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    // Test with different month
    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2023-03-16T00:00:00.000Z',
      recurringYearly: true,
    })

    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)

    // Test with different day
    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2023-04-15T00:00:00.000Z',
      recurringYearly: true,
    })

    const result3 = await adapter.evaluate()
    expect(result3.answer).toBe(false)
  })

  it('should handle timezone differences correctly', async () => {
    // Mock current date to 2024-03-15 23:00 UTC
    const mockDate = new Date('2024-03-15T23:00:00.000Z')
    vi.setSystemTime(mockDate)

    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2024-03-15T00:00:00.000Z',
      recurringYearly: false,
    })

    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)
  })

  it('should include timestamp in result', async () => {
    const mockDate = new Date('2024-03-15T12:00:00.000Z')
    vi.setSystemTime(mockDate)

    await adapter.init({
      id: 'test',
      name: 'Test',
      targetDate: '2024-03-15T00:00:00.000Z',
      recurringYearly: false,
    })

    const result = await adapter.evaluate()
    expect(result.timestamp).toEqual(mockDate)
  })
})
