/**
 * Error recovery — automatic retry and recovery from failures.
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryState {
  attempt: number;
  lastError: string | null;
  nextRetryIn: number | null;
  canRetry: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

export function isRetryableError(error: string): boolean {
  const retryablePatterns = [
    'rate limit',
    '429',
    '503',
    '502',
    '504',
    'timeout',
    'network',
    'connection',
    'temporarily unavailable',
  ];

  const lowerError = error.toLowerCase();
  return retryablePatterns.some(pattern => lowerError.includes(pattern));
}

export function createRetryState(): RetryState {
  return {
    attempt: 0,
    lastError: null,
    nextRetryIn: null,
    canRetry: false,
  };
}

export function updateRetryState(
  state: RetryState,
  error: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): RetryState {
  const attempt = state.attempt + 1;
  const canRetry = attempt < config.maxRetries && isRetryableError(error);
  const nextRetryIn = canRetry ? calculateRetryDelay(attempt, config) : null;

  return {
    attempt,
    lastError: error,
    nextRetryIn,
    canRetry,
  };
}

export function formatRetryMessage(state: RetryState): string {
  if (!state.canRetry) {
    return `❌ Failed after ${state.attempt} attempts: ${state.lastError}`;
  }

  const seconds = Math.ceil((state.nextRetryIn || 0) / 1000);
  return `⏳ Retrying in ${seconds}s (attempt ${state.attempt + 1}/${DEFAULT_RETRY_CONFIG.maxRetries})...`;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (state: RetryState) => void
): Promise<T> {
  let state = createRetryState();

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      state = updateRetryState(state, errorMessage, config);

      if (!state.canRetry) {
        throw error;
      }

      onRetry?.(state);

      if (state.nextRetryIn !== null) {
        await new Promise(resolve => setTimeout(resolve, state.nextRetryIn ?? 1000));
      }
    }
  }

  throw new Error(state.lastError || 'Max retries exceeded');
}
