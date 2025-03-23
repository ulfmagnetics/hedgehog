import { describe, it, expect } from 'vitest'
import { NumericRangeAdapter } from '../NumericRangeAdapter.js'

describe('NumericRangeAdapter', () => {
  const adapter = new NumericRangeAdapter()

  it('should throw error if neither min nor max value is specified', async () => {
    await expect(
      adapter.init({
        id: 'test',
        name: 'Test',
        value: 5,
      }),
    ).rejects.toThrow('At least one of minValue or maxValue must be specified')
  })

  it('should check only min value when max is not specified', async () => {
    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 5,
      minValue: 3,
    })
    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 2,
      minValue: 3,
    })
    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)
  })

  it('should check only max value when min is not specified', async () => {
    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 5,
      maxValue: 7,
    })
    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 8,
      maxValue: 7,
    })
    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)
  })

  it('should check both min and max values when both are specified', async () => {
    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 5,
      minValue: 3,
      maxValue: 7,
    })
    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 2,
      minValue: 3,
      maxValue: 7,
    })
    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)

    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 8,
      minValue: 3,
      maxValue: 7,
    })
    const result3 = await adapter.evaluate()
    expect(result3.answer).toBe(false)
  })

  it('should respect inclusive flag', async () => {
    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 5,
      minValue: 5,
      maxValue: 5,
      inclusive: true,
    })
    const result = await adapter.evaluate()
    expect(result.answer).toBe(true)

    await adapter.init({
      id: 'test',
      name: 'Test',
      value: 5,
      minValue: 5,
      maxValue: 5,
      inclusive: false,
    })
    const result2 = await adapter.evaluate()
    expect(result2.answer).toBe(false)
  })
})
