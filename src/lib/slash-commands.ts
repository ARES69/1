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
  exportConversation?: (format: 'markdown' | 'json') => void;
  getContextStatus?: () => string;
  clearPermissions?: () => void;
  resumeSession?: () => void;
  gitCommit?: (message: string) => void;
  gitStatus?: () => string;
  gitLog?: () => string;
  deploy?: (provider: string) => void;
  showTemplates?: () => void;
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
/git           Git version control commands
/deploy        Deploy project to production
/template      Open template gallery

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
  {
    name: '/export',
    description: 'Export conversation to Markdown or JSON',
    usage: '/export [md|json]',
    handler: (args, ctx) => {
      if (!ctx.exportConversation) {
        return { type: 'error', message: 'Export not available' };
      }
      const format = args.trim() === 'json' ? 'json' : 'markdown';
      ctx.exportConversation(format as 'markdown' | 'json');
      return { type: 'success', message: `✓ Conversation exported as ${format}` };
    },
  },
  {
    name: '/context',
    description: 'Show context window usage',
    usage: '/context',
    handler: (_, ctx) => {
      if (!ctx.getContextStatus) {
        return { type: 'error', message: 'Context tracking not available' };
      }
      return { type: 'info', message: ctx.getContextStatus() };
    },
  },
  {
    name: '/permissions',
    description: 'Clear remembered permissions',
    usage: '/permissions clear',
    handler: (args, ctx) => {
      if (args.trim() === 'clear' && ctx.clearPermissions) {
        ctx.clearPermissions();
        return { type: 'success', message: '✓ Permissions cleared' };
      }
      return { type: 'info', message: 'Usage: /permissions clear' };
    },
  },
  {
    name: '/resume',
    description: 'Resume previous session',
    usage: '/resume',
    handler: (_, ctx) => {
      if (!ctx.resumeSession) {
        return { type: 'error', message: 'Session resume not available' };
      }
      ctx.resumeSession();
      return { type: 'success', message: '✓ Session resumed' };
    },
  },
  {
    name: '/git',
    description: 'Git version control commands',
    usage: '/git <commit|status|log>',
    handler: (args, ctx) => {
      const parts = args.trim().split(' ');
      const subcommand = parts[0];
      const subargs = parts.slice(1).join(' ');

      switch (subcommand) {
        case 'commit':
          if (!ctx.gitCommit) {
            return { type: 'error', message: 'Git not available' };
          }
          if (!subargs.trim()) {
            return { type: 'error', message: 'Usage: /git commit <message>' };
          }
          ctx.gitCommit(subargs.trim());
          return { type: 'success', message: `✓ Committed: ${subargs.trim()}` };
        
        case 'status':
          if (!ctx.gitStatus) {
            return { type: 'error', message: 'Git not available' };
          }
          return { type: 'info', message: ctx.gitStatus() };
        
        case 'log':
          if (!ctx.gitLog) {
            return { type: 'error', message: 'Git not available' };
          }
          return { type: 'info', message: ctx.gitLog() };
        
        default:
          return { 
            type: 'info', 
            message: `Git commands:
/git commit <message>  Create a commit
/git status            Show working tree status
/git log               Show commit history` 
          };
      }
    },
  },
  {
    name: '/deploy',
    description: 'Deploy project to production',
    usage: '/deploy [vercel|netlify|github]',
    handler: (args, ctx) => {
      if (!ctx.deploy) {
        return { type: 'error', message: 'Deploy not available' };
      }
      const provider = args.trim() || 'vercel';
      ctx.deploy(provider);
      return { type: 'success', message: `🚀 Deploying to ${provider}...` };
    },
  },
  {
    name: '/template',
    description: 'Open template gallery',
    usage: '/template',
    handler: (_, ctx) => {
      if (!ctx.showTemplates) {
        return { type: 'error', message: 'Templates not available' };
      }
      ctx.showTemplates();
      return { type: 'success', message: '📋 Opening template gallery...' };
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
