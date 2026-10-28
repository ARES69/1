/**
 * MCP Panel — UI component for managing MCP server connections.
 */

import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, TestTube, ExternalLink } from 'lucide-react';
import { EXTENDED_MCP_SERVERS, getMCPCategories, searchMCPServers, type MCPServer } from '../lib/mcp-ecosystem';
import { loadMCPServers, saveMCPServers, addMCPServer, removeMCPServer, testMCPConnection } from '../lib/mcp-client';

export default function MCPPanel() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setServers(loadMCPServers());
  }, []);

  const categories = getMCPCategories();

  const filteredBuiltInServers = searchQuery
    ? searchMCPServers(searchQuery)
    : selectedCategory === 'all'
    ? EXTENDED_MCP_SERVERS
    : EXTENDED_MCP_SERVERS.filter(s => {
        const categoryServers = {
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
        }[selectedCategory] || [];
        return categoryServers.includes(s.id);
      });

  const handleAddServer = (serverTemplate: MCPServer) => {
    const newServer = addMCPServer({
      id: serverTemplate.id + '-' + Date.now(),
      name: serverTemplate.name,
      url: serverTemplate.url,
      apiKey: '',
      enabled: false,
    });
    setServers([...servers, newServer]);
  };

  const handleRemoveServer = (id: string) => {
    removeMCPServer(id);
    setServers(servers.filter(s => s.id !== id));
  };

  const handleToggleServer = (id: string) => {
    const updated = servers.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    saveMCPServers(updated);
    setServers(updated);
  };

  const handleUpdateApiKey = (id: string, apiKey: string) => {
    const updated = servers.map(s => 
      s.id === id ? { ...s, apiKey } : s
    );
    saveMCPServers(updated);
    setServers(updated);
  };

  const handleTestConnection = async (server: MCPServer) => {
    setTesting(server.id);
    const result = await testMCPConnection(server);
    setTestResults(prev => ({ ...prev, [server.id]: result }));
    setTesting(null);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Database className="text-brand-500" />
          MCP Servers
        </h2>
        <p className="text-[var(--text-muted)]">
          Connect external tools and services via Model Context Protocol
        </p>
      </div>

      {/* Active Servers */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>Active Connections</span>
          <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
            {servers.length}
          </span>
        </h3>
        
        {servers.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <Database size={48} className="mx-auto mb-3 opacity-30" />
            <p>No MCP servers configured</p>
            <p className="text-xs mt-1">Add a server from the list below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map(server => (
              <div key={server.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{server.name}</span>
                    {testResults[server.id] && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        testResults[server.id].success 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {testResults[server.id].success ? '✓ Connected' : '✗ Failed'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(server)}
                      disabled={testing === server.id || !server.apiKey}
                      className="p-1.5 rounded hover:bg-brand-500/10 disabled:opacity-30"
                      title="Test connection"
                    >
                      {testing === server.id ? (
                        <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TestTube size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleServer(server.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        server.enabled ? 'bg-brand-600' : ''
                      }`}
                      style={!server.enabled ? { backgroundColor: 'var(--border)' } : {}}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        server.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <button
                      onClick={() => handleRemoveServer(server.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {testResults[server.id]?.error && (
                  <p className="text-xs text-red-400 mb-2">{testResults[server.id].error}</p>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={server.apiKey || ''}
                      onChange={(e) => handleUpdateApiKey(server.id, e.target.value)}
                      placeholder="Enter API key..."
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Available Tools
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {server.tools.slice(0, 5).map((tool: any) => (
                        <span key={tool.name} className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
                          {tool.name}
                        </span>
                      ))}
                      {server.tools.length > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                          +{server.tools.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Server */}
      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-sm font-semibold mb-3">Available Integrations</h3>
        
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
          />
        </div>

        {!searchQuery && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* Server List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredBuiltInServers.map(server => {
            const isAdded = servers.some(s => s.id.startsWith(server.id));
            return (
              <div
                key={server.id}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{server.name}</span>
                    <a
                      href={server.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-500 hover:text-brand-400"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {server.tools.slice(0, 3).map((tool: any) => (
                      <span key={tool.name} className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {tool.name}
                      </span>
                    ))}
                    {server.tools.length > 3 && (
                      <span className="text-xs text-[var(--text-muted)]">
                        +{server.tools.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAddServer(server)}
                  disabled={isAdded}
                  className="ml-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdded ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
