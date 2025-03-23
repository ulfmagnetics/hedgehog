import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'
import * as cheerio from 'cheerio'

export interface CheerioAdapterConfig extends AdapterConfig {
  url: string
  selector: string // CSS selector
  expectedValue?: string // Optional expected value to compare against
  timeout?: number // Optional timeout in milliseconds
  extractAttribute?: string // Optional attribute name to extract instead of text content
}

export class CheerioAdapter implements TruthAdapter<CheerioAdapterConfig> {
  private config!: CheerioAdapterConfig

  async init(config: CheerioAdapterConfig): Promise<void> {
    this.config = config
  }

  async evaluate(): Promise<AdapterResult> {
    try {
      const response = await fetch(this.config.url, {
        signal: AbortSignal.timeout(this.config.timeout || 5000),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const element = $(this.config.selector)
      const matchedValue = this.config.extractAttribute
        ? element.attr(this.config.extractAttribute)
        : element.text().trim()

      if (!matchedValue) {
        return {
          answer: false,
          timestamp: new Date(),
          metadata: { error: 'No match found' },
        }
      }

      const answer = this.config.expectedValue ? matchedValue === this.config.expectedValue : true

      return {
        answer,
        timestamp: new Date(),
        metadata: {
          matchedValue,
          extractedAttribute: this.config.extractAttribute,
        },
      }
    } catch (error) {
      return {
        answer: false,
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      }
    }
  }

  async dispose(): Promise<void> {
    // Nothing to clean up
  }
}
