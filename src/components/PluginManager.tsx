/**
 * Plugin Manager Component — install, manage, and configure plugins.
 */

import { useState, useEffect } from 'react';
import { Package, Download, Trash2, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  loadPlugins,
  installPlugin,
  uninstallPlugin,
  togglePlugin,
  updatePluginConfig,
  PLUGIN_TEMPLATES,
  searchMarketplace,
  type Plugin,
  type MarketplacePlugin,
} from '../lib/plugins';

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>(loadPlugins());
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceResults, setMarketplaceResults] = useState<MarketplacePlugin[]>([]);

  useEffect(() => {
    setPlugins(loadPlugins());
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      setMarketplaceResults(searchMarketplace(searchQuery));
    }
  }, [searchQuery, activeTab]);

  const handleInstallTemplate = (template: typeof PLUGIN_TEMPLATES[0]) => {
    installPlugin(template);
    setPlugins(loadPlugins());
  };

  const handleInstallMarketplace = (marketplacePlugin: MarketplacePlugin) => {
    // In real implementation, this would download and install the plugin
    // For now, just create a placeholder
    installPlugin({
      name: marketplacePlugin.name,
      version: marketplacePlugin.version,
      description: marketplacePlugin.description,
      author: marketplacePlugin.author,
      enabled: true,
      config: {},
      hooks: [],
    });
    setPlugins(loadPlugins());
  };

  const handleUninstall = (id: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      uninstallPlugin(id);
      setPlugins(loadPlugins());
    }
  };

  const handleToggle = (id: string) => {
    togglePlugin(id);
    setPlugins(loadPlugins());
  };

  const handleUpdateConfig = (id: string, config: Record<string, any>) => {
    updatePluginConfig(id, config);
    setPlugins(loadPlugins());
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Package className="text-brand-500" />
          Plugin Manager
        </h2>
        <p className="text-[var(--text-muted)]">
          Extend RS-BUILDER with custom plugins
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'installed'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
          }`}
        >
          Installed ({plugins.length})
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'marketplace'
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-500/10'
          }`}
        >
          Marketplace
        </button>
      </div>

      {/* Installed Plugins */}
      {activeTab === 'installed' && (
        <div>
          {/* Templates */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Install</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PLUGIN_TEMPLATES.map((template, idx) => {
                const isInstalled = plugins.some(p => p.name === template.name);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium">{template.name}</h4>
                        <p className="text-xs text-[var(--text-muted)]">v{template.version}</p>
                      </div>
                      <button
                        onClick={() => handleInstallTemplate(template)}
                        disabled={isInstalled}
                        className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isInstalled ? 'Installed' : 'Install'}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{template.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Installed List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Installed Plugins</h3>
            {plugins.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>No plugins installed</p>
                <p className="text-xs mt-1">Install a plugin from the templates above or marketplace</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium">{plugin.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
                            v{plugin.version}
                          </span>
                          {plugin.enabled ? (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mb-2">{plugin.description}</p>
                        <p className="text-xs text-[var(--text-muted)]">by {plugin.author}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggle(plugin.id)}
                          className="p-2 rounded hover:bg-brand-500/10 transition-colors"
                          title={plugin.enabled ? 'Disable' : 'Enable'}
                        >
                          {plugin.enabled ? (
                            <ToggleRight size={20} className="text-brand-500" />
                          ) : (
                            <ToggleLeft size={20} className="text-[var(--text-muted)]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleUninstall(plugin.id)}
                          className="p-2 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Uninstall"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Plugin Config */}
                    {Object.keys(plugin.config).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <h5 className="text-xs font-medium text-[var(--text-muted)] mb-2">Configuration</h5>
                        <div className="space-y-2">
                          {Object.entries(plugin.config).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <label className="text-xs font-medium w-32">{key}</label>
                              <input
                                type={typeof value === 'number' ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => {
                                  const newValue = typeof value === 'number' 
                                    ? parseInt(e.target.value) || 0
                                    : e.target.value;
                                  handleUpdateConfig(plugin.id, { [key]: newValue });
                                }}
                                className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)] text-xs outline-none focus:ring-2 focus:ring-brand-500/50"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hooks */}
                    {plugin.hooks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <h5 className="text-xs font-medium text-[var(--text-muted)] mb-2">
                          Hooks ({plugin.hooks.length})
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {plugin.hooks.map((hook, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                            >
                              {hook.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketplace */}
      {activeTab === 'marketplace' && (
        <div>
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          {/* Results */}
          <div className="space-y-3">
            {marketplaceResults.map((plugin) => {
              const isInstalled = plugins.some(p => p.name === plugin.name);
              return (
                <div
                  key={plugin.id}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{plugin.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
                          v{plugin.version}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                          {plugin.category}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mb-2">{plugin.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span>by {plugin.author}</span>
                        <span>·</span>
                        <span>{plugin.downloads.toLocaleString()} downloads</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          ⭐ {plugin.rating}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInstallMarketplace(plugin)}
                      disabled={isInstalled}
                      className="ml-4 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      {isInstalled ? 'Installed' : 'Install'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
