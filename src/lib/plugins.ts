/**
 * Plugin System — extensible plugin architecture for RS-BUILDER.
 * Allows users to install, manage, and use custom plugins.
 */

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  installedAt: number;
  config: Record<string, any>;
  hooks: PluginHook[];
}

export interface PluginHook {
  name: string;
  handler: string; // Function code as string
}

export interface PluginContext {
  workspace: any;
  fs: any;
  messages: any[];
  settings: any;
}

const PLUGINS_KEY = 'rsb-plugins';

/* ─── Plugin Storage ─── */
export function loadPlugins(): Plugin[] {
  try {
    const raw = localStorage.getItem(PLUGINS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load plugins:', e);
  }
  return [];
}

export function savePlugins(plugins: Plugin[]): void {
  try {
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(plugins));
  } catch (e) {
    console.warn('Failed to save plugins:', e);
  }
}

export function installPlugin(plugin: Omit<Plugin, 'id' | 'installedAt'>): Plugin {
  const newPlugin: Plugin = {
    ...plugin,
    id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    installedAt: Date.now(),
  };
  
  const plugins = loadPlugins();
  plugins.push(newPlugin);
  savePlugins(plugins);
  
  return newPlugin;
}

export function uninstallPlugin(id: string): void {
  const plugins = loadPlugins().filter(p => p.id !== id);
  savePlugins(plugins);
}

export function togglePlugin(id: string): void {
  const plugins = loadPlugins();
  const plugin = plugins.find(p => p.id === id);
  
  if (plugin) {
    plugin.enabled = !plugin.enabled;
    savePlugins(plugins);
  }
}

export function updatePluginConfig(id: string, config: Record<string, any>): void {
  const plugins = loadPlugins();
  const plugin = plugins.find(p => p.id === id);
  
  if (plugin) {
    plugin.config = { ...plugin.config, ...config };
    savePlugins(plugins);
  }
}

/* ─── Plugin Execution ─── */
export async function executePluginHook(
  hookName: string,
  context: PluginContext,
  plugins: Plugin[] = loadPlugins()
): Promise<void> {
  const enabledPlugins = plugins.filter(p => p.enabled);
  
  for (const plugin of enabledPlugins) {
    const hook = plugin.hooks.find(h => h.name === hookName);
    
    if (hook) {
      try {
        // Create function from hook handler string
        const handler = new Function('context', hook.handler);
        await handler(context);
      } catch (error) {
        console.error(`Plugin ${plugin.name} hook ${hookName} failed:`, error);
      }
    }
  }
}

/* ─── Built-in Plugin Templates ─── */
export const PLUGIN_TEMPLATES = [
  {
    name: 'Auto-Save',
    version: '1.0.0',
    description: 'Automatically save workspace state every 30 seconds',
    author: 'RS-BUILDER',
    enabled: true,
    config: { interval: 30000 },
    hooks: [
      {
        name: 'onInit',
        handler: `
          setInterval(() => {
            console.log('Auto-saving workspace...');
            // Auto-save logic here
          }, context.config.interval || 30000);
        `,
      },
    ],
  },
  {
    name: 'Code Formatter',
    version: '1.0.0',
    description: 'Automatically format code on save',
    author: 'RS-BUILDER',
    enabled: false,
    config: { tabSize: 2, insertSpaces: true },
    hooks: [
      {
        name: 'onFileSave',
        handler: `
          console.log('Formatting code...');
          // Code formatting logic here
        `,
      },
    ],
  },
  {
    name: 'Git Commit Message Generator',
    version: '1.0.0',
    description: 'Generate commit messages based on changes',
    author: 'RS-BUILDER',
    enabled: false,
    config: {},
    hooks: [
      {
        name: 'onCommit',
        handler: `
          console.log('Generating commit message...');
          // Commit message generation logic here
        `,
      },
    ],
  },
  {
    name: 'Dark Mode Scheduler',
    version: '1.0.0',
    description: 'Automatically switch to dark mode at night',
    author: 'RS-BUILDER',
    enabled: false,
    config: { startHour: 20, endHour: 7 },
    hooks: [
      {
        name: 'onInit',
        handler: `
          const hour = new Date().getHours();
          const { startHour, endHour } = context.config;
          
          if (hour >= startHour || hour < endHour) {
            console.log('Switching to dark mode...');
            // Dark mode logic here
          }
        `,
      },
    ],
  },
];

/* ─── Plugin Validation ─── */
export function validatePlugin(plugin: Partial<Plugin>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!plugin.name || plugin.name.trim().length === 0) {
    errors.push('Plugin name is required');
  }
  
  if (!plugin.version || !/^\d+\.\d+\.\d+$/.test(plugin.version)) {
    errors.push('Plugin version must be in format X.Y.Z');
  }
  
  if (!plugin.description || plugin.description.trim().length === 0) {
    errors.push('Plugin description is required');
  }
  
  if (!plugin.author || plugin.author.trim().length === 0) {
    errors.push('Plugin author is required');
  }
  
  if (plugin.hooks) {
    for (const hook of plugin.hooks) {
      if (!hook.name || !hook.handler) {
        errors.push('All hooks must have a name and handler');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/* ─── Plugin Marketplace (Mock) ─── */
export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  category: string;
}

export const MOCK_MARKETPLACE: MarketplacePlugin[] = [
  {
    id: 'market-1',
    name: 'Syntax Highlighter Pro',
    version: '2.1.0',
    description: 'Advanced syntax highlighting for 50+ languages',
    author: 'CodeMaster',
    downloads: 15420,
    rating: 4.8,
    category: 'Editor',
  },
  {
    id: 'market-2',
    name: 'AI Code Completion',
    version: '1.5.2',
    description: 'Intelligent code completion powered by AI',
    author: 'AI Labs',
    downloads: 28930,
    rating: 4.9,
    category: 'AI',
  },
  {
    id: 'market-3',
    name: 'Git Integration Plus',
    version: '3.0.1',
    description: 'Enhanced Git integration with visual diff',
    author: 'DevTools Inc',
    downloads: 12750,
    rating: 4.7,
    category: 'Version Control',
  },
  {
    id: 'market-4',
    name: 'Performance Monitor',
    version: '1.2.0',
    description: 'Real-time performance monitoring and alerts',
    author: 'PerfGuru',
    downloads: 8340,
    rating: 4.6,
    category: 'Monitoring',
  },
  {
    id: 'market-5',
    name: 'Theme Pack',
    version: '1.0.0',
    description: 'Collection of beautiful themes for RS-BUILDER',
    author: 'DesignStudio',
    downloads: 5620,
    rating: 4.5,
    category: 'Themes',
  },
];

export function searchMarketplace(query: string): MarketplacePlugin[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_MARKETPLACE.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.author.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}
