/**
 * Cost tracking — estimates cost of LLM API calls based on model pricing.
 * Prices are per 1M tokens (as of 2026).
 */

export interface ModelPricing {
  input: number; // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

// Pricing table (USD per 1M tokens)
const MODEL_PRICES: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  
  // Google Gemini
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  
  // Groq
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  
  // Mistral
  'mistral-large-latest': { input: 2, output: 6 },
  'mistral-small-latest': { input: 0.2, output: 0.6 },
  'mistral-medium-latest': { input: 2.7, output: 8.1 },
  
  // OpenRouter (free models)
  'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
  'meta-llama/llama-3.1-8b-instruct:free': { input: 0, output: 0 },
  'google/gemini-2.0-flash-exp:free': { input: 0, output: 0 },
};

// Default pricing for unknown models (estimated)
const DEFAULT_PRICING: ModelPricing = { input: 1, output: 3 };

export function getModelPricing(model: string): ModelPricing {
  // Try exact match
  if (MODEL_PRICES[model]) return MODEL_PRICES[model];
  
  // Try partial match (for OpenRouter models like "anthropic/claude-3.5-sonnet")
  for (const key of Object.keys(MODEL_PRICES)) {
    if (model.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(model.toLowerCase())) {
      return MODEL_PRICES[key];
    }
  }
  
  // Check if it's a free model
  if (model.includes(':free') || model.includes('free')) {
    return { input: 0, output: 0 };
  }
  
  return DEFAULT_PRICING;
}

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = getModelPricing(model);
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export interface CostTracker {
  totalCost: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  requests: Array<{
    model: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    timestamp: number;
  }>;
}

export function createCostTracker(): CostTracker {
  return {
    totalCost: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    requests: [],
  };
}

export function addRequest(
  tracker: CostTracker,
  model: string,
  promptTokens: number,
  completionTokens: number
): CostTracker {
  const cost = calculateCost(model, promptTokens, completionTokens);
  return {
    totalCost: tracker.totalCost + cost,
    totalPromptTokens: tracker.totalPromptTokens + promptTokens,
    totalCompletionTokens: tracker.totalCompletionTokens + completionTokens,
    requests: [
      ...tracker.requests,
      { model, promptTokens, completionTokens, cost, timestamp: Date.now() },
    ],
  };
}
