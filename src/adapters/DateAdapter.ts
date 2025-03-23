import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'

export interface DateAdapterConfig extends AdapterConfig {
  targetDate: string // ISO date string
  recurringYearly?: boolean
}

export class DateAdapter implements TruthAdapter<DateAdapterConfig> {
  private config!: DateAdapterConfig

  async init(config: DateAdapterConfig): Promise<void> {
    this.config = config
  }

  async evaluate(): Promise<AdapterResult> {
    const now = new Date()
    const target = new Date(this.config.targetDate)

    const isMatch = this.config.recurringYearly
      ? now.getMonth() === target.getMonth() && now.getDate() === target.getDate()
      : now.toDateString() === target.toDateString()

    return {
      answer: isMatch,
      timestamp: now,
    }
  }

  async dispose(): Promise<void> {
    // Nothing to clean up for this adapter
  }
}
