/**
 * LLM Provider implementations.
 * Each provider implements a unified interface for chat completions with tool calling.
 */

import type { ProviderKey } from './settings';

/* ─── Types ─── */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface LLMResponse {
  content: string | null;
  tool_calls: ToolCall[];
  finish_reason: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface LLMProvider {
  chat(messages: LLMMessage[], tools: ToolDefinition[]): Promise<LLMResponse>;
}

/* ─── OpenAI-compatible provider (works for OpenAI, Groq, OpenRouter, Mistral, custom) ─── */
function createOpenAICompatibleProvider(config: ProviderKey): LLMProvider {
  return {
    async chat(messages: LLMMessage[], tools: ToolDefinition[]): Promise<LLMResponse> {
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
      };

      if (tools.length > 0) {
        body.tools = tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
        body.tool_choice = 'auto';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      };

      // OpenRouter needs extra headers
      if (config.id === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'RS-BUILDER';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${config.name} API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error(`${config.name}: No response choice`);

      const toolCalls: ToolCall[] = (choice.message?.tool_calls || []).map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}'),
      }));

      return {
        content: choice.message?.content || null,
        tool_calls: toolCalls,
        finish_reason: choice.finish_reason || 'stop',
        usage: data.usage,
      };
    },
  };
}

/* ─── Anthropic provider ─── */
function createAnthropicProvider(config: ProviderKey): LLMProvider {
  return {
    async chat(messages: LLMMessage[], tools: ToolDefinition[]): Promise<LLMResponse> {
      const url = `${config.baseUrl}/v1/messages`;

      // Extract system message
      const systemMsg = messages.find(m => m.role === 'system');
      const nonSystemMsgs = messages.filter(m => m.role !== 'system');

      // Convert to Anthropic format
      const anthropicMessages = nonSystemMsgs.map(m => {
        if (m.role === 'assistant' && m.tool_calls?.length) {
          return {
            role: 'assistant' as const,
            content: [
              ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
              ...m.tool_calls.map(tc => ({
                type: 'tool_use' as const,
                id: tc.id,
                name: tc.name,
                input: tc.arguments,
              })),
            ],
          };
        }
        if (m.role === 'tool') {
          return {
            role: 'user' as const,
            content: [{
              type: 'tool_result' as const,
              tool_use_id: m.tool_call_id,
              content: m.content || '',
            }],
          };
        }
        return { role: m.role as 'user' | 'assistant', content: m.content || '' };
      });

      // Merge consecutive same-role messages
      const merged: any[] = [];
      for (const msg of anthropicMessages) {
        if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
          const prev = merged[merged.length - 1];
          const prevContent = Array.isArray(prev.content) ? prev.content : [{ type: 'text', text: prev.content }];
          const curContent = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];
          prev.content = [...prevContent, ...curContent];
        } else {
          merged.push({ ...msg });
        }
      }

      const body: any = {
        model: config.model,
        max_tokens: 4096,
        messages: merged,
      };

      if (systemMsg) {
        body.system = systemMsg.content;
      }

      if (tools.length > 0) {
        body.tools = tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        }));
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const toolCalls: ToolCall[] = [];
      let content = '';

      for (const block of data.content || []) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input || {},
          });
        }
      }

      return {
        content: content || null,
        tool_calls: toolCalls,
        finish_reason: data.stop_reason === 'end_turn' ? 'stop' : 'tool_calls',
        usage: data.usage ? { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens } : undefined,
      };
    },
  };
}

/* ─── Google Gemini provider ─── */
function createGeminiProvider(config: ProviderKey): LLMProvider {
  return {
    async chat(messages: LLMMessage[], tools: ToolDefinition[]): Promise<LLMResponse> {
      const model = config.model || 'gemini-2.0-flash';
      const url = `${config.baseUrl}/models/${model}:generateContent?key=${config.apiKey}`;

      // Convert messages to Gemini format
      const systemMsg = messages.find(m => m.role === 'system');
      const contents: any[] = [];

      for (const msg of messages) {
        if (msg.role === 'system') continue;
        
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
        } else if (msg.role === 'assistant') {
          const parts: any[] = [];
          if (msg.content) parts.push({ text: msg.content });
          if (msg.tool_calls) {
            for (const tc of msg.tool_calls) {
              parts.push({ functionCall: { name: tc.name, args: tc.arguments } });
            }
          }
          contents.push({ role: 'model', parts });
        } else if (msg.role === 'tool') {
          contents.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: msg.name || 'tool',
                response: { result: msg.content || '' },
              },
            }],
          });
        }
      }

      const body: any = { contents };

      if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content || '' }] };
      }

      if (tools.length > 0) {
        body.tools = [{
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }];
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error('Gemini: No response candidate');

      const toolCalls: ToolCall[] = [];
      let content = '';

      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          content += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: 'gemini-' + Math.random().toString(36).slice(2),
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }

      return {
        content: content || null,
        tool_calls: toolCalls,
        finish_reason: candidate.finishReason === 'STOP' ? 'stop' : 'tool_calls',
      };
    },
  };
}

/* ─── Factory ─── */
export function createProvider(config: ProviderKey): LLMProvider {
  switch (config.id) {
    case 'anthropic':
      return createAnthropicProvider(config);
    case 'gemini':
      return createGeminiProvider(config);
    default:
      // OpenAI-compatible: OpenAI, Groq, OpenRouter, Mistral, custom
      return createOpenAICompatibleProvider(config);
  }
}

/**
 * Test a provider connection by sending a simple message.
 */
export async function testProvider(config: ProviderKey): Promise<{ success: boolean; error?: string; model?: string }> {
  try {
    const provider = createProvider(config);
    const response = await provider.chat(
      [{ role: 'user', content: 'Reply with just "OK".' }],
      []
    );
    return { success: true, model: config.model };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
