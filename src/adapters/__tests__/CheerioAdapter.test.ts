import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheerioAdapter } from '../CheerioAdapter.js'
import type { AdapterResult } from '../types.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CheerioAdapter', () => {
  const adapter = new CheerioAdapter()

  beforeEach(() => {
    // Reset the adapter and fetch mock before each test
    adapter.dispose()
    mockFetch.mockReset()
  })

  it('should match selector and return true when no expected value', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="test">Test Value</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      selector: '.test',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result.answer).toBe(true)
    expect(result.metadata.matchedValue).toBe('Test Value')
  })

  it('should match selector and compare with expected value', async () => {
    // Mock successful fetch response for both calls
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div class="test">Expected Value</div>'),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<div class="test">Expected Value</div>'),
      })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      selector: '.test',
      expectedValue: 'Expected Value',
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
      selector: '.test',
      expectedValue: 'Different Value',
    })

    const result2 = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result2.answer).toBe(false)
    expect(result2.metadata.matchedValue).toBe('Expected Value')
  })

  it('should extract attribute value when specified', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve('<div class="test" data-value="Attribute Value">Text Content</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      selector: '.test',
      extractAttribute: 'data-value',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string; extractedAttribute: string }
    }
    expect(result.answer).toBe(true)
    expect(result.metadata.matchedValue).toBe('Attribute Value')
    expect(result.metadata.extractedAttribute).toBe('data-value')
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
      selector: '.test',
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
      selector: '.test',
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
      selector: '.test',
      timeout: 1000,
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('Timeout')
  })

  it('should handle no selector match', async () => {
    // Mock successful fetch response with no matching content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="other">Different Content</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      selector: '.test',
    })

    const result = (await adapter.evaluate()) as AdapterResult & { metadata: { error: string } }
    expect(result.answer).toBe(false)
    expect(result.metadata.error).toBe('No match found')
  })

  it('should include timestamp in result', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<div class="test">Test Value</div>'),
    })

    await adapter.init({
      id: 'test',
      name: 'Test',
      url: 'http://test.com',
      selector: '.test',
    })

    const result = (await adapter.evaluate()) as AdapterResult & {
      metadata: { matchedValue: string }
    }
    expect(result.timestamp).toBeInstanceOf(Date)
  })
})
