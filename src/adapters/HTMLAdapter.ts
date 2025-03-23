import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'

export interface HTMLAdapterConfig extends AdapterConfig {
  url: string
  regex: string
  expectedMatch?: string // Optional expected value to compare against
  timeout?: number // Optional timeout in milliseconds
}

export class HTMLAdapter implements TruthAdapter<HTMLAdapterConfig> {
  private config!: HTMLAdapterConfig

  async init(config: HTMLAdapterConfig): Promise<void> {
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
      const regex = new RegExp(this.config.regex)
      const match = html.match(regex)

      if (!match) {
        return {
          answer: false,
          timestamp: new Date(),
          metadata: { error: 'No match found' },
        }
      }

      const matchedValue = match[1] // Assuming the value we want is in the first capture group
      const answer = this.config.expectedMatch ? matchedValue === this.config.expectedMatch : true // If no expected value, just return true if we found a match

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
