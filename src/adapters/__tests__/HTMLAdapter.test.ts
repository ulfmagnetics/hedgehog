import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HTMLAdapter } from '../HTMLAdapter.js'
import type { AdapterResult } from '../types.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('HTMLAdapter', () => {
  const adapter = new HTMLAdapter()

  beforeEach(() => {
    // Reset the adapter and fetch mock before each test
    adapter.dispose()
    mockFetch.mockReset()
  })

  it('should match regex pattern and return true when no expected value', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div>Test Value</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result.answer).toBe(true)
    expect(result.metadata.matchedValue).toBe('Test Value')
  })

  it('should match regex pattern and compare with expected value', async () => {
    // Mock successful fetch response for both calls
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div>Expected Value</div>'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div>Expected Value</div>'),
      })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
      expectedMatch: 'Expected Value',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result.answer).toBe(true)
    expect(result.metadata.matchedValue).toBe('Expected Value')

    // Test with different expected value
    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
      expectedMatch: 'Different Value',
    })

    const result2 = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result2.answer).toBe(false)
    expect(result2.metadata.matchedValue).toBe('Expected Value')
  })

  it('should handle HTTP errors', async () => {
    // Mock failed fetch response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('HTTP error! status: 404')
  })

  it('should handle network errors', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('Network error')
  })

  it('should handle timeout', async () => {
    // Mock timeout
    mockFetch.mockRejectedValueOnce(new Error('Timeout'))

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
      timeout: 1000,
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('Timeout')
  })

  it('should handle no regex match', async () => {
    // Mock successful fetch response with no matching content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div>Different Content</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<span>(.*?)</span>',
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('No match found')
  })

  it('should include timestamp in result', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div>Test Value</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      regex: '<div>(.*?)</div>',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result.timestamp).toBeInstanceOf(Date)
  })
})
