import type { TruthAdapter, AdapterConfig, AdapterResult } from './types'

interface ChainedAdapterConfig extends AdapterConfig {
  sourceAdapter: TruthAdapter
  targetAdapter: TruthAdapter
  sourceConfig: AdapterConfig
  targetConfig: AdapterConfig
  transformResult?: (result: AdapterResult) => AdapterConfig
}

export class ChainedAdapter implements TruthAdapter<ChainedAdapterConfig> {
  private config!: ChainedAdapterConfig

  async init(config: ChainedAdapterConfig): Promise<void> {
    this.config = config
    await this.config.sourceAdapter.init(config.sourceConfig)
    await this.config.targetAdapter.init(config.targetConfig)
  }

  async evaluate(): Promise<AdapterResult> {
    // Get result from source adapter
    const sourceResult = await this.config.sourceAdapter.evaluate()

    if (!sourceResult.answer) {
      return {
        answer: false,
        timestamp: new Date(),
        metadata: {
          sourceResult,
          reason: 'Source adapter returned false',
        },
      }
    }

    // Transform the result if needed
    const targetConfig = this.config.transformResult?.(sourceResult)
    if (targetConfig) {
      await this.config.targetAdapter.init(targetConfig)
    }

    // Get result from target adapter
    const targetResult = await this.config.targetAdapter.evaluate()

    return {
      answer: targetResult.answer,
      timestamp: new Date(),
      metadata: {
        sourceResult,
        targetResult,
      },
    }
  }

  async dispose(): Promise<void> {
    await this.config.sourceAdapter.dispose()
    await this.config.targetAdapter.dispose()
  }
}
