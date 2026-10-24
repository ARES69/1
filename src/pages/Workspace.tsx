/**
 * Workspace — Claude Code-style agent workspace.
 * Features: real LLM calls, file editor with diff, terminal, conversation branching,
 * checkpoints, memory, permission system, extended thinking display.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Square, RotateCcw, Settings, Terminal as TermIcon,
  FileText, Download, FolderOpen, MessageSquare, Eye, Key, Plus, Trash2,
  TestTube, Zap, AlertTriangle, X, GitBranch, History, Shield, Brain,
  ChevronRight, Check, Clock, ArrowRight, Edit3
} from 'lucide-react';
import { useI18n } from '../i18n';
import { runAgent, type AgentEvent } from '../lib/agent-engine';
import { VirtualFS } from '../lib/virtual-fs';
import { loadSettings, saveSettings, getActiveProvider, type Settings as AppSettings, type ProviderKey, addCustomProvider } from '../lib/settings';
import { testProvider } from '../lib/llm-providers';
import { getCurrentUser, logout } from '../lib/auth';
import {
  createProject, getActiveProjectId, setActiveProjectId, getProject,
  addMemory, createCheckpoint, restoreCheckpoint, listProjects, deleteProject,
  type Project, type Checkpoint
} from '../lib/memory';
import FileEditor from '../components/FileEditor';
import Terminal from '../components/Terminal';

/* ─── Types ─── */
interface ThreadMessage {
  id: string;
  type: 'user' | 'thinking' | 'tool_call' | 'console' | 'system' | 'error' | 'permission';
  content: string;
  tool?: string;
  result?: string;
  timestamp: number;
  collapsed?: boolean;
}

type RunStatus = 'idle' | 'running' | 'done' | 'error' | 'waiting_permission';

type Tab = 'preview' | 'editor' | 'terminal' | 'files';

/* ─── Main Workspace ─── */
export default function Workspace() {
  const { t } = useI18n();
  const location = useLocation();
  const initialPrompt = (location.state as any)?.initialPrompt || '';

  // Core state
  const [prompt, setPrompt] = useState(initialPrompt);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [artifact, setArtifact] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [fs, setFs] = useState<VirtualFS | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [iteration, setIteration] = useState(0);
  const [usage, setUsage] = useState({ prompt: 0, completion: 0 });

  // Editor state
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');

  // Project/memory state
  const [project, setProject] = useState<Project | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showCheckpoints, setShowCheckpoints] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [permissionRequest, setPermissionRequest] = useState<{ tool: string; args: Record<string, any>; resolve: (ok: boolean) => void } | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef<VirtualFS | null>(null);

  // Initialize project
  useEffect(() => {
    const activeId = getActiveProjectId();
    if (activeId) {
      const p = getProject(activeId);
      if (p) setProject(p);
    }
    if (!project) {
      const p = createProject('Untitled Project');
      setProject(p);
    }
  }, []);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Keep fs ref in sync
  useEffect(() => {
    fsRef.current = fs;
  }, [fs]);

  // Handle agent events
  const handleEvent = useCallback((event: AgentEvent) => {
    switch (event.type) {
      case 'thinking':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'thinking',
          content: event.content,
          timestamp: Date.now(),
          collapsed: event.content.length > 200,
        }]);
        break;
      case 'tool_call':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'tool_call',
          content: JSON.stringify(event.args, null, 2),
          tool: event.tool,
          result: event.result,
          timestamp: Date.now(),
        }]);
        break;
      case 'console':
        // Will be handled by terminal
        break;
      case 'file_written':
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `📄 ${event.path} (${event.size} bytes)`,
          timestamp: Date.now(),
        }]);
        // Refresh FS display
        if (fsRef.current) {
          setFs(new VirtualFS());
          const files = fsRef.current.getAll();
          const newFs = new VirtualFS();
          files.forEach(f => newFs.write(f.path, f.content));
          setFs(newFs);
        }
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
        if (event.artifact) setArtifact(event.artifact);
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `✅ ${event.summary}`,
          timestamp: Date.now(),
        }]);
        setStatus('done');
        // Auto-create checkpoint
        if (project && fsRef.current) {
          createCheckpoint(project, `Run complete: ${event.summary.slice(0, 50)}`, fsRef.current, messages.length);
        }
        break;
    }
  }, [project, messages.length]);

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

    // Create new project if needed
    if (!project) {
      const p = createProject(prompt.slice(0, 40));
      setProject(p);
    }

    setStatus('running');
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'user',
      content: prompt,
      timestamp: Date.now(),
    }]);
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now() + '-start',
      type: 'system',
      content: `🚀 Starting with ${provider.name} (${provider.model || 'default'})...`,
      timestamp: Date.now(),
    }]);
    setArtifact('');
    setIteration(0);
    setUsage({ prompt: 0, completion: 0 });

    // Initialize FS if needed
    if (!fs) {
      setFs(new VirtualFS());
    }

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
      fsRef.current = result.fs;

      // Save to memory
      if (project) {
        addMemory(project, prompt, `Built artifact`, result.fs, usage.prompt + usage.completion);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        let errorMsg = e.message;
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
          errorMsg = `Network error: Cannot reach ${provider.name} API. Try OpenRouter (supports CORS) or check your key.`;
        } else if (errorMsg.includes('401')) {
          errorMsg = `Invalid API key for ${provider.name}.`;
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
    fsRef.current = null;
    setArtifact('');
    setIteration(0);
    setUsage({ prompt: 0, completion: 0 });
    setStatus('idle');
    setEditingFile(null);
  };

  // File operations
  const handleOpenFile = (path: string) => {
    if (!fs) return;
    const content = fs.read(path);
    if (content !== null) {
      setEditingFile(path);
      setEditingContent(content);
      setOriginalContent(content);
      setActiveTab('editor');
    }
  };

  const handleSaveFile = (content: string) => {
    if (!fs || !editingFile) return;
    fs.write(editingFile, content);
    setOriginalContent(content);
    // Refresh artifact
    const indexHtml = fs.read('index.html');
    if (indexHtml) setArtifact(indexHtml);
  };

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

  const handleDownloadAll = () => {
    if (!fs) return;
    const data = fs.exportAsJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Checkpoint restore
  const handleRestoreCheckpoint = (cp: Checkpoint) => {
    const newFs = new VirtualFS();
    for (const [path, content] of Object.entries(cp.files)) {
      newFs.write(path, content);
    }
    setFs(newFs);
    fsRef.current = newFs;
    setShowCheckpoints(false);
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'system',
      content: `⏪ Restored checkpoint: ${cp.label}`,
      timestamp: Date.now(),
    }]);
  };

  // Manual checkpoint
  const handleCreateCheckpoint = () => {
    if (!project || !fs) return;
    const label = `Manual checkpoint (${new Date().toLocaleTimeString()})`;
    createCheckpoint(project, label, fs, messages.length);
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'system',
      content: `📸 Checkpoint created: ${label}`,
      timestamp: Date.now(),
    }]);
  };

  // Branch conversation
  const handleBranch = (fromMessageIdx: number) => {
    const branchMessages = messages.slice(0, fromMessageIdx + 1);
    setMessages(branchMessages);
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'system',
      content: `🔀 Branched from message #${fromMessageIdx + 1}`,
      timestamp: Date.now(),
    }]);
  };

  const activeProvider = getActiveProvider(settings);
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'editor', label: 'Editor', icon: Edit3 },
    { id: 'terminal', label: 'Terminal', icon: TermIcon },
    { id: 'files', label: 'Files', icon: FolderOpen },
  ];

  return (
    <main className="pt-16 h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'done' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {status === 'idle' ? 'Ready' : status === 'running' ? `Step ${iteration}` : status === 'done' ? 'Done' : status === 'error' ? 'Error' : 'Waiting'}
            </span>
          </div>
          {activeProvider && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 flex items-center gap-1">
              <Zap size={10} /> {activeProvider.name}
            </span>
          )}
          {project && (
            <button
              onClick={() => setShowProjectPicker(true)}
              className="text-xs px-2 py-0.5 rounded border hover:border-brand-500 transition-colors flex items-center gap-1"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <FolderOpen size={10} /> {project.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCreateCheckpoint} disabled={!fs} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10 disabled:opacity-30" style={{ color: 'var(--text-muted)' }} title="Create checkpoint">
            <History size={14} />
          </button>
          <button onClick={() => setShowCheckpoints(true)} disabled={!project || project.checkpoints.length === 0} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10 disabled:opacity-30" style={{ color: 'var(--text-muted)' }} title="Checkpoints">
            <Clock size={14} /> {project?.checkpoints.length || 0}
          </button>
          {status === 'running' && (
            <button onClick={handleStop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
              <Square size={14} /> Stop
            </button>
          )}
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw size={14} /> Reset
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
        <div className="w-96 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <MessageSquare size={14} className="text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Thread</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 ml-auto">{messages.length}</span>
          </div>
          <div ref={threadRef} className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {messages.length === 0 && status === 'idle' && (
              <div className="text-center py-8">
                <Brain size={32} className="mx-auto mb-3 text-brand-500/30" />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Ready to build</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {!activeProvider ? 'Configure an API key in Settings' : 'Describe what you want to build'}
                </p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative p-2.5 rounded-lg text-xs ${
                    msg.type === 'user' ? 'bg-brand-500/10 border border-brand-500/20' :
                    msg.type === 'thinking' ? 'bg-purple-500/5 border border-purple-500/10' :
                    msg.type === 'tool_call' ? 'bg-orange-500/5 border border-orange-500/10' :
                    msg.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    'border'
                  }`}
                  style={{ borderColor: msg.type === 'system' ? 'var(--border)' : undefined }}
                >
                  {/* Branch button */}
                  <button
                    onClick={() => handleBranch(idx)}
                    className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-brand-500/20 text-brand-400 transition-opacity"
                    title="Branch from here"
                  >
                    <GitBranch size={10} />
                  </button>

                  {msg.type === 'thinking' && (
                    <div className="flex items-center gap-1 text-purple-400 font-medium mb-1">
                      <Brain size={10} /> Extended Thinking
                      {msg.collapsed && (
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, collapsed: !m.collapsed } : m))}
                          className="ml-auto text-[10px] text-purple-400 hover:text-purple-300"
                        >
                          expand
                        </button>
                      )}
                    </div>
                  )}
                  {msg.type === 'tool_call' && (
                    <div className="flex items-center gap-1 text-orange-400 font-medium mb-1">
                      <Zap size={10} /> {msg.tool}
                    </div>
                  )}
                  <p className={`whitespace-pre-wrap break-words ${msg.collapsed ? 'line-clamp-2' : ''}`} style={{ color: msg.type === 'error' ? '#f87171' : 'var(--text-secondary)' }}>
                    {msg.content}
                  </p>
                  {msg.type === 'tool_call' && msg.result && msg.result !== '...' && (
                    <p className="mt-1 text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      → {msg.result.slice(0, 100)}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && status !== 'running' && handleRun()}
                placeholder="Describe what to build..."
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
            {editingFile && activeTab === 'editor' && (
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{editingFile}</span>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-4">
            {/* Preview */}
            {activeTab === 'preview' && (
              artifact ? (
                <div className="h-full rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <iframe srcDoc={artifact} className="w-full h-full" sandbox="allow-scripts" title="Preview" />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-center">
                    <Eye size={48} className="mx-auto mb-4 text-brand-500/30" />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {status === 'running' ? 'Building...' : 'No preview yet'}
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Editor */}
            {activeTab === 'editor' && (
              editingFile && fs ? (
                <FileEditor
                  path={editingFile}
                  content={editingContent}
                  originalContent={originalContent}
                  onChange={setEditingContent}
                  onSave={handleSaveFile}
                  onClose={() => setEditingFile(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-center">
                    <Edit3 size={48} className="mx-auto mb-4 text-brand-500/30" />
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>No file selected</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Open a file from the Files tab</p>
                  </div>
                </div>
              )
            )}

            {/* Terminal */}
            {activeTab === 'terminal' && (
              <Terminal fs={fs} />
            )}

            {/* Files */}
            {activeTab === 'files' && (
              <div className="h-full overflow-y-auto">
                {fs ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {fs.list().length} items
                      </span>
                      <button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-brand-500"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        <Download size={12} /> Export
                      </button>
                    </div>
                    {fs.list().map((file, i) => (
                      <div
                        key={i}
                        onClick={() => file.type === 'file' && handleOpenFile(file.path)}
                        className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:border-brand-500/50 cursor-pointer"
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
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
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
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal settings={settings} onSave={(s) => { setSettings(s); saveSettings(s); }} onClose={() => setShowSettings(false)} />
        )}
        {showProjectPicker && (
          <ProjectPicker
            projects={listProjects()}
            activeId={project?.id || null}
            onSelect={(id) => {
              const p = getProject(id);
              if (p) {
                setProject(p);
                setActiveProjectId(id);
                // Restore files from last memory
                if (p.memories.length > 0) {
                  const lastMemory = p.memories[p.memories.length - 1];
                  const newFs = new VirtualFS();
                  for (const [path, content] of Object.entries(lastMemory.files)) {
                    newFs.write(path, content);
                  }
                  setFs(newFs);
                  fsRef.current = newFs;
                }
              }
              setShowProjectPicker(false);
            }}
            onCreate={() => {
              const p = createProject('New Project');
              setProject(p);
              handleReset();
              setShowProjectPicker(false);
            }}
            onDelete={(id) => {
              deleteProject(id);
              setShowProjectPicker(false);
            }}
            onClose={() => setShowProjectPicker(false)}
          />
        )}
        {showCheckpoints && project && (
          <CheckpointPicker
            checkpoints={project.checkpoints}
            onRestore={handleRestoreCheckpoint}
            onClose={() => setShowCheckpoints(false)}
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
    setCustomName(''); setCustomUrl(''); setCustomKey(''); setCustomModel('');
  };

  const handleRemoveCustom = (id: string) => {
    setLocal(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
      activeProviderId: prev.activeProviderId === id ? null : prev.activeProviderId,
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Settings size={20} className="text-brand-500" /> Settings
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
          <p className="text-xs text-blue-400"><strong>Privacy:</strong> Keys stored in browser only. <strong>CORS:</strong> OpenRouter, Anthropic, Groq work from browser. OpenAI blocks browser requests.</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <p className="text-xs text-emerald-400"><strong>Quick start:</strong> Get free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="underline">openrouter.ai/keys</a></p>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Key size={14} className="text-brand-500" /> LLM Providers
          </h4>
          {local.providers.map(provider => (
            <div key={provider.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{provider.name}</span>
                  {local.activeProviderId === provider.id && provider.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500">ACTIVE</span>
                  )}
                  {testResult[provider.id] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${testResult[provider.id].success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {testResult[provider.id].success ? '✓ OK' : '✗ FAIL'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTest(provider)} disabled={testing === provider.id || !provider.apiKey}
                    className="p-1.5 rounded hover:bg-brand-500/10 disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>
                    {testing === provider.id ? <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <TestTube size={14} />}
                  </button>
                  <button onClick={() => handleToggleProvider(provider.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${provider.enabled ? 'bg-brand-600' : ''}`}
                    style={!provider.enabled ? { backgroundColor: 'var(--border)' } : {}}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  {provider.id.startsWith('custom-') && (
                    <button onClick={() => handleRemoveCustom(provider.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
              {testResult[provider.id]?.error && <p className="text-xs text-red-400 mb-2">{testResult[provider.id].error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>API Key</label>
                  <input type="password" value={provider.apiKey} onChange={e => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
                    placeholder="sk-..." className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Model</label>
                  <input type="text" value={provider.model || ''} onChange={e => handleUpdateProvider(provider.id, { model: e.target.value })}
                    placeholder="model name" className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                </div>
              </div>
              {(provider.id === 'custom' || provider.id.startsWith('custom-')) && (
                <div className="mt-2">
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>Base URL</label>
                  <input type="text" value={provider.baseUrl || ''} onChange={e => handleUpdateProvider(provider.id, { baseUrl: e.target.value })}
                    placeholder="https://api.example.com/v1" className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                </div>
              )}
            </div>
          ))}
          {!showAddCustom ? (
            <button onClick={() => setShowAddCustom(true)} className="w-full p-3 rounded-xl border border-dashed text-sm flex items-center justify-center gap-2 hover:border-brand-500 hover:text-brand-500"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Plus size={14} /> Add Custom Provider
            </button>
          ) : (
            <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Name" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="text" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Base URL" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="password" value={customKey} onChange={e => setCustomKey(e.target.value)} placeholder="API Key" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                <input type="text" value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="Model" className="px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-brand-500/50 font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCustom} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Add</button>
                <button onClick={() => setShowAddCustom(false)} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => { onSave(local); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700">Save</button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border font-medium hover:border-brand-500" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Project Picker ─── */
function ProjectPicker({ projects, activeId, onSelect, onCreate, onDelete, onClose }: {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FolderOpen size={18} className="text-brand-500" /> Projects
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {projects.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:border-brand-500/50 ${p.id === activeId ? 'border-brand-500 bg-brand-500/5' : ''}`}
              style={{ borderColor: p.id === activeId ? undefined : 'var(--border)' }}
              onClick={() => onSelect(p.id)}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{p.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.memories.length} memories · {p.checkpoints.length} checkpoints</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="p-1 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button onClick={onCreate} className="w-full py-2 rounded-lg border border-dashed text-sm flex items-center justify-center gap-2 hover:border-brand-500 hover:text-brand-500"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <Plus size={14} /> New Project
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Checkpoint Picker ─── */
function CheckpointPicker({ checkpoints, onRestore, onClose }: {
  checkpoints: Checkpoint[];
  onRestore: (cp: Checkpoint) => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <History size={18} className="text-brand-500" /> Checkpoints
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[...checkpoints].reverse().map(cp => (
            <div key={cp.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{cp.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(cp.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => onRestore(cp)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">
                Restore
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
