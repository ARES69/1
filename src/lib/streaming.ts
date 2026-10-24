/**
 * Streaming LLM provider — returns tokens as they arrive via SSE.
 * Supports OpenAI-compatible streaming (OpenRouter, Groq, OpenAI, Mistral, custom).
 */

import type { ProviderKey } from './settings';
import type { ToolDefinition, LLMMessage, ToolCall } from './llm-providers';

export interface StreamDelta {
  type: 'content' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'done' | 'error' | 'usage';
  content?: string;
  toolCallIndex?: number;
  toolCallId?: string;
  toolCallName?: string;
  toolCallArgs?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: string;
}

/**
 * Stream chat completions from an OpenAI-compatible provider.
 * Yields deltas as tokens arrive.
 */
export async function* streamChat(
  config: ProviderKey,
  messages: LLMMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<StreamDelta> {
  // Only OpenAI-compatible providers support streaming from browser
  if (config.id === 'anthropic') {
    // Anthropic streaming requires special handling — fall back to non-streaming
    yield* streamAnthropicFallback(config, messages, tools, signal);
    return;
  }
  if (config.id === 'gemini') {
    yield* streamGeminiFallback(config, messages, tools, signal);
    return;
  }

  const url = `${config.baseUrl}/chat/completions`;
  const body: any = {
    model: config.model,
    messages: messages.map(m => {
      const msg: any = { role: m.role, content: m.content || '' };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      if (m.name) msg.name = m.name;
      return msg;
    }),
    stream: true,
    stream_options: { include_usage: true },
  };

  if (tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
    body.tool_choice = 'auto';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };
  if (config.id === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'RS-BUILDER';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (e: any) {
    yield { type: 'error', error: e.message };
    return;
  }

  if (!res.ok) {
    const errText = await res.text();
    yield { type: 'error', error: `${config.name} API error (${res.status}): ${errText}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentToolIndex = -1;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          yield { type: 'done' };
          return;
        }

        try {
          const json = JSON.parse(data);
          
          // Usage info (usually in last chunk)
          if (json.usage) {
            yield { type: 'usage', usage: json.usage };
          }

          const choice = json.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta;
          if (!delta) continue;

          // Content delta
          if (delta.content) {
            yield { type: 'content', content: delta.content };
          }

          // Tool call deltas
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.index !== currentToolIndex) {
                // New tool call started
                if (currentToolIndex >= 0) {
                  yield { type: 'tool_call_end', toolCallIndex: currentToolIndex };
                }
                currentToolIndex = tc.index;
                yield {
                  type: 'tool_call_start',
                  toolCallIndex: tc.index,
                  toolCallId: tc.id,
                  toolCallName: tc.function?.name || '',
                };
              }
              if (tc.function?.arguments) {
                yield {
                  type: 'tool_call_delta',
                  toolCallIndex: tc.index,
                  toolCallArgs: tc.function.arguments,
                };
              }
            }
          }

          // Finish reason
          if (choice.finish_reason) {
            if (currentToolIndex >= 0) {
              yield { type: 'tool_call_end', toolCallIndex: currentToolIndex };
            }
            yield { type: 'done' };
            return;
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: 'done' };
}

/* ─── Fallback for Anthropic (non-streaming) ─── */
async function* streamAnthropicFallback(
  config: ProviderKey,
  messages: LLMMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<StreamDelta> {
  const { createProvider } = await import('./llm-providers');
  const provider = createProvider(config);
  try {
    const response = await provider.chat(messages, tools);
    if (response.content) {
      // Simulate streaming by yielding content in chunks
      const words = response.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield { type: 'content', content: (i > 0 ? ' ' : '') + words[i] };
        await new Promise(r => setTimeout(r, 10));
      }
    }
    for (const tc of response.tool_calls) {
      yield { type: 'tool_call_start', toolCallIndex: 0, toolCallId: tc.id, toolCallName: tc.name };
      yield { type: 'tool_call_delta', toolCallIndex: 0, toolCallArgs: JSON.stringify(tc.arguments) };
      yield { type: 'tool_call_end', toolCallIndex: 0 };
    }
    if (response.usage) {
      yield { type: 'usage', usage: response.usage };
    }
    yield { type: 'done' };
  } catch (e: any) {
    yield { type: 'error', error: e.message };
  }
}

/* ─── Fallback for Gemini (non-streaming) ─── */
async function* streamGeminiFallback(
  config: ProviderKey,
  messages: LLMMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<StreamDelta> {
  const { createProvider } = await import('./llm-providers');
  const provider = createProvider(config);
  try {
    const response = await provider.chat(messages, tools);
    if (response.content) {
      const words = response.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield { type: 'content', content: (i > 0 ? ' ' : '') + words[i] };
        await new Promise(r => setTimeout(r, 10));
      }
    }
    for (const tc of response.tool_calls) {
      yield { type: 'tool_call_start', toolCallIndex: 0, toolCallId: tc.id, toolCallName: tc.name };
      yield { type: 'tool_call_delta', toolCallIndex: 0, toolCallArgs: JSON.stringify(tc.arguments) };
      yield { type: 'tool_call_end', toolCallIndex: 0 };
    }
    yield { type: 'done' };
  } catch (e: any) {
    yield { type: 'error', error: e.message };
  }
}
