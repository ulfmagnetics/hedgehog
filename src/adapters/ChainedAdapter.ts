import type { TruthAdapter, AdapterConfig, AdapterResult } from './types.js'

// For most use cases, this two-adapter approach is probably sufficient,
// and if you need more complex chains, you might want to consider a different
// pattern like a pipeline or middleware approach.

export interface ChainedAdapterConfig<S extends AdapterConfig, T extends AdapterConfig>
  extends AdapterConfig {
  sourceAdapter: TruthAdapter<S>
  targetAdapter: TruthAdapter<T>
  sourceConfig: S
  targetConfig: T
  transformResult?: (result: AdapterResult) => T
}

export class ChainedAdapter<S extends AdapterConfig, T extends AdapterConfig>
  implements TruthAdapter<ChainedAdapterConfig<S, T>>
{
  private config!: ChainedAdapterConfig<S, T>

  async init(config: ChainedAdapterConfig<S, T>): Promise<void> {
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
