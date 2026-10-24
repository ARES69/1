/**
 * Slash commands — CLI-like commands for controlling the workspace.
 */

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string, context: CommandContext) => CommandResult;
}

export interface CommandContext {
  clearMessages: () => void;
  compactMessages: () => void;
  setModel: (model: string) => void;
  getCurrentModel: () => string;
  getCostSummary: () => string;
  getInstructions: () => string;
  setInstructions: (content: string) => void;
  initProject: () => void;
}

export interface CommandResult {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: '/help',
    description: 'Show available commands',
    usage: '/help',
    handler: () => ({
      type: 'info',
      message: `Available commands:
/help          Show this help message
/clear         Clear conversation history
/compact       Compress conversation to save context
/model <name>  Switch to a different model
/cost          Show session cost breakdown
/memory        Show project instructions (CLAUDE.md)
/memory <text> Update project instructions
/init          Initialize project with default instructions

Keyboard shortcuts:
Ctrl+K         Compact conversation
Ctrl+L         Clear conversation
Ctrl+M         Switch model
Esc            Stop generation
Ctrl+Enter     Send message`,
    }),
  },
  {
    name: '/clear',
    description: 'Clear conversation history',
    usage: '/clear',
    handler: (_, ctx) => {
      ctx.clearMessages();
      return { type: 'success', message: '✓ Conversation cleared' };
    },
  },
  {
    name: '/compact',
    description: 'Compress conversation to save context',
    usage: '/compact',
    handler: (_, ctx) => {
      ctx.compactMessages();
      return { type: 'success', message: '✓ Conversation compacted' };
    },
  },
  {
    name: '/model',
    description: 'Switch to a different model',
    usage: '/model <model-name>',
    handler: (args, ctx) => {
      if (!args.trim()) {
        return { type: 'info', message: `Current model: ${ctx.getCurrentModel()}\n\nUsage: /model <model-name>` };
      }
      ctx.setModel(args.trim());
      return { type: 'success', message: `✓ Switched to model: ${args.trim()}` };
    },
  },
  {
    name: '/cost',
    description: 'Show session cost breakdown',
    usage: '/cost',
    handler: (_, ctx) => ({
      type: 'info',
      message: ctx.getCostSummary(),
    }),
  },
  {
    name: '/memory',
    description: 'Show or update project instructions',
    usage: '/memory [text]',
    handler: (args, ctx) => {
      if (!args.trim()) {
        const instructions = ctx.getInstructions();
        if (!instructions) {
          return { type: 'info', message: 'No project instructions set.\n\nUsage: /memory <text> to set instructions\nOr use /init to load default template' };
        }
        return { type: 'info', message: `Project instructions (CLAUDE.md):\n\n${instructions}` };
      }
      ctx.setInstructions(args);
      return { type: 'success', message: '✓ Project instructions updated' };
    },
  },
  {
    name: '/init',
    description: 'Initialize project with default instructions',
    usage: '/init',
    handler: (_, ctx) => {
      ctx.initProject();
      return { type: 'success', message: '✓ Project initialized with default instructions' };
    },
  },
];

/**
 * Parse and execute a slash command.
 */
export function executeSlashCommand(input: string, context: CommandContext): CommandResult | null {
  if (!input.startsWith('/')) return null;
  
  const parts = input.split(' ');
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  const command = SLASH_COMMANDS.find(cmd => cmd.name === commandName);
  if (!command) {
    return { type: 'error', message: `Unknown command: ${commandName}\nType /help for available commands` };
  }
  
  return command.handler(args, context);
}

/**
 * Check if input is a slash command.
 */
export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith('/');
}
