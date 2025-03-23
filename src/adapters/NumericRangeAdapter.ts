import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'

export interface NumericRangeAdapterConfig extends AdapterConfig {
  value: number
  minValue?: number
  maxValue?: number
  inclusive?: boolean // Whether to include the min and max values in the range
}

export class NumericRangeAdapter implements TruthAdapter<NumericRangeAdapterConfig> {
  private config!: NumericRangeAdapterConfig

  async init(config: NumericRangeAdapterConfig): Promise<void> {
    if (config.minValue === undefined && config.maxValue === undefined) {
      throw new Error('At least one of minValue or maxValue must be specified')
    }
    this.config = config
  }

  async evaluate(): Promise<AdapterResult> {
    const { value, minValue, maxValue, inclusive = true } = this.config

    let isInRange = true
    if (minValue !== undefined) {
      isInRange = isInRange && (inclusive ? value >= minValue : value > minValue)
    }
    if (maxValue !== undefined) {
      isInRange = isInRange && (inclusive ? value <= maxValue : value < maxValue)
    }

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
    // Nothing to clean up
  }
}
