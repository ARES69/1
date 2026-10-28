/**
 * MCP Ecosystem — extended collection of built-in MCP servers.
 * Provides integrations with popular services and APIs.
 */

import type { MCPServer } from './mcp-client';

/* ─── Extended MCP Server Definitions ─── */

export const EXTENDED_MCP_SERVERS: MCPServer[] = [
  // Development Tools
  {
    id: 'github-extended',
    name: 'GitHub (Extended)',
    url: 'https://api.github.com',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_repos',
        description: 'List user repositories',
        inputSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'GitHub username' },
            sort: { type: 'string', description: 'Sort by (created, updated, pushed, full_name)' },
            per_page: { type: 'number', description: 'Results per page (max 100)' },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_repo',
        description: 'Get repository details',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_issues',
        description: 'List repository issues',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', description: 'Issue state (open, closed, all)' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue body' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'get_file_content',
        description: 'Get file content from repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path' },
            ref: { type: 'string', description: 'Branch or commit SHA' },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
    ],
  },

  // Data & Analytics
  {
    id: 'weather-extended',
    name: 'Weather (Extended)',
    url: 'https://api.openweathermap.org/data/2.5',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            units: { type: 'string', description: 'Units (metric, imperial, standard)' },
          },
          required: ['city'],
        },
      },
      {
        name: 'get_forecast',
        description: 'Get 5-day weather forecast',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
            units: { type: 'string', description: 'Units (metric, imperial, standard)' },
          },
          required: ['city'],
        },
      },
    ],
  },

  // Communication
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://slack.com/api',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_channels',
        description: 'List Slack channels',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of channels' },
          },
          required: [],
        },
      },
      {
        name: 'send_message',
        description: 'Send message to channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            text: { type: 'string', description: 'Message text' },
          },
          required: ['channel', 'text'],
        },
      },
    ],
  },

  // Project Management
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://api.notion.com/v1',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_pages',
        description: 'List Notion pages',
        inputSchema: {
          type: 'object',
          properties: {
            database_id: { type: 'string', description: 'Database ID' },
            page_size: { type: 'number', description: 'Number of pages to return' },
          },
          required: ['database_id'],
        },
      },
      {
        name: 'create_page',
        description: 'Create a new page',
        inputSchema: {
          type: 'object',
          properties: {
            parent_id: { type: 'string', description: 'Parent page or database ID' },
            title: { type: 'string', description: 'Page title' },
            content: { type: 'string', description: 'Page content' },
          },
          required: ['parent_id', 'title'],
        },
      },
    ],
  },

  // Database
  {
    id: 'supabase',
    name: 'Supabase',
    url: 'https://api.supabase.com/v1',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'query',
        description: 'Execute SQL query',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL query' },
          },
          required: ['sql'],
        },
      },
      {
        name: 'list_tables',
        description: 'List database tables',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  },

  // AI & ML
  {
    id: 'huggingface',
    name: 'Hugging Face',
    url: 'https://api-inference.huggingface.co/models',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'text_generation',
        description: 'Generate text using AI model',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Model name' },
            prompt: { type: 'string', description: 'Input prompt' },
            max_length: { type: 'number', description: 'Maximum output length' },
          },
          required: ['model', 'prompt'],
        },
      },
      {
        name: 'text_classification',
        description: 'Classify text',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Model name' },
            text: { type: 'string', description: 'Text to classify' },
          },
          required: ['model', 'text'],
        },
      },
    ],
  },

  // File Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    url: 'https://api.dropboxapi.com/2',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_files',
        description: 'List files in folder',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Folder path' },
          },
          required: [],
        },
      },
      {
        name: 'upload_file',
        description: 'Upload file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'download_file',
        description: 'Download file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
          },
          required: ['path'],
        },
      },
    ],
  },

  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    url: 'https://api.stripe.com/v1',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_customers',
        description: 'List customers',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of customers' },
          },
          required: [],
        },
      },
      {
        name: 'create_payment_intent',
        description: 'Create payment intent',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'Amount in cents' },
            currency: { type: 'string', description: 'Currency code' },
          },
          required: ['amount', 'currency'],
        },
      },
    ],
  },

  // Analytics
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    url: 'https://api.mixpanel.com',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'track_event',
        description: 'Track analytics event',
        inputSchema: {
          type: 'object',
          properties: {
            event: { type: 'string', description: 'Event name' },
            properties: { type: 'object', description: 'Event properties' },
          },
          required: ['event'],
        },
      },
    ],
  },

  // Monitoring
  {
    id: 'sentry',
    name: 'Sentry',
    url: 'https://sentry.io/api/0',
    apiKey: '',
    enabled: false,
    tools: [
      {
        name: 'list_projects',
        description: 'List Sentry projects',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_issues',
        description: 'List project issues',
        inputSchema: {
          type: 'object',
          properties: {
            project_slug: { type: 'string', description: 'Project slug' },
          },
          required: ['project_slug'],
        },
      },
    ],
  },
];

export type { MCPServer } from './mcp-client';

/* ─── MCP Server Categories ─── */

export const MCP_CATEGORIES = {
  development: ['github-extended'],
  data: ['weather-extended'],
  communication: ['slack'],
  project_management: ['notion'],
  database: ['supabase'],
  ai_ml: ['huggingface'],
  storage: ['dropbox'],
  payment: ['stripe'],
  analytics: ['mixpanel'],
  monitoring: ['sentry'],
};

/* ─── Helper Functions ─── */

/**
 * Get MCP servers by category
 */
export function getMCPServersByCategory(category: keyof typeof MCP_CATEGORIES): MCPServer[] {
  const serverIds = MCP_CATEGORIES[category];
  return EXTENDED_MCP_SERVERS.filter(server => serverIds.includes(server.id));
}

/**
 * Get all available MCP server categories
 */
export function getMCPCategories(): Array<{ id: string; name: string; count: number }> {
  return Object.entries(MCP_CATEGORIES).map(([id, serverIds]) => ({
    id,
    name: id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: serverIds.length,
  }));
}

/**
 * Search MCP servers by name or description
 */
export function searchMCPServers(query: string): MCPServer[] {
  const lowerQuery = query.toLowerCase();
  return EXTENDED_MCP_SERVERS.filter(server => 
    server.name.toLowerCase().includes(lowerQuery) ||
    server.tools.some(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery)
    )
  );
}
