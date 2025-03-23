/**
 * Configuration object for an adapter.
 * This will be extended by specific adapter implementations
 * to include their own configuration needs.
 */
export interface AdapterConfig {
  id: string
  name: string
}

/**
 * Result object returned by adapters
 */
export interface AdapterResult {
  answer: boolean
  timestamp: Date // when this result was generated
  metadata?: Record<string, unknown> // additional context about the result
}

/**
 * Base interface for all truth source adapters
 */
export interface TruthAdapter<T extends AdapterConfig = AdapterConfig> {
  /**
   * Initialize the adapter with its configuration
   */
  init(config: T): Promise<void>

  /**
   * Evaluate the current state and return a yes/no answer
   */
  evaluate(): Promise<AdapterResult>

  /**
   * Clean up any resources used by the adapter
   */
  dispose(): Promise<void>
}
