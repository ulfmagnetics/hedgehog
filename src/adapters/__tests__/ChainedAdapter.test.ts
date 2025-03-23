import { describe, it, expect, vi } from 'vitest'
import { ChainedAdapter } from '../ChainedAdapter.js'
import type { TruthAdapter, AdapterConfig, AdapterResult } from '../types.js'

// Mock adapters for testing
class MockSourceAdapter implements TruthAdapter<AdapterConfig> {
  private shouldReturnTrue = true

  constructor(shouldReturnTrue = true) {
    this.shouldReturnTrue = shouldReturnTrue
  }

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async evaluate(): Promise<AdapterResult> {
    return {
      answer: this.shouldReturnTrue,
      timestamp: new Date(),
      metadata: { value: 'test' },
    }
  }
}

class MockTargetAdapter implements TruthAdapter<AdapterConfig> {
  private shouldReturnTrue = true

  constructor(shouldReturnTrue = true) {
    this.shouldReturnTrue = shouldReturnTrue
  }

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async evaluate(): Promise<AdapterResult> {
    return {
      answer: this.shouldReturnTrue,
      timestamp: new Date(),
      metadata: { value: 'test' },
    }
  }
}

describe('ChainedAdapter', () => {
  it('should initialize both adapters', async () => {
    const sourceAdapter = new MockSourceAdapter()
    const targetAdapter = new MockTargetAdapter()
    const sourceInitSpy = vi.spyOn(sourceAdapter, 'init')
    const targetInitSpy = vi.spyOn(targetAdapter, 'init')

    const chainedAdapter = new ChainedAdapter<AdapterConfig, AdapterConfig>()
    await chainedAdapter.init({
      id: 'test',
      name: 'Test',
      sourceAdapter,
      targetAdapter,
      sourceConfig: { id: 'source', name: 'Source' },
      targetConfig: { id: 'target', name: 'Target' },
    })

    expect(sourceInitSpy).toHaveBeenCalledWith({ id: 'source', name: 'Source' })
    expect(targetInitSpy).toHaveBeenCalledWith({ id: 'target', name: 'Target' })
  })

  it('should return false if source adapter returns false', async () => {
    const sourceAdapter = new MockSourceAdapter(false)
    const targetAdapter = new MockTargetAdapter(true)
    const chainedAdapter = new ChainedAdapter<AdapterConfig, AdapterConfig>()

    await chainedAdapter.init({
      id: 'test',
      name: 'Test',
      sourceAdapter,
      targetAdapter,
      sourceConfig: { id: 'source', name: 'Source' },
      targetConfig: { id: 'target', name: 'Target' },
    })

    const result = await chainedAdapter.evaluate()
    expect(result.answer).toBe(false)
    expect(result.metadata?.reason).toBe('Source adapter returned false')
  })

  it('should chain results when source adapter returns true', async () => {
    const sourceAdapter = new MockSourceAdapter(true)
    const targetAdapter = new MockTargetAdapter(true)
    const chainedAdapter = new ChainedAdapter<AdapterConfig, AdapterConfig>()

    await chainedAdapter.init({
      id: 'test',
      name: 'Test',
      sourceAdapter,
      targetAdapter,
      sourceConfig: { id: 'source', name: 'Source' },
      targetConfig: { id: 'target', name: 'Target' },
    })

    const result = await chainedAdapter.evaluate()
    expect(result.answer).toBe(true)
    expect(result.metadata?.sourceResult).toBeDefined()
    expect(result.metadata?.targetResult).toBeDefined()
  })

  it('should apply transform result when provided', async () => {
    const sourceAdapter = new MockSourceAdapter(true)
    const targetAdapter = new MockTargetAdapter(true)
    const targetInitSpy = vi.spyOn(targetAdapter, 'init')
    const chainedAdapter = new ChainedAdapter<AdapterConfig, AdapterConfig>()

    await chainedAdapter.init({
      id: 'test',
      name: 'Test',
      sourceAdapter,
      targetAdapter,
      sourceConfig: { id: 'source', name: 'Source' },
      targetConfig: { id: 'target', name: 'Target' },
      transformResult: () => ({
        id: 'transformed',
        name: 'Transformed',
      }),
    })

    await chainedAdapter.evaluate()
    expect(targetInitSpy).toHaveBeenCalledWith({ id: 'transformed', name: 'Transformed' })
  })

  it('should dispose both adapters', async () => {
    const sourceAdapter = new MockSourceAdapter()
    const targetAdapter = new MockTargetAdapter()
    const sourceDisposeSpy = vi.spyOn(sourceAdapter, 'dispose')
    const targetDisposeSpy = vi.spyOn(targetAdapter, 'dispose')

    const chainedAdapter = new ChainedAdapter<AdapterConfig, AdapterConfig>()
    await chainedAdapter.init({
      id: 'test',
      name: 'Test',
      sourceAdapter,
      targetAdapter,
      sourceConfig: { id: 'source', name: 'Source' },
      targetConfig: { id: 'target', name: 'Target' },
    })

    await chainedAdapter.dispose()
    expect(sourceDisposeSpy).toHaveBeenCalled()
    expect(targetDisposeSpy).toHaveBeenCalled()
  })
})
