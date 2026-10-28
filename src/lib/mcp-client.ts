/**
 * MCP (Model Context Protocol) Client — connect external tools and services.
 * Enables integration with GitHub, Jira, databases, and custom MCP servers.
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  tools: MCPTool[];
}

export interface MCPRequest {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  content: string;
  isError?: boolean;
}

const MCP_SERVERS_KEY = 'rsb-mcp-servers';

/* ─── Storage ─── */
export function loadMCPServers(): MCPServer[] {
  try {
    const raw = localStorage.getItem(MCP_SERVERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMCPServers(servers: MCPServer[]): void {
  localStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(servers));
}

export function addMCPServer(server: Omit<MCPServer, 'tools'>): MCPServer {
  const servers = loadMCPServers();
  const newServer: MCPServer = { ...server, tools: [] };
  servers.push(newServer);
  saveMCPServers(servers);
  return newServer;
}

export function removeMCPServer(id: string): void {
  const servers = loadMCPServers().filter(s => s.id !== id);
  saveMCPServers(servers);
}

/* ─── MCP Client ─── */
export class MCPClient {
  private server: MCPServer;

  constructor(server: MCPServer) {
    this.server = server;
  }

  /**
   * Discover available tools from the MCP server
   */
  async discoverTools(): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${this.server.url}/tools`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to discover tools: ${response.statusText}`);
      }

      const data = await response.json();
      this.server.tools = data.tools || [];
      
      // Update stored server
      const servers = loadMCPServers();
      const idx = servers.findIndex(s => s.id === this.server.id);
      if (idx >= 0) {
        servers[idx] = this.server;
        saveMCPServers(servers);
      }

      return this.server.tools;
    } catch (e: any) {
      console.error('MCP discover error:', e);
      return [];
    }
  }

  /**
   * Execute a tool on the MCP server
   */
  async executeTool(request: MCPRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.server.url}/tools/${request.tool}/execute`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ arguments: request.arguments }),
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content || JSON.stringify(data),
        isError: data.isError || false,
      };
    } catch (e: any) {
      return {
        content: `Error: ${e.message}`,
        isError: true,
      };
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.server.apiKey) {
      headers['Authorization'] = `Bearer ${this.server.apiKey}`;
    }
    return headers;
  }
}

/* ─── Built-in MCP Servers ─── */
export const BUILTIN_MCP_SERVERS = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://api.github.com',
    description: 'GitHub API integration',
    tools: [
      {
        name: 'list_repos',
        description: 'List user repositories',
        inputSchema: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'GitHub username' },
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
    ],
  },
  {
    id: 'weather',
    name: 'Weather API',
    url: 'https://api.openweathermap.org/data/2.5',
    description: 'Weather information',
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
          },
          required: ['city'],
        },
      },
    ],
  },
];

/* ─── Test MCP Connection ─── */
export async function testMCPConnection(server: MCPServer): Promise<{ success: boolean; error?: string }> {
  try {
    const client = new MCPClient(server);
    const tools = await client.discoverTools();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
