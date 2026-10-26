/**
 * Conversation export — export chat history to Markdown or JSON.
 */

import type { ThreadMessage } from './types';

export type ExportFormat = 'markdown' | 'json';

export function exportConversation(
  messages: ThreadMessage[],
  format: ExportFormat,
  projectName: string
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${projectName.replace(/\s+/g, '_')}_${timestamp}`;

  if (format === 'json') {
    return JSON.stringify({
      project: projectName,
      exportedAt: new Date().toISOString(),
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        tool: m.tool,
        result: m.result,
        timestamp: m.timestamp,
      })),
    }, null, 2);
  }

  // Markdown format
  let md = `# ${projectName}\n\n`;
  md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

  for (const msg of messages) {
    switch (msg.type) {
      case 'user':
        md += `## 👤 User\n\n${msg.content}\n\n`;
        break;
      case 'thinking':
        md += `## 🧠 Thinking\n\n${msg.content}\n\n`;
        break;
      case 'tool_call':
        md += `## 🔧 Tool Call: ${msg.tool || 'unknown'}\n\n`;
        md += `**Arguments:**\n\`\`\`json\n${msg.content}\n\`\`\`\n\n`;
        if (msg.result) {
          md += `**Result:**\n\`\`\`\n${msg.result}\n\`\`\`\n\n`;
        }
        break;
      case 'system':
        md += `## ℹ️ System\n\n${msg.content}\n\n`;
        break;
      case 'error':
        md += `## ❌ Error\n\n${msg.content}\n\n`;
        break;
    }
    md += `---\n\n`;
  }

  return md;
}

export function downloadExport(content: string, filename: string, format: ExportFormat): void {
  const extension = format === 'json' ? 'json' : 'md';
  const mimeType = format === 'json' ? 'application/json' : 'text/markdown';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
