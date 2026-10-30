/**
 * Workspace — Claude Code-style agent workspace with streaming, slash commands,
 * cost tracking, project instructions, and keyboard shortcuts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Square, RotateCcw, Settings, Terminal as TermIcon,
  FileText, Download, FolderOpen, MessageSquare, Eye, Key, Plus, Trash2,
  TestTube, Zap, X, GitBranch, History, Brain, ChevronRight, Edit3,
  DollarSign, FileCode, Clock, Search, Image as ImageIcon, Rocket,
  Bug, Users, Database, Code2, Plug, Share2, BarChart3, Workflow, Shield, Package
} from 'lucide-react';
import { useI18n } from '../i18n';
import { runAgent, type AgentEvent } from '../lib/agent-engine';
import { VirtualFS } from '../lib/virtual-fs';
import { loadSettings, saveSettings, getActiveProvider, type Settings as AppSettings, type ProviderKey, addCustomProvider } from '../lib/settings';
import { testProvider } from '../lib/llm-providers';
import { getCurrentUser } from '../lib/auth';
import {
  createProject, getActiveProjectId, setActiveProjectId, getProject,
  addMemory, createCheckpoint, restoreCheckpoint, listProjects, deleteProject,
  type Project, type Checkpoint
} from '../lib/memory';
import { createCostTracker, addRequest, formatCost, type CostTracker } from '../lib/cost-tracker';
import { loadProjectInstructions, saveProjectInstructions, DEFAULT_INSTRUCTIONS_TEMPLATE } from '../lib/project-instructions';
import { executeSlashCommand, isSlashCommand, type CommandContext } from '../lib/slash-commands';
import FileEditor from '../components/FileEditor';
import Terminal from '../components/Terminal';
import GitPanel from '../components/GitPanel';
import DeployPanel from '../components/DeployPanel';
import { SetupModal, shouldShowSetup } from '../components/SetupModal';
import ImageInput from '../components/ImageInput';
import ContextWindowIndicator from '../components/ContextWindowIndicator';
import ConversationSearch from '../components/ConversationSearch';
import PermissionDialog from '../components/PermissionDialog';
import type { ThreadMessage, ImageAttachment } from '../lib/types';
import { calculateContextUsage, shouldAutoCompact, compactMessages } from '../lib/context-window';
import { PermissionManager } from '../lib/permission-system';
import { saveSession, loadSession } from '../lib/session-resume';
import { exportConversation, downloadExport } from '../lib/conversation-export';
import { fileToImageAttachment } from '../lib/image-input';
import { VirtualGit } from '../lib/virtual-git';
import TemplateGallery from '../components/TemplateGallery';
import { applyTemplate, getTemplate, type Template } from '../lib/template-library';
import { analyzeError, comprehensiveAnalysis } from '../lib/ai-debugger';
import { loadMCPServers, type MCPServer } from '../lib/mcp-client';
import { CollaborativeSession, type CollaborativeUser } from '../lib/collaborative';
import DebugPanel from '../components/DebugPanel';
import MCPPanel from '../components/MCPPanel';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WorkflowEditor from '../components/WorkflowEditor';
import SecurityPanel from '../components/SecurityPanel';
import PluginManager from '../components/PluginManager';

/* ─── Types ─── */
type RunStatus = 'idle' | 'running' | 'done' | 'error';
type Tab = 'preview' | 'editor' | 'terminal' | 'files' | 'git' | 'deploy' | 'debug' | 'mcp' | 'collaboration' | 'analytics' | 'workflows' | 'security' | 'plugins';

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
  const [showCostModal, setShowCostModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showSetup, setShowSetup] = useState(false); // Не показывать автоматически
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Cost tracking
  const [costTracker, setCostTracker] = useState<CostTracker>(createCostTracker());

  // Streaming state
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // New features state
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [permissionRequest, setPermissionRequest] = useState<import('../lib/permission-system').PermissionRequest | null>(null);
  const permissionManagerRef = useRef(new PermissionManager());
  
  // Git state
  const [git, setGit] = useState<VirtualGit>(new VirtualGit());

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef<VirtualFS | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-save session
  useEffect(() => {
    if (project && messages.length > 0) {
      const files = fs ? fs.exportAsJSON() : {};
      saveSession({
        projectId: project.id,
        messages,
        files,
        timestamp: Date.now(),
        prompt,
      });
    }
  }, [messages, fs, project, prompt]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Ctrl+Enter to send
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleRun();
        }
        return;
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            handleCompact();
            break;
          case 'l':
            e.preventDefault();
            handleClear();
            break;
          case 'm':
            e.preventDefault();
            setShowSettings(true);
            break;
          case 'f':
            e.preventDefault();
            setShowSearch(true);
            break;
        }
      }

      // Esc to stop
      if (e.key === 'Escape' && status === 'running') {
        e.preventDefault();
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, prompt]);

  // Handle agent events (with streaming)
  const handleEvent = useCallback((event: AgentEvent) => {
    switch (event.type) {
      case 'token':
        // Streaming token — append to current streaming message
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'streaming') {
            return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + event.content }];
          }
          // Start new streaming message
          const id = 'stream-' + Date.now();
          setStreamingMessageId(id);
          return [...prev, { id, type: 'streaming', content: event.content, timestamp: Date.now() }];
        });
        break;

      case 'thinking':
        // Finalize streaming message and add thinking
        if (streamingMessageId) {
          setMessages(prev => prev.map(m => m.id === streamingMessageId ? { ...m, type: 'thinking' } : m));
          setStreamingMessageId(null);
        }
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'thinking',
          content: event.content,
          timestamp: Date.now(),
          collapsed: event.content.length > 200,
        }]);
        break;

      case 'tool_call':
        // Finalize streaming message
        if (streamingMessageId) {
          setMessages(prev => prev.map(m => m.id === streamingMessageId ? { ...m, type: 'thinking' } : m));
          setStreamingMessageId(null);
        }
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'tool_call',
          content: JSON.stringify(event.args, null, 2),
          tool: event.tool,
          result: event.result,
          timestamp: Date.now(),
        }]);
        break;

      case 'tool_call_streaming':
        // Show tool call being streamed
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'streaming' && lastMsg.tool === event.tool) {
            return [...prev.slice(0, -1), { ...lastMsg, content: event.argsPartial }];
          }
          const id = 'stream-' + Date.now();
          setStreamingMessageId(id);
          return [...prev, { id, type: 'streaming', content: event.argsPartial, tool: event.tool, timestamp: Date.now() }];
        });
        break;

      case 'console':
        break;

      case 'file_written':
        if (streamingMessageId) {
          setMessages(prev => prev.map(m => m.id === streamingMessageId ? { ...m, type: 'thinking' } : m));
          setStreamingMessageId(null);
        }
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `📄 ${event.path} (${event.size} bytes)`,
          timestamp: Date.now(),
        }]);
        if (fsRef.current) {
          const files = fsRef.current.getAll();
          const newFs = new VirtualFS();
          files.forEach(f => newFs.write(f.path, f.content));
          setFs(newFs);
        }
        break;

      case 'error':
        if (streamingMessageId) {
          setMessages(prev => prev.map(m => m.id === streamingMessageId ? { ...m, type: 'thinking' } : m));
          setStreamingMessageId(null);
        }
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
        // Update cost tracker
        const provider = getActiveProvider(settings);
        if (provider) {
          setCostTracker(prev => addRequest(prev, provider.model || 'unknown', event.prompt_tokens, event.completion_tokens));
        }
        break;

      case 'done':
        if (streamingMessageId) {
          setMessages(prev => prev.map(m => m.id === streamingMessageId ? { ...m, type: 'thinking' } : m));
          setStreamingMessageId(null);
        }
        if (event.artifact) setArtifact(event.artifact);
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now() + Math.random(),
          type: 'system',
          content: `✅ ${event.summary}`,
          timestamp: Date.now(),
        }]);
        setStatus('done');
        if (project && fsRef.current) {
          createCheckpoint(project, `Run complete: ${event.summary.slice(0, 50)}`, fsRef.current, messages.length);
          
          // Auto-commit to git
          git.stageAll(fsRef.current);
          const commit = git.commit(`AI: ${event.summary.slice(0, 60)}`, 'AI Agent', fsRef.current);
          if (commit) {
            setGit(new VirtualGit()); // Force re-render
          }
        }
        
        // Auto-compact if context is getting full
        setMessages(prev => {
          const context = calculateContextUsage(prev);
          if (shouldAutoCompact(context)) {
            return compactMessages(prev, 15);
          }
          return prev;
        });
        break;
    }
  }, [project, messages.length, streamingMessageId, settings]);

  // Handle slash commands
  const handleSlashCommand = (input: string): boolean => {
    if (!isSlashCommand(input)) return false;

    const context: CommandContext = {
      clearMessages: handleClear,
      compactMessages: handleCompact,
      setModel: (model) => {
        const provider = getActiveProvider(settings);
        if (provider) {
          const updated = { ...settings, providers: settings.providers.map(p => p.id === provider.id ? { ...p, model } : p) };
          setSettings(updated);
          saveSettings(updated);
        }
      },
      getCurrentModel: () => getActiveProvider(settings)?.model || 'unknown',
      getCostSummary: () => {
        return `Session Cost: ${formatCost(costTracker.totalCost)}
Total Tokens: ${costTracker.totalPromptTokens + costTracker.totalCompletionTokens}
  - Input: ${costTracker.totalPromptTokens}
  - Output: ${costTracker.totalCompletionTokens}
Requests: ${costTracker.requests.length}`;
      },
      getInstructions: () => loadProjectInstructions().content,
      setInstructions: (content) => saveProjectInstructions(content),
      initProject: () => saveProjectInstructions(DEFAULT_INSTRUCTIONS_TEMPLATE),
      exportConversation: (format) => {
        const content = exportConversation(messages, format, project?.name || 'Untitled');
        downloadExport(content, project?.name || 'conversation', format);
      },
      getContextStatus: () => {
        const context = calculateContextUsage(messages);
        return `Context: ${context.usedTokens.toLocaleString()} / ${context.maxTokens.toLocaleString()} tokens (${context.percentage.toFixed(1)}%)`;
      },
      clearPermissions: () => {
        permissionManagerRef.current.clearRememberedPermissions();
      },
      resumeSession: () => {
        const session = loadSession();
        if (session) {
          setMessages(session.messages);
          if (session.files) {
            const newFs = new VirtualFS();
            Object.entries(session.files).forEach(([path, content]) => newFs.write(path, content));
            setFs(newFs);
          }
        }
      },
      gitCommit: (message) => {
        if (fs) {
          git.stageAll(fs);
          const commit = git.commit(message, 'AI Agent', fs);
          if (commit) {
            setGit(new VirtualGit()); // Force re-render
          }
        }
      },
      gitStatus: () => {
        if (!fs) return 'No filesystem available';
        const status = git.getStatus(fs);
        const parts = [];
        if (status.modified.length > 0) parts.push(`Modified: ${status.modified.join(', ')}`);
        if (status.untracked.length > 0) parts.push(`Untracked: ${status.untracked.join(', ')}`);
        if (status.deleted.length > 0) parts.push(`Deleted: ${status.deleted.join(', ')}`);
        return parts.length > 0 ? parts.join('\n') : 'No changes';
      },
      gitLog: () => {
        const history = git.getHistory(10);
        if (history.length === 0) return 'No commits yet';
        return history.map(c => `${c.hash.substring(0, 7)} - ${c.message} (${c.author}, ${new Date(c.timestamp).toLocaleString()})`).join('\n');
      },
      deploy: (provider) => {
        setActiveTab('deploy');
        setMessages(prev => [...prev, {
          id: 'msg-' + Date.now(),
          type: 'system',
          content: `🚀 Opening deploy panel for ${provider}...`,
          timestamp: Date.now(),
        }]);
      },
      showTemplates: () => {
        setShowTemplateGallery(true);
      },
    };

    const result = executeSlashCommand(input, context);
    if (result) {
      setMessages(prev => [...prev, {
        id: 'msg-' + Date.now(),
        type: result.type === 'error' ? 'error' : 'system',
        content: result.message,
        timestamp: Date.now(),
      }]);
      return true;
    }
    return false;
  };

  // Run agent
  const handleRun = async () => {
    if (!prompt.trim()) return;

    // Check for slash command
    if (handleSlashCommand(prompt)) {
      setPrompt('');
      return;
    }

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

    if (!project) {
      const p = createProject(prompt.slice(0, 40));
      setProject(p);
    }

    setStatus('running');
    
    // Build prompt with images if any
    let finalPrompt = prompt;
    if (images.length > 0) {
      const imageDescriptions = images.map((img, i) => 
        `[Image ${i + 1}: ${img.name}]`
      ).join('\n');
      finalPrompt = `${prompt}\n\nAttached images:\n${imageDescriptions}`;
    }
    
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'user',
      content: finalPrompt,
      timestamp: Date.now(),
    }]);
    setArtifact('');
    setIteration(0);

    if (!fs) {
      setFs(new VirtualFS());
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Load project instructions
    const instructions = loadProjectInstructions().content;

    try {
      const result = await runAgent({
        provider,
        prompt: finalPrompt,
        onEvent: handleEvent,
        signal: controller.signal,
        projectInstructions: instructions,
      });
      setFs(result.fs);
      fsRef.current = result.fs;

      if (project) {
        addMemory(project, prompt, `Built artifact`, result.fs, costTracker.totalPromptTokens + costTracker.totalCompletionTokens);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        handleEvent({ type: 'error', message: e.message });
      }
    }

    setPrompt('');
    setImages([]); // Clear images after sending
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStatus('idle');
  };

  const handleClear = () => {
    setMessages([]);
    setPrompt('');
  };

  const handleCompact = () => {
    // Keep only last 10 messages
    setMessages(prev => prev.slice(-10));
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'system',
      content: '✓ Conversation compacted',
      timestamp: Date.now(),
    }]);
  };

  const handleReset = () => {
    handleStop();
    setPrompt('');
    setMessages([]);
    setFs(null);
    fsRef.current = null;
    setArtifact('');
    setIteration(0);
    setStatus('idle');
    setEditingFile(null);
    setCostTracker(createCostTracker());
  };

  // Template operations
  const handleApplyTemplate = (template: Template) => {
    const newFs = new VirtualFS();
    applyTemplate(template, newFs);
    setFs(newFs);
    fsRef.current = newFs;
    setShowTemplateGallery(false);
    
    // Auto-commit template
    const gitCommit = new VirtualGit();
    gitCommit.stageAll(newFs);
    gitCommit.commit(`Apply template: ${template.name}`, 'AI Agent', newFs);
    setGit(gitCommit);
    
    setMessages(prev => [...prev, {
      id: 'msg-' + Date.now(),
      type: 'system',
      content: `📋 Applied template: ${template.name}`,
      timestamp: Date.now(),
    }]);
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
    { id: 'git', label: 'Git', icon: GitBranch },
    { id: 'deploy', label: 'Deploy', icon: Rocket },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'mcp', label: 'MCP', icon: Plug },
    { id: 'collaboration', label: 'Collab', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'plugins', label: 'Plugins', icon: Package },
  ];

  return (
    <main className="pt-16 flex flex-col" style={{ backgroundColor: 'var(--bg)', height: 'calc(100vh - 64px)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500 animate-pulse' : status === 'done' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {status === 'idle' ? 'Ready' : status === 'running' ? `Step ${iteration}` : status === 'done' ? 'Done' : 'Error'}
            </span>
          </div>
          {activeProvider && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 flex items-center gap-1">
              <Zap size={10} /> {activeProvider.name}
            </span>
          )}
          {costTracker.totalCost > 0 && (
            <button onClick={() => setShowCostModal(true)} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1 hover:bg-emerald-500/20 transition-colors">
              <DollarSign size={10} /> {formatCost(costTracker.totalCost)}
            </button>
          )}
          <div className="w-32">
            <ContextWindowIndicator
              context={calculateContextUsage(messages)}
              onCompact={handleCompact}
            />
          </div>
          {project && (
            <button onClick={() => setShowProjectPicker(true)} className="text-xs px-2 py-0.5 rounded border hover:border-brand-500 transition-colors flex items-center gap-1"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <FolderOpen size={10} /> {project.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInstructionsModal(true)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }} title="Project instructions">
            <FileCode size={14} />
          </button>
          <button onClick={handleCreateCheckpoint} disabled={!fs} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10 disabled:opacity-30" style={{ color: 'var(--text-muted)' }} title="Create checkpoint">
            <History size={14} />
          </button>
          <button onClick={() => setShowCheckpoints(true)} disabled={!project || project.checkpoints.length === 0} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10 disabled:opacity-30" style={{ color: 'var(--text-muted)' }} title="Checkpoints">
            <Clock size={14} /> {project?.checkpoints.length || 0}
          </button>
          <button onClick={() => setShowTemplateGallery(true)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }} title="Templates">
            <FileText size={14} /> Templates
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel - Thread */}
        <div className="w-96 border-r flex flex-col min-h-0" style={{ borderColor: 'var(--border)' }}>
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
                  {!activeProvider ? 'Configure an API key in Settings' : 'Type /help for commands'}
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
                    msg.type === 'thinking' || msg.type === 'streaming' ? 'bg-purple-500/5 border border-purple-500/10' :
                    msg.type === 'tool_call' ? 'bg-orange-500/5 border border-orange-500/10' :
                    msg.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                    'border'
                  }`}
                  style={{ borderColor: msg.type === 'system' ? 'var(--border)' : undefined }}
                >
                  <button onClick={() => handleBranch(idx)}
                    className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-brand-500/20 text-brand-400 transition-opacity"
                    title="Branch from here">
                    <GitBranch size={10} />
                  </button>

                  {msg.type === 'thinking' && (
                    <div className="flex items-center gap-1 text-purple-400 font-medium mb-1">
                      <Brain size={10} /> Extended Thinking
                      {msg.collapsed && (
                        <button onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, collapsed: !m.collapsed } : m))}
                          className="ml-auto text-[10px] text-purple-400 hover:text-purple-300">
                          expand
                        </button>
                      )}
                    </div>
                  )}
                  {msg.type === 'streaming' && !msg.tool && (
                    <div className="flex items-center gap-1 text-purple-400 font-medium mb-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Generating...
                    </div>
                  )}
                  {msg.type === 'tool_call' && (
                    <div className="flex items-center gap-1 text-orange-400 font-medium mb-1">
                      <Zap size={10} /> {msg.tool}
                    </div>
                  )}
                  <p className={`whitespace-pre-wrap break-words ${msg.collapsed ? 'line-clamp-2' : ''}`} style={{ color: msg.type === 'error' ? '#f87171' : 'var(--text-secondary)' }}>
                    {msg.content}
                    {msg.type === 'streaming' && <span className="inline-block w-1 h-3 bg-purple-400 animate-pulse ml-0.5" />}
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
            {images.length > 0 && (
              <div className="mb-2">
                <ImageInput images={images} onImagesChange={setImages} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      const newImages: ImageAttachment[] = [];
                      for (const file of Array.from(files)) {
                        const img = await fileToImageAttachment(file);
                        newImages.push(img);
                      }
                      setImages([...images, ...newImages]);
                    }
                  };
                  input.click();
                }}
                className="p-2 rounded-lg border hover:border-brand-500 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                title="Attach images"
              >
                <ImageIcon size={16} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && status !== 'running' && handleRun()}
                placeholder="Type /help for commands..."
                disabled={status === 'running'}
                className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-brand-500/50 transition-all disabled:opacity-50"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
              />
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg border hover:border-brand-500 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                title="Search (Ctrl+F)"
              >
                <Search size={16} />
              </button>
              <button onClick={handleRun} disabled={!prompt.trim() || status === 'running'}
                className="p-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center border-b px-2" style={{ borderColor: 'var(--border)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-brand-500 text-brand-500' : 'border-transparent hover:text-brand-400'
                }`}
                style={{ color: activeTab === tab.id ? undefined : 'var(--text-muted)' }}>
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
            {editingFile && activeTab === 'editor' && (
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{editingFile}</span>
            )}
          </div>

          <div className="flex-1 overflow-hidden p-4">
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

            {activeTab === 'editor' && (
              editingFile && fs ? (
                <FileEditor path={editingFile} content={editingContent} originalContent={originalContent}
                  onChange={setEditingContent} onSave={handleSaveFile} onClose={() => setEditingFile(null)} />
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

            {activeTab === 'terminal' && <Terminal fs={fs} />}

            {activeTab === 'files' && (
              <div className="h-full overflow-y-auto">
                {fs ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{fs.list().length} items</span>
                      <button onClick={handleDownloadAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:border-brand-500"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <Download size={12} /> Export
                      </button>
                    </div>
                    {fs.list().map((file, i) => (
                      <div key={i} onClick={() => file.type === 'file' && handleOpenFile(file.path)}
                        className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:border-brand-500/50 cursor-pointer"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                        {file.type === 'folder' ? <FolderOpen size={16} className="text-brand-500" /> : <FileText size={16} className="text-accent-500" />}
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

            {activeTab === 'git' && fs && (
              <GitPanel
                git={git}
                fs={fs}
                onCommit={(message) => {
                  git.stageAll(fs);
                  const commit = git.commit(message, 'AI Agent', fs);
                  if (commit) {
                    setGit(new VirtualGit()); // Force re-render
                    setMessages(prev => [...prev, {
                      id: 'msg-' + Date.now(),
                      type: 'system',
                      content: `✓ Committed: ${message} (${commit.hash.substring(0, 7)})`,
                      timestamp: Date.now(),
                    }]);
                  }
                }}
                onCheckout={(hash) => {
                  if (git.checkoutCommit(hash, fs)) {
                    setFs(new VirtualFS()); // Force re-render
                    setGit(new VirtualGit()); // Force re-render
                    setMessages(prev => [...prev, {
                      id: 'msg-' + Date.now(),
                      type: 'system',
                      content: `✓ Checked out commit ${hash.substring(0, 7)}`,
                      timestamp: Date.now(),
                    }]);
                  }
                }}
                onBranchChange={(branch) => {
                  git.checkout(branch);
                  setGit(new VirtualGit()); // Force re-render
                  setMessages(prev => [...prev, {
                    id: 'msg-' + Date.now(),
                    type: 'system',
                    content: `✓ Switched to branch: ${branch}`,
                    timestamp: Date.now(),
                  }]);
                }}
              />
            )}

            {activeTab === 'deploy' && (
              <DeployPanel
                fs={fs}
                projectName={project?.name || 'Untitled Project'}
                onDeploy={(result) => {
                  if (result.success) {
                    setMessages(prev => [...prev, {
                      id: 'msg-' + Date.now(),
                      type: 'system',
                      content: `🚀 Deployed to ${result.provider}: ${result.url}`,
                      timestamp: Date.now(),
                    }]);
                  } else {
                    setMessages(prev => [...prev, {
                      id: 'msg-' + Date.now(),
                      type: 'error',
                      content: `❌ Deployment failed: ${result.error}`,
                      timestamp: Date.now(),
                    }]);
                  }
                }}
              />
            )}

            {activeTab === 'debug' && (
              <DebugPanel
                onAnalyzeError={(error: string, code?: string) => {
                  const analysis = analyzeError(error, code);
                  setMessages(prev => [...prev, {
                    id: 'msg-' + Date.now(),
                    type: 'system',
                    content: `🔍 Error Analysis Complete: ${analysis.errorType} (${analysis.severity})`,
                    timestamp: Date.now(),
                  }]);
                }}
              />
            )}

            {activeTab === 'mcp' && (
              <MCPPanel />
            )}

            {activeTab === 'collaboration' && (
              <div className="h-full flex items-center justify-center bg-[var(--bg)]">
                <div className="text-center p-8">
                  <Share2 size={64} className="mx-auto mb-4 text-brand-500/30" />
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Collaboration</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Real-time collaboration features coming soon
                  </p>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p>✓ Presence indicators</p>
                    <p>✓ Conflict resolution</p>
                    <p>✓ Real-time sync</p>
                    <p>✓ Chat integration</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {activeTab === 'workflows' && (
              <WorkflowEditor />
            )}

            {activeTab === 'security' && (
              <SecurityPanel />
            )}

            {activeTab === 'plugins' && (
              <PluginManager />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSetup && <SetupModal onComplete={() => { setShowSetup(false); setSettings(loadSettings()); }} onSkip={() => setShowSetup(false)} />}
        {showSettings && <SettingsModal settings={settings} onSave={(s) => { setSettings(s); saveSettings(s); }} onClose={() => setShowSettings(false)} />}
        {showProjectPicker && (
          <ProjectPicker projects={listProjects()} activeId={project?.id || null}
            onSelect={(id) => { const p = getProject(id); if (p) { setProject(p); setActiveProjectId(id); } setShowProjectPicker(false); }}
            onCreate={() => { const p = createProject('New Project'); setProject(p); handleReset(); setShowProjectPicker(false); }}
            onDelete={(id) => { deleteProject(id); setShowProjectPicker(false); }}
            onClose={() => setShowProjectPicker(false)} />
        )}
        {showCheckpoints && project && <CheckpointPicker checkpoints={project.checkpoints} onRestore={handleRestoreCheckpoint} onClose={() => setShowCheckpoints(false)} />}
        {showCostModal && <CostModal tracker={costTracker} onClose={() => setShowCostModal(false)} />}
        {showInstructionsModal && <InstructionsModal onClose={() => setShowInstructionsModal(false)} />}
        {showTemplateGallery && (
          <TemplateGallery
            isOpen={showTemplateGallery}
            onClose={() => setShowTemplateGallery(false)}
            onApplyTemplate={handleApplyTemplate}
          />
        )}
        {showSearch && (
          <ConversationSearch
            messages={messages}
            onClose={() => setShowSearch(false)}
            onNavigateToMessage={(id) => {
              // Scroll to message
              const element = document.getElementById(`msg-${id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-brand-500');
                setTimeout(() => element.classList.remove('ring-2', 'ring-brand-500'), 2000);
              }
            }}
          />
        )}
        {permissionRequest && (
          <PermissionDialog
            request={permissionRequest}
            onApprove={(remember) => {
              if (remember) {
                permissionManagerRef.current.rememberPermission(permissionRequest.tool, true);
              }
              setPermissionRequest(null);
            }}
            onDeny={(remember) => {
              if (remember) {
                permissionManagerRef.current.rememberPermission(permissionRequest.tool, false);
              }
              setPermissionRequest(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─── Cost Modal ─── */
function CostModal({ tracker, onClose }: { tracker: CostTracker; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <DollarSign size={18} className="text-emerald-500" /> Session Cost
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-500">{formatCost(tracker.totalCost)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total session cost</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{tracker.totalPromptTokens}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Input tokens</p>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{tracker.totalCompletionTokens}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Output tokens</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Requests ({tracker.requests.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tracker.requests.slice(-5).reverse().map((req, i) => (
                <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono truncate">{req.model}</span>
                  <span className="text-emerald-500">{formatCost(req.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Instructions Modal ─── */
function InstructionsModal({ onClose }: { onClose: () => void }) {
  const [instructions, setInstructions] = useState(loadProjectInstructions().content);

  const handleSave = () => {
    saveProjectInstructions(instructions);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border p-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FileCode size={18} className="text-brand-500" /> Project Instructions (CLAUDE.md)
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          These instructions are injected into every prompt. Use them to define project context, coding standards, and preferences.
        </p>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          className="flex-1 min-h-[300px] p-3 rounded-lg border font-mono text-sm outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
          placeholder="# Project Instructions&#10;&#10;## Tech Stack&#10;- React + TypeScript&#10;- Tailwind CSS&#10;&#10;## Code Style&#10;- Use functional components&#10;- Prefer named exports"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700">Save</button>
          <button onClick={() => setInstructions(DEFAULT_INSTRUCTIONS_TEMPLATE)} className="px-4 py-2.5 rounded-xl border font-medium hover:border-brand-500" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Load Template</button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border font-medium hover:border-brand-500" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Settings Modal (same as before) ─── */
function SettingsModal({ settings, onSave, onClose }: { settings: AppSettings; onSave: (s: AppSettings) => void; onClose: () => void }) {
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
    setLocal(prev => ({ ...prev, providers: prev.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p), activeProviderId: id }));
  };

  const handleUpdateProvider = (id: string, updates: Partial<ProviderKey>) => {
    setLocal(prev => ({ ...prev, providers: prev.providers.map(p => p.id === id ? { ...p, ...updates } : p) }));
  };

  const handleAddCustom = () => {
    if (!customName || !customUrl || !customKey) return;
    const updated = addCustomProvider(local, customName, customUrl, customKey, customModel);
    setLocal(updated);
    setShowAddCustom(false);
    setCustomName(''); setCustomUrl(''); setCustomKey(''); setCustomModel('');
  };

  const handleRemoveCustom = (id: string) => {
    setLocal(prev => ({ ...prev, providers: prev.providers.filter(p => p.id !== id), activeProviderId: prev.activeProviderId === id ? null : prev.activeProviderId }));
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
          <p className="text-xs text-blue-400"><strong>Privacy:</strong> Keys stored in browser only. <strong>CORS:</strong> OpenRouter, Anthropic, Groq work from browser.</p>
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
  projects: Project[]; activeId: string | null; onSelect: (id: string) => void; onCreate: () => void; onDelete: (id: string) => void; onClose: () => void;
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
              style={{ borderColor: p.id === activeId ? undefined : 'var(--border)' }} onClick={() => onSelect(p.id)}>
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
function CheckpointPicker({ checkpoints, onRestore, onClose }: { checkpoints: Checkpoint[]; onRestore: (cp: Checkpoint) => void; onClose: () => void }) {
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
              <button onClick={() => onRestore(cp)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Restore</button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
