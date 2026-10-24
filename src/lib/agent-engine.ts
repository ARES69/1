/**
 * Streaming Agent Engine — executes LLM with tool-calling loop using streaming.
 * Tokens appear in real-time as they're generated.
 */

import { createProvider, type LLMMessage, type LLMResponse, type ToolDefinition, type ToolCall } from './llm-providers';
import { streamChat, type StreamDelta } from './streaming';
import { VirtualFS } from './virtual-fs';
import type { ProviderKey } from './settings';

/* ─── Event types emitted during agent execution ─── */
export type AgentEvent =
  | { type: 'token'; content: string }  // Streaming token
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; tool: string; args: Record<string, any>; result: string }
  | { type: 'tool_call_streaming'; tool: string; argsPartial: string }  // Tool call being streamed
  | { type: 'console'; content: string }
  | { type: 'file_written'; path: string; size: number }
  | { type: 'file_read'; path: string }
  | { type: 'error'; message: string }
  | { type: 'progress'; step: number; total: number; label: string }
  | { type: 'done'; artifact: string | null; summary: string }
  | { type: 'usage'; prompt_tokens: number; completion_tokens: number };

/* ─── Tool definitions ─── */
const TOOLS: ToolDefinition[] = [
  {
    name: 'write_file',
    description: 'Write content to a file in the project. Creates parent directories automatically.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root (e.g. "index.html" or "src/app.js")' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the content of an existing file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files in the project or in a specific directory.',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Directory to list (optional, defaults to root)' },
      },
      required: [],
    },
  },
  {
    name: 'edit_file',
    description: 'Edit a file by replacing a specific section. Use for small targeted changes.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to edit' },
        old_text: { type: 'string', description: 'Text to find and replace' },
        new_text: { type: 'string', description: 'Replacement text' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the project.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_code',
    description: 'Execute JavaScript/TypeScript code in the sandbox. Returns the result.',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
      },
      required: ['code'],
    },
  },
  {
    name: 'finish',
    description: 'Signal that the artifact is complete and ready for delivery.',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Brief summary of what was built' },
        entry_file: { type: 'string', description: 'Main entry file path (e.g. "index.html")' },
      },
      required: ['summary', 'entry_file'],
    },
  },
];

/* ─── System prompt ─── */
const SYSTEM_PROMPT = `You are RS-BUILDER, an AI agent that builds real software artifacts. You write actual code, not advice.

RULES:
1. ALWAYS use tools to create files. Never just describe what to build.
2. Write complete, working code. No placeholders or TODOs.
3. For web projects, create a self-contained index.html with inline CSS/JS when possible.
4. Use write_file for new files, edit_file for modifications.
5. Test your code with run_code when logic is involved.
6. When finished, call the "finish" tool with a summary and the entry file path.
7. Be concise in your thinking — focus on action.
8. If the user asks for a website/landing page, make it responsive and visually polished.
9. For games, use HTML canvas with requestAnimationFrame.
10. Always produce a working, complete artifact.

You have access to a virtual filesystem. All files you create will be available to the user.
`;

/* ─── Tool executor ─── */
class ToolExecutor {
  private fs: VirtualFS;
  private onEvent: (event: AgentEvent) => void;

  constructor(fs: VirtualFS, onEvent: (event: AgentEvent) => void) {
    this.fs = fs;
    this.onEvent = onEvent;
  }

  async execute(toolCall: ToolCall): Promise<string> {
    const { name, arguments: args } = toolCall;

    try {
      switch (name) {
        case 'write_file': {
          const { path, content } = args;
          this.fs.write(path, content);
          this.onEvent({ type: 'file_written', path, size: content.length });
          return `✓ Written ${content.length} bytes to ${path}`;
        }

        case 'read_file': {
          const { path } = args;
          const content = this.fs.read(path);
          if (content === null) {
            return `✗ File not found: ${path}`;
          }
          this.onEvent({ type: 'file_read', path });
          return content;
        }

        case 'list_files': {
          const { directory } = args;
          const files = this.fs.list(directory || undefined);
          if (files.length === 0) return '(empty project)';
          return files.map(f => `${f.type === 'folder' ? '📁' : '📄'} ${f.path}`).join('\n');
        }

        case 'edit_file': {
          const { path, old_text, new_text } = args;
          const content = this.fs.read(path);
          if (content === null) {
            return `✗ File not found: ${path}`;
          }
          if (!content.includes(old_text)) {
            return `✗ Text not found in ${path}. Make sure old_text matches exactly.`;
          }
          const updated = content.replace(old_text, new_text);
          this.fs.write(path, updated);
          this.onEvent({ type: 'file_written', path, size: updated.length });
          return `✓ Updated ${path}`;
        }

        case 'delete_file': {
          const { path } = args;
          const deleted = this.fs.delete(path);
          return deleted ? `✓ Deleted ${path}` : `✗ File not found: ${path}`;
        }

        case 'run_code': {
          const { code } = args;
          return this.executeCode(code);
        }

        case 'finish': {
          return 'finish';
        }

        default:
          return `✗ Unknown tool: ${name}`;
      }
    } catch (e: any) {
      return `✗ Error in ${name}: ${e.message}`;
    }
  }

  private executeCode(code: string): string {
    try {
      const logs: string[] = [];
      const sandboxConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
      };

      const wrappedCode = `
        (function() {
          const console = { log: __log, error: __error, warn: __warn };
          ${code}
        })()
      `;

      const fn = new Function('__log', '__error', '__warn', `return ${wrappedCode}`);
      const result = fn(sandboxConsole.log, sandboxConsole.error, sandboxConsole.warn);

      if (logs.length > 0) {
        this.onEvent({ type: 'console', content: logs.join('\n') });
      }

      if (result !== undefined) {
        const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        return `Result: ${resultStr}`;
      }

      return logs.length > 0 ? logs.join('\n') : '✓ Code executed successfully';
    } catch (e: any) {
      this.onEvent({ type: 'console', content: `[ERROR] ${e.message}` });
      return `✗ Execution error: ${e.message}`;
    }
  }
}

/* ─── Agent run controller with streaming ─── */
export interface AgentRunOptions {
  provider: ProviderKey;
  prompt: string;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
  maxIterations?: number;
  projectInstructions?: string;
}

export async function runAgent(options: AgentRunOptions): Promise<{ fs: VirtualFS; artifact: string | null }> {
  const { provider: providerConfig, prompt, onEvent, signal, maxIterations = 25, projectInstructions } = options;
  const fs = new VirtualFS();
  const executor = new ToolExecutor(fs, onEvent);

  // Build system prompt with project instructions
  let systemPrompt = SYSTEM_PROMPT;
  if (projectInstructions?.trim()) {
    systemPrompt += `\n\n<project_instructions>\n${projectInstructions}\n</project_instructions>\n\nFollow these project-specific instructions when generating code.`;
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  let iteration = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let artifact: string | null = null;
  let finished = false;

  while (iteration < maxIterations && !finished) {
    if (signal?.aborted) {
      onEvent({ type: 'error', message: 'Run cancelled by user' });
      break;
    }

    iteration++;
    onEvent({ type: 'progress', step: iteration, total: maxIterations, label: `Iteration ${iteration}` });

    // Stream response from LLM
    let fullContent = '';
    let toolCalls: ToolCall[] = [];
    let currentToolCall: Partial<ToolCall> | null = null;
    let usageInfo: { prompt_tokens: number; completion_tokens: number } | null = null;

    try {
      onEvent({ type: 'thinking', content: `Calling ${providerConfig.name} (${providerConfig.model})...` });
      
      const stream = streamChat(providerConfig, messages, TOOLS, signal);
      
      for await (const delta of stream) {
        if (signal?.aborted) break;

        switch (delta.type) {
          case 'content':
            if (delta.content) {
              fullContent += delta.content;
              onEvent({ type: 'token', content: delta.content });
            }
            break;
          
          case 'tool_call_start':
            currentToolCall = {
              id: delta.toolCallId || '',
              name: delta.toolCallName || '',
              arguments: {},
            };
            onEvent({ type: 'tool_call_streaming', tool: delta.toolCallName || '', argsPartial: '' });
            break;
          
          case 'tool_call_delta':
            if (currentToolCall && delta.toolCallArgs) {
              // Accumulate JSON arguments
              try {
                const argsStr = (currentToolCall as any)._argsStr || '';
                (currentToolCall as any)._argsStr = argsStr + delta.toolCallArgs;
                onEvent({ type: 'tool_call_streaming', tool: currentToolCall.name || '', argsPartial: (currentToolCall as any)._argsStr });
              } catch {}
            }
            break;
          
          case 'tool_call_end':
            if (currentToolCall) {
              // Parse accumulated arguments
              try {
                const argsStr = (currentToolCall as any)._argsStr || '{}';
                currentToolCall.arguments = JSON.parse(argsStr);
                toolCalls.push(currentToolCall as ToolCall);
              } catch (e) {
                console.warn('Failed to parse tool call arguments:', e);
              }
              currentToolCall = null;
            }
            break;
          
          case 'usage':
            if (delta.usage) {
              usageInfo = delta.usage;
            }
            break;
          
          case 'error':
            throw new Error(delta.error || 'Stream error');
          
          case 'done':
            break;
        }
      }
    } catch (e: any) {
      let errorMsg = e.message;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS')) {
        errorMsg = `Cannot connect to ${providerConfig.name} API. This is likely due to CORS restrictions. Try:\n• Use OpenRouter (openrouter.ai) - supports browser requests\n• Check your network connection`;
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        errorMsg = `Invalid API key for ${providerConfig.name}. Please check your key in Settings.`;
      } else if (errorMsg.includes('429')) {
        errorMsg = `Rate limit exceeded for ${providerConfig.name}. Please wait or try a different provider.`;
      }
      onEvent({ type: 'error', message: errorMsg });
      break;
    }

    // Track usage
    if (usageInfo) {
      totalPromptTokens += usageInfo.prompt_tokens;
      totalCompletionTokens += usageInfo.completion_tokens;
      onEvent({ type: 'usage', prompt_tokens: totalPromptTokens, completion_tokens: totalCompletionTokens });
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      artifact = buildArtifact(fs);
      onEvent({ type: 'done', artifact, summary: fullContent || 'Task completed' });
      finished = true;
      break;
    }

    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: fullContent || '',
      tool_calls: toolCalls,
    });

    // Execute each tool call
    for (const tc of toolCalls) {
      if (signal?.aborted) break;

      // Check for finish tool
      if (tc.name === 'finish') {
        const summary = tc.arguments.summary || 'Task completed';
        const entryFile = tc.arguments.entry_file || 'index.html';
        
        const entryContent = fs.read(entryFile);
        if (entryContent) {
          artifact = buildArtifactFromEntry(fs, entryFile, entryContent);
        } else {
          artifact = buildArtifact(fs);
        }

        onEvent({ type: 'tool_call', tool: 'finish', args: tc.arguments, result: 'done' });
        onEvent({ type: 'done', artifact, summary });
        finished = true;
        break;
      }

      // Execute tool
      onEvent({ type: 'tool_call', tool: tc.name, args: tc.arguments, result: '...' });
      const result = await executor.execute(tc);
      onEvent({ type: 'tool_call', tool: tc.name, args: tc.arguments, result });

      messages.push({
        role: 'tool',
        content: result,
        tool_call_id: tc.id,
        name: tc.name,
      });
    }
  }

  if (!finished) {
    if (iteration >= maxIterations) {
      onEvent({ type: 'error', message: `Max iterations (${maxIterations}) reached` });
    }
    artifact = buildArtifact(fs);
    if (!finished) {
      onEvent({ type: 'done', artifact, summary: 'Run ended' });
    }
  }

  return { fs, artifact };
}

/* ─── Artifact builders ─── */
function buildArtifact(fs: VirtualFS): string | null {
  const indexHtml = fs.read('index.html');
  if (indexHtml) {
    return buildArtifactFromEntry(fs, 'index.html', indexHtml);
  }

  const allFiles = fs.getAll();
  const htmlFile = allFiles.find(f => f.path.endsWith('.html'));
  if (htmlFile) {
    return buildArtifactFromEntry(fs, htmlFile.path, htmlFile.content);
  }

  if (allFiles.length === 0) return null;
  return buildFallbackArtifact(allFiles);
}

function buildArtifactFromEntry(fs: VirtualFS, entryPath: string, entryContent: string): string {
  if (entryContent.includes('</html>') && !entryContent.includes('src="') && !entryContent.includes('href="')) {
    return entryContent;
  }

  let html = entryContent;
  const allFiles = fs.getAll();

  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (match, href) => {
    const cssFile = allFiles.find(f => f.path === href || f.path.endsWith('/' + href));
    if (cssFile) {
      return `<style>${cssFile.content}</style>`;
    }
    return match;
  });

  html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
    const jsFile = allFiles.find(f => f.path === src || f.path.endsWith('/' + src));
    if (jsFile) {
      return `<script>${jsFile.content}</script>`;
    }
    return match;
  });

  return html;
}

function buildFallbackArtifact(files: { path: string; content: string }[]): string {
  const fileList = files.map(f => `
    <div class="file">
      <h3>${f.path}</h3>
      <pre><code>${escapeHtml(f.content)}</code></pre>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RS-BUILDER Output</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    h1 { color: #818cf8; margin-bottom: 1rem; }
    .file { margin-bottom: 2rem; padding: 1rem; background: #1e293b; border-radius: 8px; border: 1px solid #334155; }
    .file h3 { color: #a5b4fc; margin-bottom: 0.5rem; font-family: monospace; }
    pre { overflow-x: auto; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>📦 Generated Files</h1>
  <p style="color: #94a3b8; margin-bottom: 2rem;">No HTML entry point found. Here are the generated files:</p>
  ${fileList}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
