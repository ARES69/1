/**
 * Settings store — persists API keys and preferences in localStorage.
 * Keys are stored only in the user's browser, never sent to our servers.
 */

export interface ProviderKey {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

export interface Settings {
  providers: ProviderKey[];
  activeProviderId: string | null;
  sandboxMode: 'real' | 'simulated';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ru';
}

const STORAGE_KEY = 'rsb-settings';

const DEFAULT_PROVIDERS: ProviderKey[] = [
  { id: 'openai', name: 'OpenAI', apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', enabled: false },
  { id: 'anthropic', name: 'Anthropic', apiKey: '', baseUrl: 'https://api.anthropic.com', model: 'claude-3-5-haiku-20241022', enabled: false },
  { id: 'groq', name: 'Groq', apiKey: '', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', enabled: false },
  { id: 'openrouter', name: 'OpenRouter', apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct:free', enabled: false },
  { id: 'gemini', name: 'Google Gemini', apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash', enabled: false },
  { id: 'mistral', name: 'Mistral', apiKey: '', baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-small-latest', enabled: false },
  { id: 'custom', name: 'Custom (OpenAI-compatible)', apiKey: '', baseUrl: '', model: '', enabled: false },
];

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure new providers appear
      const mergedProviders = DEFAULT_PROVIDERS.map(def => {
        const saved = parsed.providers?.find((p: ProviderKey) => p.id === def.id);
        return saved ? { ...def, ...saved } : def;
      });
      // Keep any custom providers that aren't in defaults
      const extraProviders = (parsed.providers || []).filter(
        (p: ProviderKey) => !DEFAULT_PROVIDERS.find(d => d.id === p.id)
      );
      return {
        ...parsed,
        providers: [...mergedProviders, ...extraProviders],
      };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return {
    providers: DEFAULT_PROVIDERS,
    activeProviderId: null,
    sandboxMode: 'real',
    theme: 'system',
    language: 'en',
  };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export function getActiveProvider(settings: Settings): ProviderKey | null {
  if (settings.activeProviderId) {
    return settings.providers.find(p => p.id === settings.activeProviderId && p.enabled && p.apiKey) || null;
  }
  // Auto-select first enabled provider with a key
  return settings.providers.find(p => p.enabled && p.apiKey) || null;
}

export function addCustomProvider(settings: Settings, name: string, baseUrl: string, apiKey: string, model: string): Settings {
  const id = 'custom-' + Date.now();
  const newProvider: ProviderKey = { id, name, apiKey, baseUrl, model, enabled: true };
  return {
    ...settings,
    providers: [...settings.providers, newProvider],
    activeProviderId: settings.activeProviderId || id,
  };
}
