import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'
import * as cheerio from 'cheerio'
import * as xpath from 'xpath'
import { DOMParser } from 'xmldom'

interface CheerioAdapterConfig extends AdapterConfig {
  url: string
  selector: string // CSS selector or XPath
  expectedValue?: string // Optional expected value to compare against
  timeout?: number // Optional timeout in milliseconds
  useXPath?: boolean // Whether to use XPath instead of CSS selector
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

      let matchedValue: string | undefined
      if (this.config.useXPath) {
        // Use XPath if specified
        const doc = new DOMParser().parseFromString(html)
        const node = xpath.select(this.config.selector, doc)
        if (typeof node === 'string') {
          matchedValue = node
        } else if (node && typeof node === 'object' && 'textContent' in node) {
          matchedValue = (node as Element).textContent || undefined
        }
      } else {
        // Use CSS selector
        const element = $(this.config.selector)
        matchedValue = element.text().trim()
      }

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
        metadata: { matchedValue },
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
