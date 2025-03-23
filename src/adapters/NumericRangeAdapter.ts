import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'

export interface NumericRangeAdapterConfig extends AdapterConfig {
  value: number
  minValue: number
  maxValue: number
  inclusive?: boolean // Whether to include the min and max values in the range
}

export class NumericRangeAdapter implements TruthAdapter<NumericRangeAdapterConfig> {
  private config!: NumericRangeAdapterConfig

  async init(config: NumericRangeAdapterConfig): Promise<void> {
    this.config = config
  }

  async evaluate(): Promise<AdapterResult> {
    const { value, minValue, maxValue, inclusive = true } = this.config

    const isInRange = inclusive
      ? value >= minValue && value <= maxValue
      : value > minValue && value < maxValue

    return {
      answer: isInRange,
      timestamp: new Date(),
      metadata: {
        value,
        minValue,
        maxValue,
        inclusive,
      },
    }
  }

  async dispose(): Promise<void> {
    // Nothing to clean up for this adapter
  }
}
