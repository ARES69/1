import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Square, RotateCcw, Settings, Terminal, Monitor,
  FileText, CheckCircle2, XCircle, Download, FolderOpen, MessageSquare,
  ListTodo, Eye, Key, Plus, Trash2, TestTube, ChevronDown, ChevronRight,
  Zap, AlertTriangle, X, Copy, Check
} from 'lucide-react';
import { useI18n } from '../i18n';
import { runAgent, type AgentEvent } from '../lib/agent-engine';
import { VirtualFS } from '../lib/virtual-fs';
import { loadSettings, saveSettings, getActiveProvider, type Settings as AppSettings, type ProviderKey, addCustomProvider } from '../lib/settings';
import { testProvider } from '../lib/llm-providers';
import { getCurrentUser, isLoggedIn, logout } from '../lib/auth';

/* ─── Types ─── */
interface ThreadMessage {
  id: string;
  type: 'user' | 'thinking' | 'tool_call' | 'console' | 'system' | 'error';
  content: string;
  tool?: string;
  result?: string;
  timestamp: number;
}

interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

type RunStatus = 'idle' | 'running' | 'done' | 'error';

/* ─── Workspace ─── */
export default function Workspace() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as any)?.initialPrompt || '';

  const [prompt, setPrompt] = useState(initialPrompt);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [artifact, setArtifact] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'files' | 'console'>('preview');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [fs, setFs] = useState<VirtualFS | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [iteration, setIteration] = useState(0);
  const [usage, setUsage] = useState({ prompt: 0, completion: 0 });
  const [user, setUser] = useState(getCurrentUser());
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Scroll thread to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle agent events
  const handleEvent = useCallback((event: AgentEvent) => {
    switch (event.type) {
      case 'thinking':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'thinking',
          content: event.content,
          timestamp: Date.now(),
        }]);
        break;
      case 'tool_call':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'tool_call',
          content: JSON.stringify(event.args),
          tool: event.tool,
          result: event.result,
          timestamp: Date.now(),
        }]);
        break;
      case 'console':
        setConsoleOutput(prev => [...prev, event.content]);
        break;
      case 'file_written':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `📄 Written: ${event.path} (${event.size} bytes)`,
          timestamp: Date.now(),
        }]);
        break;
      case 'error':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'error',
          content: event.message,
          timestamp: Date.now(),
        }]);
        setStatus('error');
        break;
      case 'progress':
        setIteration(event.step);
        break;
      case 'usage':
        setUsage({ prompt: event.prompt_tokens, completion: event.completion_tokens });
        break;
      case 'done':
        if (event.artifact) {
          setArtifact(event.artifact);
        }
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `✅ ${event.summary}`,
          timestamp: Date.now(),
        }]);
        setStatus('done');
        break;
    }
  }, []);

  // Run agent
  const handleRun = async () => {
    if (!prompt.trim()) return;

    const provider = getActiveProvider(settings);
    if (!provider) {
      setMessages([{
        id: 'msg-' + Date.now(),
        type: 'error',
        content: '⚠️ No LLM provider configured. Click Settings (⚙️) to add your API key.',
        timestamp: Date.now(),
      }]);
      setShowSettings(true);
      return;
    }

    if (!provider.apiKey) {
      setMessages([{
        id: 'msg-' + Date.now(),
        type: 'error',
        content: `⚠️ ${provider.name} API key is missing. Click Settings (⚙️) to configure it.`,
        timestamp: Date.now(),
      }]);
      setShowSettings(true);
      return;
    }

    setStatus('running');
    setMessages([{
      id: 'msg-' + Date.now(),
      type: 'user',
      content: prompt,
      timestamp: Date.now(),
    }]);
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now() + '-start',
      type: 'system',
      content: `🚀 Starting agent with ${provider.name} (${provider.model || 'default'})...`,
      timestamp: Date.now(),
    }]);
    setArtifact('');
    setConsoleOutput([]);
    setIteration(0);
    setUsage({ prompt: 0, completion: 0 });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runAgent({
        provider,
        prompt,
        onEvent: handleEvent,
        signal: controller.signal,
      });
      setFs(result.fs);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        let errorMsg = e.message;
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
          errorMsg = `Network error: Cannot reach ${provider.name} API. This might be due to CORS restrictions. Try using OpenRouter (openrouter.ai) which supports browser requests, or check your API key.`;
        } else if (errorMsg.includes('401')) {
          errorMsg = `Authentication failed: Invalid API key for ${provider.name}. Check your key in Settings.`;
        } else if (errorMsg.includes('429')) {
          errorMsg = `Rate limit exceeded for ${provider.name}. Please wait or try a different provider.`;
        }
        handleEvent({ type: 'error', message: errorMsg });
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStatus('idle');
  };

  const handleReset = () => {
    handleStop();
    setPrompt('');
    setMessages([]);
    setFs(null);
    setArtifact('');
    setConsoleOutput([]);
    setIteration(0);
    setUsage({ prompt: 0, completion: 0 });
    setStatus('idle');
  };

  // Download file
  const handleDownloadFile = (path: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download all as JSON
  const handleDownloadAll = () => {
    if (!fs) return;
    const data = fs.exportAsJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rs-builder-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download artifact as HTML
  const handleDownloadArtifact = () => {
    if (!artifact) return;
    const blob = new Blob([artifact], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'artifact.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeProvider = getActiveProvider(settings);
  const tabs = [
    { id: 'preview' as const, label: t.workspace.preview, icon: Eye },
    { id: 'files' as const, label: t.workspace.files, icon: FolderOpen },
    { id: 'console' as const, label: t.workspace.console, icon: Terminal },
  ];

  return (
    <main className="pt-16 h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'done' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {status === 'idle' ? 'Ready' : status === 'running' ? `Running (step ${iteration})` : status === 'done' ? 'Done' : 'Error'}
            </span>
          </div>
          {activeProvider && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 flex items-center gap-1">
              <Zap size={10} /> {activeProvider.name}/{activeProvider.model}
            </span>
          )}
          {usage.prompt > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {usage.prompt + usage.completion} tokens
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <button onClick={handleStop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
              <Square size={14} /> {t.workspace.stop}
            </button>
          )}
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw size={14} /> {t.workspace.reset}
          </button>
          {artifact && (
            <button onClick={handleDownloadArtifact} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-500/10 text-accent-500 hover:bg-accent-500/20 transition-colors">
              <Download size={14} /> HTML
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg transition-colors hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Thread */}
        <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
          {/* Thread */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <MessageSquare size={14} className="text-brand-500" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t.workspace.thread}</span>
            </div>
            <div ref={threadRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {messages.length === 0 && status === 'idle' && (
                <div className="text-center py-8">
                  <Sparkles size={24} className="mx-auto mb-2 text-brand-500/50" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {!activeProvider ? 'Configure an API key in Settings to start' : 'Enter a prompt to start building'}
                  </p>
                </div>
              )}
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-lg text-xs ${
                      msg.type === 'user' ? 'bg-brand-500/10 border border-brand-500/20' :
                      msg.type === 'thinking' ? 'bg-purple-500/5 border border-purple-500/10' :
                      msg.type === 'tool_call' ? 'bg-orange-500/5 border border-orange-500/10' :
                      msg.type === 'console' ? 'bg-slate-800/50 border border-slate-700/50 font-mono' :
                      msg.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                      'border'
                    }`}
                    style={{ borderColor: msg.type === 'system' ? 'var(--border)' : undefined }}
                  >
                    {msg.type === 'tool_call' && (
                      <div className="flex items-center gap-1 text-orange-400 font-medium mb-1">
                        <Zap size={10} /> {msg.tool}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words" style={{ color: msg.type === 'error' ? '#f87171' : msg.type === 'console' ? '#a5b4fc' : 'var(--text-secondary)' }}>
                      {msg.content}
                    </p>
                    {msg.type === 'tool_call' && msg.result && msg.result !== '...' && (
                      <p className="mt-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                        → {msg.result}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && status !== 'running' && handleRun()}
                placeholder={t.hero.placeholder}
                disabled={status === 'running'}
                className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-brand-500/50 transition-all disabled:opacity-50"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
              />
              <button
                onClick={handleRun}
                disabled={!prompt.trim() || status === 'running'}
                className="p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b px-2" style={{ borderColor: 'var(--border)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-brand-500 text-brand-500' : 'border-transparent hover:text-brand-400'
                }`}
                style={{ color: activeTab === tab.id ? undefined : 'var(--text-muted)' }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {/* Preview */}
            {activeTab === 'preview' && (
              <div className="h-full p-4">
                {artifact ? (
                  <div className="h-full rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <iframe
                      srcDoc={artifact}
                      className="w-full h-full"
                      sandbox="allow-scripts"
                      title="Artifact Preview"
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-center">
                      <Monitor size={48} className="mx-auto mb-4 text-brand-500/30" />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                        {status === 'running' ? 'Building artifact...' : 'No artifact yet'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {status === 'idle' ? 'Run the agent to generate a live preview' : 'Preview will appear here...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Files */}
            {activeTab === 'files' && (
              <div className="h-full p-4 overflow-y-auto">
                {fs ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {fs.list().length} items
                      </span>
                      <button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-brand-500"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        <Download size={12} /> {t.workspace.downloadAll}
                      </button>
                    </div>
                    {fs.list().map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:border-brand-500/50"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                      >
                        {file.type === 'folder' ? (
                          <FolderOpen size={16} className="text-brand-500" />
                        ) : (
                          <FileText size={16} className="text-accent-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{file.path}</p>
                        </div>
                        {file.type === 'file' && (
                          <button
                            onClick={() => {
                              const content = fs.read(file.path);
                              if (content) handleDownloadFile(file.path, content);
                            }}
                            className="p-1.5 rounded hover:bg-brand-500/10 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Download size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FolderOpen size={48} className="mx-auto mb-4 text-brand-500/30" />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No files yet</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Console */}
            {activeTab === 'console' && (
              <div className="h-full p-4">
                <div className="h-full rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: '#0d1117' }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#21262d' }}>
                    <Terminal size={14} className="text-green-400" />
                    <span className="text-xs font-mono text-green-400">console</span>
                  </div>
                  <div className="p-3 overflow-y-auto h-[calc(100%-36px)] font-mono text-xs space-y-1">
                    {consoleOutput.length === 0 ? (
                      <p className="text-gray-500">$ Waiting for output...</p>
                    ) : (
                      consoleOutput.map((line, i) => (
                        <p key={i} className="text-gray-300 whitespace-pre-wrap">{line}</p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onSave={(s) => { setSettings(s); saveSettings(s); }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─── Settings Modal ─── */
function SettingsModal({ settings, onSave, onClose }: {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AppSettings>({ ...settings });
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customModel, setCustomModel] = useState('');

  const handleTest = async (provider: ProviderKey) => {
    setTesting(provider.id);
    const result = await testProvider(provider);
    setTestResult(prev => ({ ...prev, [provider.id]: { success: result.success, error: result.error } }));
    setTesting(null);
  };

  const handleToggleProvider = (id: string) => {
    setLocal(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
      activeProviderId: id,
    }));
  };

  const handleUpdateProvider = (id: string, updates: Partial<ProviderKey>) => {
    setLocal(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const handleAddCustom = () => {
    if (!customName || !customUrl || !customKey) return;
    const updated = addCustomProvider(local, customName, customUrl, customKey, customModel);
    setLocal(updated);
    setShowAddCustom(false);
    setCustomName('');
    setCustomUrl('');
    setCustomKey('');
    setCustomModel('');
  };

  const handleRemoveCustom = (id: string) => {
    setLocal(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
      activeProviderId: prev.activeProviderId === id ? null : prev.activeProviderId,
    }));
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Settings size={20} className="text-brand-500" />
            Settings
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <AlertTriangle size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-400 space-y-1">
            <p><strong>Privacy:</strong> API keys are stored only in your browser. They are never sent to our servers.</p>
            <p><strong>CORS:</strong> OpenRouter, Anthropic, and Groq support direct browser requests. OpenAI blocks browser requests (use OpenRouter as proxy instead).</p>
          </div>
        </div>

        {/* Recommended provider */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <Zap size={14} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-400">
            <p><strong>Quick start:</strong> Get a free API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="underline">openrouter.ai</a> — supports 100+ models including free ones, works directly from browser.</p>
          </div>
        </div>

        {/* Providers */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Key size={14} className="text-brand-500" />
            LLM Providers
          </h4>

          {local.providers.map(provider => (
            <div key={provider.id} className="p-4 rounded-xl border" style={{ borderColor: provider.enabled ? 'var(--brand-500, #6366f1)' : 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{provider.name}</span>
                  {local.activeProviderId === provider.id && provider.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-medium">ACTIVE</span>
                  )}
                  {testResult[provider.id] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${testResult[provider.id].success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {testResult[provider.id].success ? '✓ OK' : '✗ FAIL'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(provider)}
                    disabled={testing === provider.id || !provider.apiKey}
                    className="p-1.5 rounded-lg text-xs hover:bg-brand-500/10 disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Test connection"
                  >
                    {testing === provider.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TestTube size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleProvider(provider.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${provider.enabled ? 'bg-brand-600' : ''}`}
                    style={!provider.enabled ? { backgroundColor: 'var(--border)' } : {}}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  {provider.id.startsWith('custom-') && (
                    <button onClick={() => handleRemoveCustom(provider.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {testResult[provider.id]?.error && (
                <p className="text-xs text-red-400 mb-2">{testResult[provider.id].error}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>API Key</label>
                  <input
                    type="password"
                    value={provider.apiKey}
                    onChange={e => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Model</label>
                  <input
                    type="text"
                    value={provider.model || ''}
                    onChange={e => handleUpdateProvider(provider.id, { model: e.target.value })}
                    placeholder={provider.id === 'openai' ? 'gpt-4o-mini' : provider.id === 'anthropic' ? 'claude-3-5-haiku-20241022' : ''}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {(provider.id === 'custom' || provider.id.startsWith('custom-')) && (
                <div className="mt-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Base URL</label>
                  <input
                    type="text"
                    value={provider.baseUrl || ''}
                    onChange={e => handleUpdateProvider(provider.id, { baseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add custom provider */}
          {!showAddCustom ? (
            <button
              onClick={() => setShowAddCustom(true)}
              className="w-full p-3 rounded-xl border border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:border-brand-500 hover:text-brand-500"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Plus size={14} /> Add Custom Provider (OpenAI-compatible)
            </button>
          ) : (
            <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>Custom Provider</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Provider name" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="text" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Base URL (e.g. https://api.example.com/v1)" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="password" value={customKey} onChange={e => setCustomKey(e.target.value)} placeholder="API Key" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="Model name" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCustom} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Add</button>
                <button onClick={() => setShowAddCustom(false)} className="px-3 py-1.5 rounded-lg border text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
            Save Settings
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border font-medium transition-colors hover:border-brand-500" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
