/**
 * Context window management — track token usage and auto-compact.
 */

import type { ThreadMessage } from './types';

// Approximate tokens per character (varies by model, this is a rough estimate)
const CHARS_PER_TOKEN = 4;

export interface ContextWindow {
  maxTokens: number;
  usedTokens: number;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function calculateContextUsage(
  messages: ThreadMessage[],
  maxTokens: number = 128000 // Default to Claude 3.5 Sonnet context window
): ContextWindow {
  let totalTokens = 0;
  
  for (const msg of messages) {
    totalTokens += estimateTokens(msg.content);
    if (msg.tool) {
      totalTokens += estimateTokens(msg.tool);
    }
    if (msg.result) {
      totalTokens += estimateTokens(msg.result);
    }
  }

  const percentage = (totalTokens / maxTokens) * 100;
  let status: 'ok' | 'warning' | 'critical' = 'ok';
  
  if (percentage >= 80) {
    status = 'critical';
  } else if (percentage >= 60) {
    status = 'warning';
  }

  return {
    maxTokens,
    usedTokens: totalTokens,
    percentage,
    status,
  };
}

export function shouldAutoCompact(context: ContextWindow): boolean {
  return context.percentage >= 75;
}

export function compactMessages(messages: ThreadMessage[], keepLast: number = 10): ThreadMessage[] {
  if (messages.length <= keepLast) return messages;
  
  // Keep system messages and last N messages
  const systemMessages = messages.filter(m => m.type === 'system');
  const recentMessages = messages.slice(-keepLast);
  
  // Add a summary message
  const summary: ThreadMessage = {
    id: 'compact-' + Date.now(),
    type: 'system',
    content: `📦 Conversation compacted. Kept last ${keepLast} messages.`,
    timestamp: Date.now(),
  };

  return [...systemMessages.slice(-2), summary, ...recentMessages];
}

export function formatContextStatus(context: ContextWindow): string {
  const icon = context.status === 'critical' ? '🔴' : context.status === 'warning' ? '🟡' : '🟢';
  return `${icon} ${context.usedTokens.toLocaleString()} / ${context.maxTokens.toLocaleString()} tokens (${context.percentage.toFixed(1)}%)`;
}
