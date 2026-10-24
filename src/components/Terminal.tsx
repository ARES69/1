/**
 * Terminal — interactive shell emulator that executes commands in the VirtualFS.
 * Supports: ls, cat, pwd, cd, mkdir, touch, rm, echo, grep, head, tail, wc, clear, help
 */

import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Maximize2, Minimize2 } from 'lucide-react';
import type { VirtualFS } from '../lib/virtual-fs';

interface TerminalProps {
  fs: VirtualFS | null;
  onCommand?: (cmd: string, output: string) => void;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  content: string;
  prompt?: string;
}

export default function Terminal({ fs, onCommand }: TerminalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', content: 'RS-BUILDER Terminal v1.0\nType "help" for available commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [maximized, setMaximized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (rawCmd: string): string => {
    const cmd = rawCmd.trim();
    if (!cmd) return '';

    const parts = cmd.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        return `Available commands:
  ls [path]        List files in directory
  cat <file>       Display file contents
  pwd              Print working directory
  cd <path>        Change directory
  mkdir <path>     Create directory (creates marker file)
  touch <file>     Create empty file
  rm <file>        Delete file
  echo <text>      Print text
  grep <pat> <f>   Search for pattern in file
  head <file>      Show first 10 lines
  tail <file>      Show last 10 lines
  wc <file>        Word/line/char count
  clear            Clear terminal
  help             Show this help`;

      case 'ls': {
        if (!fs) return '(no filesystem)';
        const dir = args[0] ? resolvePath(args[0]) : cwd;
        const files = fs.list(dir === '/' ? undefined : dir);
        if (files.length === 0) return '(empty)';
        return files.map(f => f.type === 'folder' ? `\x1b[34m${f.name}/\x1b[0m` : f.name).join('  ');
      }

      case 'cat': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: cat <file>';
        const path = resolvePath(args[0]);
        const content = fs.read(path);
        if (content === null) return `cat: ${args[0]}: No such file`;
        return content;
      }

      case 'pwd':
        return cwd;

      case 'cd': {
        if (!args[0]) { setCwd('/'); return ''; }
        if (args[0] === '..') {
          const parts = cwd.split('/').filter(Boolean);
          parts.pop();
          setCwd('/' + parts.join('/') || '/');
          return '';
        }
        if (args[0] === '/') { setCwd('/'); return ''; }
        const newPath = resolvePath(args[0]);
        setCwd(newPath);
        return '';
      }

      case 'mkdir': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: mkdir <path>';
        const path = resolvePath(args[0]);
        fs.write(path + '/.dir', '');
        return '';
      }

      case 'touch': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: touch <file>';
        const path = resolvePath(args[0]);
        if (!fs.exists(path)) fs.write(path, '');
        return '';
      }

      case 'rm': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: rm <file>';
        const path = resolvePath(args[0]);
        if (fs.delete(path)) return '';
        return `rm: ${args[0]}: No such file`;
      }

      case 'echo':
        return args.join(' ');

      case 'grep': {
        if (!fs) return '(no filesystem)';
        if (args.length < 2) return 'Usage: grep <pattern> <file>';
        const path = resolvePath(args[1]);
        const content = fs.read(path);
        if (content === null) return `grep: ${args[1]}: No such file`;
        const pattern = args[0];
        const matches = content.split('\n').filter(line => line.includes(pattern));
        return matches.length > 0 ? matches.join('\n') : '(no matches)';
      }

      case 'head': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: head <file>';
        const path = resolvePath(args[0]);
        const content = fs.read(path);
        if (content === null) return `head: ${args[0]}: No such file`;
        return content.split('\n').slice(0, 10).join('\n');
      }

      case 'tail': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: tail <file>';
        const path = resolvePath(args[0]);
        const content = fs.read(path);
        if (content === null) return `tail: ${args[0]}: No such file`;
        return content.split('\n').slice(-10).join('\n');
      }

      case 'wc': {
        if (!fs) return '(no filesystem)';
        if (!args[0]) return 'Usage: wc <file>';
        const path = resolvePath(args[0]);
        const content = fs.read(path);
        if (content === null) return `wc: ${args[0]}: No such file`;
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        return `  ${lines}  ${words}  ${chars} ${args[0]}`;
      }

      case 'clear':
        setHistory([]);
        return '';

      default:
        return `command not found: ${command}`;
    }
  };

  const resolvePath = (path: string): string => {
    if (path.startsWith('/')) return path;
    if (cwd === '/') return '/' + path;
    return cwd + '/' + path;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input;
    setInput('');
    setHistoryIdx(-1);

    const prompt = `user@rsb:${cwd}$ `;
    const newHistory: HistoryEntry[] = [...history, { type: 'input', content: cmd, prompt }];

    const output = executeCommand(cmd);
    if (output) {
      newHistory.push({ type: 'output', content: output });
    }

    setHistory(newHistory);
    if (cmd) {
      setCmdHistory(prev => [cmd, ...prev].slice(0, 50));
    }
    onCommand?.(cmd, output);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIdx < cmdHistory.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  // Colorize output (ANSI-like codes)
  const colorize = (text: string): string => {
    return text
      .replace(/\x1b\[34m(.*?)\x1b\[0m/g, '<span class="text-blue-400">$1</span>')
      .replace(/\x1b\[32m(.*?)\x1b\[0m/g, '<span class="text-emerald-400">$1</span>')
      .replace(/\x1b\[31m(.*?)\x1b\[0m/g, '<span class="text-red-400">$1</span>')
      .replace(/\x1b\[33m(.*?)\x1b\[0m/g, '<span class="text-yellow-400">$1</span>');
  };

  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden transition-all ${maximized ? 'fixed inset-4 z-50' : 'h-full'}`}
      style={{ borderColor: 'var(--border)', backgroundColor: '#0d1117' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#21262d', backgroundColor: '#161b22' }}>
        <div className="flex items-center gap-2">
          <TermIcon size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-slate-400">terminal — {cwd}</span>
        </div>
        <button
          onClick={() => setMaximized(!maximized)}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 transition-colors"
        >
          {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-3 font-mono text-xs cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry, i) => (
          <div key={i} className="mb-1">
            {entry.type === 'input' ? (
              <div className="flex">
                <span className="text-emerald-400 select-none">{entry.prompt}</span>
                <span className="text-slate-200">{entry.content}</span>
              </div>
            ) : (
              <pre
                className="text-slate-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: colorize(entry.content) }}
              />
            )}
          </div>
        ))}

        {/* Input line */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-emerald-400 select-none">user@rsb:{cwd}$ </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-200 outline-none ml-0 font-mono text-xs"
            autoFocus
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
