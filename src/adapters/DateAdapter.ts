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

    // Convert both dates to UTC to handle timezone differences
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const targetUTC = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()),
    )

    const isMatch = this.config.recurringYearly
      ? nowUTC.getUTCMonth() === targetUTC.getUTCMonth() &&
        nowUTC.getUTCDate() === targetUTC.getUTCDate()
      : nowUTC.getTime() === targetUTC.getTime()

    return {
      answer: isMatch,
      timestamp: now,
    }
  }

  async dispose(): Promise<void> {
    // Nothing to clean up for this adapter
  }
}
